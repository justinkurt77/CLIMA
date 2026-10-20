import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { saveModifiedAdvisory, scrapeFacebookPage, syncFacebookPageViaGraphApi } from './server/facebookIngestionService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global rate limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Only count failed requests
  standardHeaders: true,
  legacyHeaders: false,
});

// Citizen registration limiter: allows adequate attempts while preventing brute force
const citizenAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again in a few minutes.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory pending registrations (DO NOT add users to auth.users until OTP verified & form submitted)
// email -> { otp, expiresAt, attempts, verified, verificationToken }
const pendingRegistrations = new Map();

// Periodic cleanup of expired pending registrations every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [emailKey, record] of pendingRegistrations.entries()) {
    if (record.expiresAt < now) {
      pendingRegistrations.delete(emailKey);
    }
  }
}, 5 * 60 * 1000);

// Security Middleware
// Helmet with custom CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://api.mapbox.com', 'https://events.mapbox.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://api.mapbox.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://*.supabase.co', 'https://api.mapbox.com', 'https://events.mapbox.com', 'wss://*.supabase.co', 'https://api.kloudtechsea.com'],
      workerSrc: ["'self'", 'blob:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  }
}));

// Tightened CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());

// Compression middleware for all responses
app.use(compression());

// Static asset caching (for production builds)
app.use('/assets', express.static('dist/assets', { maxAge: '1y', immutable: true }));
app.use(express.static('dist', { maxAge: '1h' }));

// Cache control for API responses
app.use((req, res, next) => {
  // Public endpoints can be cached
  if (req.path.includes('/health')) {
    res.set('Cache-Control', 'public, max-age=60'); // 1 minute
  } else {
    // API endpoints should not be cached
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
  next();
});

app.use('/api/', globalLimiter); // Apply global rate limiting to all API routes

// Supabase client (service role for admin operations)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this to .env
);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CLIMA Admin API is running' });
});

// Create admin user endpoint (with strict rate limiting)
app.post('/api/admin/create', authLimiter, async (req, res) => {
  try {
    const { email, full_name, assigned_categories, assigned_department } = req.body;

    // Validate input
    if (!email || !full_name) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Email and full name are required' 
      });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    // Password logged only in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔑 Generated password for ${email}: ${tempPassword}`);
    }

    // Create the user in Supabase Auth with service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'admin',
        full_name,
        assigned_categories: assigned_categories || ['All Categories'],
        assigned_department: assigned_department || null
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(500).json({ 
        error: 'Failed to create user in authentication system', 
        details: authError.message 
      });
    }

    // Create profile record
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role: 'admin',
        assigned_categories: assigned_categories || ['All Categories'],
        assigned_department: assigned_department || 'Not Assigned',
        must_change_password: true,  // Force password change on first login
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Continue anyway - the auth trigger should have created it
    }

    // Send welcome email with temporary password
    const mailOptions = {
      from: `"CLIMA Admin System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to CLIMA Admin - Your Account Details',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #373D20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .credentials { background: white; padding: 20px; border-left: 4px solid #373D20; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #373D20; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🌦️ CLIMA Admin Access</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${full_name}!</h2>
              <p>Your admin account for the <strong>CLIMA System</strong> (Climate Information Monitoring and Awareness) has been created.</p>
              
              <div class="credentials">
                <p><strong>📧 Email:</strong> ${email}</p>
                <p><strong>🔑 Temporary Password:</strong> <code>${tempPassword}</code></p>
              </div>

              <p><strong>⚠️ Important Security Notes:</strong></p>
              <ul>
                <li>Change your password immediately after your first login</li>
                <li>Never share your password with anyone</li>
                <li>Use a strong, unique password for this account</li>
                <li>This temporary password will expire after first use</li>
              </ul>

              <a href="${process.env.VITE_APP_URL || 'http://localhost:5173'}/admin" class="button">
                Login to Admin Dashboard
              </a>

              <div class="footer">
                <p>This is an automated message from CLIMA Admin System</p>
                <p>If you did not request this account, please contact the system administrator immediately.</p>
                <p>&copy; ${new Date().getFullYear()} Palayan City ICT Office</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: authData.user.id,
        email,
        full_name
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Citizen Registration & Forgot Password OTP endpoint via Nodemailer
app.post('/api/auth/send-user-otp', authLimiter, async (req, res) => {
  try {
    const { email, type = 'signup' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('List users error:', listError);
      return res.status(500).json({ error: 'Failed to verify account status' });
    }

    const existingUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    const linkType = type === 'recovery' ? 'recovery' : 'signup';
    let otpCode;
    const isSignup = linkType === 'signup';

    if (isSignup) {
      if (existingUser && existingUser.email_confirmed_at) {
        return res.status(400).json({
          error: 'This email is already registered! Please go back and Login.'
        });
      }
      // If user exists but was an abandoned unconfirmed record, delete it so auth.users stays clean
      if (existingUser && !existingUser.email_confirmed_at) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        } catch (e) {
          console.warn('Could not delete unconfirmed user:', e.message);
        }
      }

      // Generate a 6-digit OTP code directly in Node.js
      // CRITICAL: DO NOT create a user in Supabase auth.users at this stage!
      // This ensures that if the user closes the modal or never enters the OTP, NO user or email is added to Supabase.
      otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      pendingRegistrations.set(cleanEmail, {
        otp: otpCode,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        attempts: 0,
        verified: false,
      });
    } else {
      // linkType === 'recovery'
      if (!existingUser) {
        return res.status(404).json({
          error: 'No account found with this email address.'
        });
      }

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: cleanEmail,
      });

      if (linkError || !linkData?.properties?.email_otp) {
        console.error('generateLink recovery error:', linkError);
        return res.status(500).json({
          error: linkError?.message || 'Failed to generate reset code'
        });
      }

      otpCode = linkData.properties.email_otp;
    }

    // Send the email using Nodemailer with Gmail SMTP
    const mailOptions = {
      from: `"CLIMA Palayan City" <${process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: isSignup
        ? `Your CLIMA Verification Code: ${otpCode}`
        : `Your CLIMA Password Reset Code: ${otpCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f4f4f5; margin: 0; padding: 20px; }
            .card { max-width: 520px; margin: 0 auto; background: #18181b; border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 20px; padding: 32px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .header { text-align: center; margin-bottom: 24px; }
            .brand { color: #f97316; font-size: 28px; font-weight: 900; letter-spacing: 2px; margin: 0; }
            .subtitle { color: #a1a1aa; font-size: 13px; margin-top: 4px; }
            .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 8px; text-align: center; }
            .desc { font-size: 14px; color: #d4d4d8; text-align: center; margin-bottom: 24px; line-height: 1.5; }
            .otp-container { background: #27272a; border: 1px dashed #f97316; border-radius: 14px; padding: 18px 24px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #f97316; font-family: 'Courier New', Courier, monospace; }
            .otp-label { font-size: 11px; text-transform: uppercase; color: #a1a1aa; letter-spacing: 1.5px; margin-top: 6px; }
            .footer { font-size: 12px; color: #71717a; text-align: center; margin-top: 28px; line-height: 1.6; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">CLIMA</div>
              <div class="subtitle">Palayan City Disaster Monitoring & Awareness</div>
            </div>
            
            <div class="title">${isSignup ? 'Verify Your Account' : 'Password Reset Code'}</div>
            <div class="desc">
              ${isSignup
                ? 'Please use the verification code below to complete your registration in CLIMA.'
                : 'You requested to reset your password. Use the verification code below to proceed.'}
            </div>

            <div class="otp-container">
              <div class="otp-code">${otpCode}</div>
              <div class="otp-label">Verification Code (Valid for 10 minutes)</div>
            </div>

            <div style="font-size: 13px; color: #a1a1aa; text-align: center; line-height: 1.5;">
              Never share this code with anyone. If you did not request this, please safely ignore this email.
            </div>

            <div class="footer">
              &copy; ${new Date().getFullYear()} City of Palayan &bull; Climate Information Monitoring & Awareness
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      type: linkType
    });

  } catch (error) {
    console.error('Send user OTP error:', error);
    res.status(500).json({
      error: 'Failed to send verification code',
      details: error.message
    });
  }
});

// Verify citizen registration OTP (Validates against in-memory map without touching Supabase auth.users yet)
app.post('/api/auth/verify-registration-otp', citizenAuthLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pending = pendingRegistrations.get(cleanEmail);

    if (!pending || pending.expiresAt < Date.now()) {
      return res.status(400).json({
        error: 'Verification code expired or not requested. Please request a new code.'
      });
    }

    if (pending.attempts >= 5) {
      pendingRegistrations.delete(cleanEmail);
      return res.status(400).json({
        error: 'Too many incorrect attempts. Please request a new verification code.'
      });
    }

    if (pending.otp !== otp.trim()) {
      pending.attempts += 1;
      return res.status(400).json({
        error: 'Invalid verification code. Please check your email and try again.'
      });
    }

    // Code is valid! Generate a verification session token for profile completion
    const verificationToken = crypto.randomBytes(32).toString('hex');
    pendingRegistrations.set(cleanEmail, {
      verified: true,
      verificationToken,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes to finish profile details
    });

    res.status(200).json({
      success: true,
      message: 'Code verified successfully.',
      verificationToken
    });
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    res.status(500).json({
      error: 'Failed to verify code',
      details: error.message
    });
  }
});

// Complete citizen registration - ONLY HERE is the user actually added to Supabase auth.users
app.post('/api/auth/complete-registration', citizenAuthLimiter, async (req, res) => {
  try {
    const { email, verificationToken, firstName, lastName, phone, password } = req.body;

    if (!email || !verificationToken || !firstName || !lastName || !password) {
      return res.status(400).json({
        error: 'Missing required registration fields (first name, last name, password).'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pending = pendingRegistrations.get(cleanEmail);

    if (
      !pending ||
      !pending.verified ||
      pending.verificationToken !== verificationToken ||
      pending.expiresAt < Date.now()
    ) {
      return res.status(400).json({
        error: 'Registration session expired or invalid. Please request a new verification code.'
      });
    }

    // Check if account already exists
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError && usersData?.users) {
      const existingUser = usersData.users.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (existingUser && existingUser.email_confirmed_at) {
        return res.status(400).json({
          error: 'An account with this email already exists. Please log in.'
        });
      }
      if (existingUser && !existingUser.email_confirmed_at) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        } catch (e) {
          console.warn('Could not clean unconfirmed duplicate:', e.message);
        }
      }
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    // Now, and ONLY now, create the user in Supabase auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: fullName,
        phone: phone ? phone.trim() : null,
        role: 'citizen',
        profile_completed: true,
      }
    });

    if (authError) {
      console.error('Supabase createUser error in complete-registration:', authError);
      return res.status(500).json({
        error: authError.message || 'Failed to create user account'
      });
    }

    // Upsert to profiles table
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        email: cleanEmail,
        full_name: fullName,
        phone: phone ? phone.trim() : null,
        role: 'citizen',
        updated_at: new Date().toISOString()
      });
    } catch (profileErr) {
      console.warn('Profile sync warning in complete-registration:', profileErr.message);
    }

    // Clean up pending registration
    pendingRegistrations.delete(cleanEmail);

    res.status(200).json({
      success: true,
      message: 'Account successfully registered and confirmed.',
      user: authData.user
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({
      error: 'Failed to complete registration',
      details: error.message
    });
  }
});

// Send OTP for forgot password (with strict rate limiting)
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists and is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'No admin account found with this email' });
    }

    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
      return res.status(403).json({ error: 'This feature is only available for admin accounts' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .insert({
        user_id: profile.id,
        email: email,
        otp_code: otp,
        expires_at: expiresAt.toISOString()
      });

    if (otpError) {
      console.error('OTP storage error:', otpError);
      return res.status(500).json({ error: 'Failed to generate OTP' });
    }

    // Send OTP email
    const mailOptions = {
      from: `"CLIMA Admin System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset OTP - CLIMA Admin',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #373D20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .otp-box { background: white; padding: 20px; border-left: 4px solid #373D20; margin: 20px 0; text-align: center; }
            .otp-code { font-size: 32px; font-weight: 900; color: #373D20; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${profile.full_name || 'Admin'},</h2>
              <p>You requested to reset your password for your CLIMA Admin account.</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Your OTP Code:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0; font-size: 12px; color: #666;">Valid for 10 minutes</p>
              </div>

              <p><strong>⚠️ Security Notice:</strong></p>
              <ul>
                <li>This OTP is valid for <strong>10 minutes</strong></li>
                <li>Never share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password has not been changed yet</li>
              </ul>

              <div class="footer">
                <p>This is an automated message from CLIMA Admin System</p>
                <p>&copy; ${new Date().getFullYear()} Palayan City ICT Office</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Verify OTP and reset password (with strict rate limiting)
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    // Verify OTP using database function
    const { data: verification, error: verifyError } = await supabaseAdmin
      .rpc('verify_password_reset_otp', {
        p_email: email,
        p_otp_code: otp
      });

    if (verifyError || !verification || verification.length === 0) {
      return res.status(400).json({ error: 'Failed to verify OTP' });
    }

    const result = verification[0];
    if (!result.valid) {
      return res.status(400).json({ error: result.message || 'Invalid or expired OTP' });
    }

    // Update password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      result.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    // Update profiles table to mark password as changed
    await supabaseAdmin
      .from('profiles')
      .update({
        must_change_password: false,
        last_password_change: new Date().toISOString()
      })
      .eq('id', result.user_id);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Change password (for first-time login or regular password change) (with strict rate limiting)
app.post('/api/auth/change-password', authLimiter, async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required' });
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password change error:', updateError);
      return res.status(500).json({ error: 'Failed to change password' });
    }

    // Update profiles table
    await supabaseAdmin
      .from('profiles')
      .update({
        must_change_password: false,
        last_password_change: new Date().toISOString()
      })
      .eq('id', userId);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// ==========================================
// FACEBOOK HASHTAG INGESTION & SCRAPING
// ==========================================

// Ingest a raw Facebook post, modify it, and publish directly to Advisories
app.post('/api/advisories/ingest-facebook', async (req, res) => {
  try {
    const { text, imageUrl, publishedAt, hashtag } = req.body;
    const targetHashtag = hashtag || process.env.FB_TARGET_HASHTAG || '#PalayanAdvisoryElNino';

    const result = await saveModifiedAdvisory({
      rawText: text,
      imageUrl,
      publishedAt,
      targetHashtag
    });

    res.json(result);
  } catch (err) {
    console.error('Ingest FB error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger a live Facebook sync on-demand (Graph API primary, fallback scraper secondary)
app.post('/api/advisories/sync-facebook', async (req, res) => {
  try {
    const { pageUrl, hashtag, useScraper = false } = req.body || {};
    const targetHashtag = hashtag || process.env.FB_TARGET_HASHTAG || '#PalayanAdvisoryElNino';

    // Prefer official Graph API if configured
    if (!useScraper && process.env.FB_PAGE_ACCESS_TOKEN && process.env.FB_PAGE_ID) {
      const graphResult = await syncFacebookPageViaGraphApi({ targetHashtag });
      return res.json({ method: 'graph_api', ...graphResult });
    }

    // Fallback: Headless scraping
    const targetUrl = pageUrl || process.env.FB_PAGE_URL || 'https://www.facebook.com/PalayanCityOfficial';
    const result = await scrapeFacebookPage({ pageUrl: targetUrl, targetHashtag });
    res.json({ method: 'scraper', ...result });
  } catch (err) {
    console.error('Sync FB error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
// Clear or purge audit logs endpoint (superadmin action)
app.post('/api/admin/clear-audit-logs', async (req, res) => {
  try {
    const { purgeOnlyDummy = false, specificIds = [] } = req.body || {};

    if (Array.isArray(specificIds) && specificIds.length > 0) {
      const { error } = await supabaseAdmin.from('audit_logs').delete().in('id', specificIds);
      if (error) throw error;
      return res.json({ success: true, deleted: specificIds.length });
    }

    if (purgeOnlyDummy) {
      const { data: logs, error: fetchErr } = await supabaseAdmin.from('audit_logs').select('*');
      if (fetchErr) throw fetchErr;

      const dummyKeywords = [
        'bollywood', 'jantar mantar', 'fathom', 'indonesian', 'palangka raya',
        'nepal', 'australia', 'pupils and a teacher', 'children were buried',
        'chinese foreign minister', 'satellite images give clues', 'saudi arabia',
        'nay pyi taw', 'bbc is in central', 'jordon steele-john', 'gunmen firing shots',
        'kolkata'
      ];

      const dummyIds = (logs || []).filter(d => {
        const title = (d.new_data?.title || d.old_data?.title || d.new_data?.name || d.old_data?.name || '').toLowerCase().trim();
        const content = (d.new_data?.content || d.old_data?.content || '').toLowerCase();
        if (!title && !content) return true;
        if (title === 'test' || title === 'a' || title.startsWith('test') || title.includes('probe')) return true;
        if (title.startsWith('advisory ca208da9')) return true;
        if (title.includes('obstructed sidewalks')) return true;
        return dummyKeywords.some(k => title.includes(k) || content.includes(k));
      }).map(d => d.id);

      if (dummyIds.length > 0) {
        const { error: delErr } = await supabaseAdmin.from('audit_logs').delete().in('id', dummyIds);
        if (delErr) throw delErr;
      }
      return res.json({ success: true, deleted: dummyIds.length });
    }

    // Delete all audit logs
    const { error } = await supabaseAdmin.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    res.json({ success: true, message: 'All audit logs cleared successfully' });
  } catch (err) {
    console.error('Clear audit logs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete individual audit log
app.delete('/api/admin/audit-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('audit_logs').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, id });
  } catch (err) {
    console.error('Delete audit log error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`✅ CLIMA Admin API server running on http://localhost:${PORT}`);
  console.log(`📧 SMTP configured: ${process.env.SMTP_USER}`);
  console.log(`📡 Facebook Monitor active: Page ID ${process.env.FB_PAGE_ID || 'None'}, Hashtag ${process.env.FB_TARGET_HASHTAG || '#PalayanAdvisoryElNino'}`);

  // Auto-sync on startup if credentials exist
  if (process.env.FB_PAGE_ACCESS_TOKEN && process.env.FB_PAGE_ID) {
    console.log('🚀 [FB Auto-Sync] Performing initial Facebook advisory sync...');
    syncFacebookPageViaGraphApi().catch(err => {
      console.error('Startup FB sync error:', err.message);
    });

    // Schedule background sync every 15 minutes
    setInterval(() => {
      console.log('⏰ [FB Auto-Sync] Running scheduled background sync...');
      syncFacebookPageViaGraphApi().catch(err => {
        console.error('Scheduled FB sync error:', err.message);
      });
    }, 15 * 60 * 1000);
  }
});
