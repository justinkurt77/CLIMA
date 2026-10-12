# 🚀 CLIMA Admin System - Quick Start Guide

## Prerequisites Checklist

Before starting, make sure you have:

- [x] Node.js installed
- [x] npm packages installed (`npm install` already done)
- [x] Supabase project created
- [x] `.env` file configured
- [ ] **Supabase Service Role Key** added to `.env` (REQUIRED!)

## Step 1: Get Supabase Service Role Key ⚠️ CRITICAL

This is REQUIRED for the admin creation API to work:

1. Go to https://supabase.com/dashboard
2. Select your CLIMA project
3. Click **Settings** (⚙️ icon on left sidebar)
4. Click **API**
5. Scroll down to **Project API keys**
6. Copy the **service_role** key (NOT the anon key!)
7. Open `.env` file and replace:
   ```
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
   ```
   With your actual service role key.

⚠️ **WARNING**: The service_role key has full admin access. Never commit it to Git or expose it to the client!

## Step 2: Start the Application

### Option A: Run Everything Together (Recommended)

```bash
npm run dev:all
```

This starts:
- Frontend dev server on http://localhost:5173
- Backend API server on http://localhost:3001

### Option B: Run Separately (for debugging)

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
npm run server
```

## Step 3: Verify Everything Works

### Test Backend API

Open http://localhost:3001/api/health in your browser. You should see:
```json
{
  "status": "ok",
  "message": "CLIMA Admin API is running"
}
```

### Test Frontend

Open http://localhost:5173 in your browser. The CLIMA homepage should load.

## Step 4: Login as Superadmin

1. Go to http://localhost:5173
2. Click **Admin Login** (bottom of page)
3. Login with your superadmin account:
   - Email: (your superadmin email)
   - Password: (your superadmin password)

## Step 5: Test Permission System

### Create a Test Admin with Limited Permissions

1. In Admin Dashboard, go to **Settings** tab
2. Scroll to **Module Permissions** section
3. Select an admin from dropdown (or create one first in Users tab)
4. Click a role template (e.g., "CDRRMO Admin")
5. Log out and log back in as that admin
6. ✅ You should only see Dashboard and CDRRMO Operations tabs!

### Create New Admin with Email

1. Go to **Users** tab
2. Fill in the "Create New Admin" form:
   - Full Name: Test Admin
   - Email: testadmin@example.com
   - Office: Select an office
3. Click **Create Admin**
4. ✅ An email will be sent to testadmin@example.com with temporary password
5. The new admin can login immediately with those credentials

## Features Now Working

### ✅ Permission System
- Tabs hide/show based on assigned module permissions
- Superadmins see everything
- Regular admins only see their assigned modules

### ✅ Module Permission Management
- Assign permissions via UI in Settings tab
- 8 role templates for quick assignment
- Granular CRUD permissions per module

### ✅ Admin Creation with Email
- Backend API creates admin accounts
- Automatic temporary password generation
- Professional welcome email via Gmail SMTP
- No Supabase email rate limits

### ✅ Multi-role Support
- Superadmin: Full access to all modules
- Regular Admin: Limited to assigned modules
- Role templates: Agriculture, CDRRMO, BFP, Hospital, Water, Power, etc.

## Troubleshooting

### "Failed to create admin" Error

**Cause**: Backend server not running or service role key missing

**Fix**:
1. Make sure backend is running (`npm run server`)
2. Check `.env` has `SUPABASE_SERVICE_ROLE_KEY` set
3. Restart the server after adding the key

### "Database error querying schema" on Login

**Cause**: RLS policies or auth trigger issues

**Fix**:
1. Run `FIX_PROFILES_RLS.sql` in Supabase SQL Editor
2. Run `FIX_ADMIN_USER_COMPLETE.sql`
3. Refresh the app

### Admin Can See All Tabs (Not Just Assigned Ones)

**Cause**: Permissions not assigned or not loaded

**Fix**:
1. Login as superadmin
2. Go to Settings → Module Permissions
3. Select the admin and apply a role template
4. Log out and log back in as that admin
5. Hard refresh (Ctrl+Shift+R)

### Email Not Sending

**Cause**: SMTP credentials wrong or Gmail blocking

**Fix**:
1. Verify `SMTP_USER` and `SMTP_PASS` in `.env`
2. Make sure it's an App Password (not regular password)
3. Enable 2FA on the Gmail account
4. Check backend console for error messages

### "CORS error" When Creating Admin

**Cause**: Frontend calling backend but CORS not allowing it

**Fix**:
- Make sure both frontend and backend are running
- Backend automatically allows all origins in dev mode
- If production, update CORS settings in `server.js`

## Module List Reference

Available modules for permission assignment:
- `dashboard` - Dashboard overview
- `reports` - Citizen reports management
- `advisories` - Official advisories
- `hospital` - Hospital monitoring
- `cdrrmo` - CDRRMO operations & evacuations
- `bfp` - BFP operations
- `agriculture` - Agricultural damages
- `water` - Water utility interruptions
- `power` - Power utility interruptions
- `users` - User management (superadmin only)
- `settings` - Offices & categories (superadmin only)
- `logs` - Activity logs (superadmin only)

## Production Deployment Notes

When deploying to production:

1. **Backend Deployment**:
   - Deploy `server.js` to Render, Railway, or Heroku
   - Set environment variables in hosting dashboard
   - Update frontend to call production backend URL

2. **Frontend Deployment**:
   - Build: `npm run build`
   - Deploy `dist/` folder to Netlify, Vercel, or static host
   - Update `VITE_APP_URL` to production URL

3. **Security**:
   - Never commit `.env` to Git
   - Use environment variables in production
   - Update CORS to only allow your production domain
   - Add rate limiting to backend endpoints

## Support

If issues persist:
1. Check browser console (F12) for errors
2. Check backend terminal for server errors
3. Check Supabase Dashboard → Logs for database errors
4. Review `BACKEND_SETUP.md` for detailed API documentation
