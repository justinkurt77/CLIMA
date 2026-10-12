# Super Admin Login - Fixed! ✅

## What Was the Problem?

The AdminLogin.jsx was only checking for:
1. Hardcoded email hashes (superadminsHashes array)
2. `user.user_metadata.role === 'admin'` (lowercase 'admin' only)

When you created a superadmin account with `role = 'superadmin'`, the login code rejected it because it was looking for 'admin', not 'superadmin'.

## What Was Fixed?

Updated `src/screens/AdminLogin.jsx` to:
- ✅ Check for both `'admin'` AND `'superadmin'` roles
- ✅ Support superadmin in both user_metadata and RPC fallback
- ✅ Fixed const/let variable issue for reassignment

## How to Login Now

### Step 1: Verify Your Account Role
Run this in Supabase SQL Editor:

```sql
SELECT 
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'YOUR-EMAIL@example.com';
```

Should show: `role: "superadmin"` ✅

### Step 2: Clear Browser Cache
**Important:** Old JavaScript is cached!

1. **Hard refresh** your browser:
   - Windows: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
   
2. Or **clear cache completely**:
   - Press `F12` (DevTools)
   - Right-click the refresh button
   - Click "Empty Cache and Hard Reload"

3. Or **use Incognito/Private mode**:
   - Test in a new incognito window
   - This bypasses all cached files

### Step 3: Login
1. Go to your CLIMA admin login: `/admin`
2. Enter your superadmin credentials:
   - Email: `YOUR-EMAIL@example.com`
   - Password: (your password)
3. Click **Login**

Should work now! ✅

### Step 4: Verify Superadmin Access
Once logged in:
1. Go to **Admin Dashboard**
2. Click **Settings** tab
3. Look at the TOP of the page
4. You should see **"Module Permissions"** section with yellow template panel! 🎉

## Still Not Working?

### Problem: Still says "Unauthorized admin account"

**Cause:** Browser is still using old cached JavaScript

**Solution:**
1. Close ALL browser tabs/windows
2. Clear browser cache completely
3. Restart browser
4. Try again in **Incognito/Private mode**
5. If still fails, check DevTools Console (F12) for errors

### Problem: Role is correct but still can't login

**Cause:** JWT token needs to include the role

**Solution:**
The role must be in `raw_user_meta_data` (NOT `raw_app_meta_data`):

```sql
-- Check current user_meta_data structure
SELECT 
  email,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users
WHERE email = 'YOUR-EMAIL@example.com';

-- If role is in wrong place, fix it:
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'superadmin'
)
WHERE email = 'YOUR-EMAIL@example.com';
```

### Problem: "user_metadata" is null in browser console

**Cause:** You need to log out and log back in

**Solution:**
1. The role is stored in the database
2. But it's loaded into JWT token **during login**
3. Log out completely
4. Log back in
5. New JWT will have the role

### Problem: RPC function 'get_auth_users' does not exist

**Cause:** Optional function used as fallback

**Solution:**
This is okay! The code will skip the RPC call and use user_metadata directly. As long as `raw_user_meta_data->>'role'` is set to 'superadmin', login will work.

## Quick Test Queries

### Check My Account
```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = 'YOUR-EMAIL@example.com';
```

### List All Admins
```sql
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('admin', 'superadmin')
ORDER BY created_at DESC;
```

### Verify JWT Token (while logged in)
Open browser console (F12) and run:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('My role:', session?.user?.user_metadata?.role);
```

Should print: `My role: superadmin`

## Testing Module Permissions

Once logged in as superadmin:

### 1. Check Settings Tab
- Go to Admin Dashboard
- Click Settings
- **Module Permissions** section should appear at top
- Yellow "Quick Role Templates" panel visible

### 2. Create Test Admin
In Supabase:
```sql
-- Create test admin user (do this in Supabase Dashboard → Authentication → Users)
-- Email: test@palayan.gov.ph
-- Then run:

UPDATE auth.users
SET raw_user_meta_data = '{"role": "admin"}'::jsonb
WHERE email = 'test@palayan.gov.ph';

INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Test Admin', 'admin'
FROM auth.users
WHERE email = 'test@palayan.gov.ph'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### 3. Assign Permissions
In CLIMA Settings → Module Permissions:
1. Select "Test Admin" from dropdown
2. Click "Agriculture Admin" template
3. Expand "Test Admin" row
4. Should see green checkmarks on Dashboard + Agriculture

### 4. Verify in Database
```sql
SELECT 
  u.email,
  amp.module_name,
  amp.can_view,
  amp.can_create,
  amp.can_edit,
  amp.can_delete
FROM admin_module_permissions amp
JOIN auth.users u ON amp.user_id = u.id
WHERE u.email = 'test@palayan.gov.ph';
```

Should show:
- dashboard: all true
- agriculture: all true

## Summary

✅ **AdminLogin.jsx** now checks for 'superadmin' role  
✅ **Build successful** (11.24s)  
✅ **Code committed** and pushed to GitHub  
✅ **Next step:** Clear cache and login!

---

**After clearing cache and logging in, you should see the Module Permissions section in Settings!** 🎉

If you still have issues, check:
1. Browser DevTools Console (F12) for JavaScript errors
2. Network tab to see if old files are being served
3. Verify the new JavaScript bundle is loaded (check file hash in network tab)
