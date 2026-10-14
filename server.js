import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

// Start server
app.listen(PORT, () => {
  console.log(`✅ CLIMA Admin API server running on http://localhost:${PORT}`);
  console.log(`📧 SMTP configured: ${process.env.SMTP_USER}`);
});
