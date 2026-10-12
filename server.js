import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

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

// Create admin user endpoint
app.post('/api/admin/create', async (req, res) => {
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
              <p>Your admin account for the <strong>CLIMA System</strong> (Palayan City Disaster Response Platform) has been created.</p>
              
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

// Start server
app.listen(PORT, () => {
  console.log(`✅ CLIMA Admin API server running on http://localhost:${PORT}`);
  console.log(`📧 SMTP configured: ${process.env.SMTP_USER}`);
});
