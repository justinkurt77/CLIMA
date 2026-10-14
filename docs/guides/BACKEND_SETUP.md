# CLIMA Backend API Setup

## Overview
Simple Express server that handles admin user creation with nodemailer email notifications, bypassing Supabase's email rate limits.

## Setup Instructions

### 1. Get Supabase Service Role Key
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (not the anon key!)
5. Update `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **IMPORTANT**: The service role key has full admin access. Never expose it to the client or commit it to Git.

### 2. Verify SMTP Credentials in .env
```
SMTP_USER=palayancityticketmanagementsys@gmail.com
SMTP_PASS=lpku yfnn dtbd uhwx
```

### 3. Start the Server

**Option A: Run backend only**
```bash
npm run server
```

**Option B: Run both frontend and backend together**
```bash
npm run dev:all
```

The API server will run on http://localhost:3001

### 4. Test the API

**Health Check:**
```bash
curl http://localhost:3001/api/health
```

**Create Admin (example):**
```bash
curl -X POST http://localhost:3001/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@example.com",
    "full_name": "New Admin User",
    "assigned_categories": ["CDRRMO", "BFP"],
    "assigned_department": null
  }'
```

## API Endpoints

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "CLIMA Admin API is running"
}
```

### POST /api/admin/create
Create a new admin user with email notification.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "full_name": "Admin Name",
  "assigned_categories": ["CDRRMO", "BFP"],  // optional, defaults to ["All Categories"]
  "assigned_department": null  // optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "full_name": "Admin Name"
  }
}
```

**Error Response (400/500):**
```json
{
  "error": "Error message",
  "details": "Detailed error description"
}
```

## Email Template

The welcome email includes:
- User's login email
- Temporary password
- Link to admin dashboard
- Security instructions

## Integration with Frontend

Update the `AdminDashboard.jsx` "Create Admin" form to call this API instead of Supabase directly:

```javascript
const handleCreateAdmin = async () => {
  const response = await fetch('http://localhost:3001/api/admin/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newAdmin.email,
      full_name: newAdmin.full_name,
      assigned_categories: newAdmin.assigned_categories
    })
  });
  
  const data = await response.json();
  // Handle response...
};
```

## Production Deployment

For production:
1. Deploy the backend to a service like Render, Railway, or Heroku
2. Update `VITE_APP_URL` in `.env` to your production URL
3. Update frontend API calls to use the production backend URL
4. Ensure `.env` is in `.gitignore` (never commit secrets!)

## Security Checklist

- [x] Service role key stored in `.env` (not committed to git)
- [x] SMTP credentials stored in `.env` (not committed to git)
- [x] CORS configured (only allow your frontend domain in production)
- [x] Input validation on all endpoints
- [x] Rate limiting (consider adding express-rate-limit in production)

## Troubleshooting

**"Authentication failed" error:**
- Check that SMTP_USER and SMTP_PASS are correct
- Verify 2FA is enabled on the Gmail account
- Confirm it's an App Password, not the account password

**"Failed to create user" error:**
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check Supabase Dashboard logs for more details
- Ensure the email doesn't already exist

**"CORS error" in frontend:**
- Make sure the backend server is running
- Check that the frontend is making requests to the correct port (3001)
- Verify CORS is configured in server.js
