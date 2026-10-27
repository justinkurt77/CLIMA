# Super Admin Account Setup Guide

## Quick Steps to Test Module Permissions

### Method 1: Promote Your Existing Account (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com
   - Open your CLIMA project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run This Query** (replace with your actual email)
   ```sql
   -- Update user metadata
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{role}',
     '"superadmin"'
   )
   WHERE email = 'YOUR-EMAIL@example.com';
   
   -- Update profiles table
   UPDATE profiles
   SET role = 'superadmin'
   WHERE email = 'YOUR-EMAIL@example.com';
   ```

4. **Verify the Update**
   ```sql
   SELECT 
     email,
     raw_user_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'YOUR-EMAIL@example.com';
   ```
   Should return: `role: "superadmin"`

5. **Log Out and Log Back In**
   - Go to your CLIMA app
   - Log out completely
   - Log back in with the same credentials
   - JWT token will now include superadmin role

6. **Test Module Permissions**
   - Navigate to Admin Dashboard
   - Click "Settings" tab
   - You should now see **"Module Permissions"** section at the top!

---

### Method 2: Create New Super Admin Account

If you don't have an existing admin account or want a separate superadmin:

1. **Create User in Supabase Dashboard**
   - Go to Authentication → Users
   - Click "+ Add user"
   - Fill in:
     * Email: `superadmin@palayan.gov.ph`
     * Password: (your secure password)
     * ✓ Check "Auto Confirm User"
   - Click "Create user"

2. **Set Role in SQL Editor**
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = '{"role": "superadmin"}'::jsonb
   WHERE email = 'superadmin@palayan.gov.ph';
   
   -- Create profile
   INSERT INTO profiles (id, email, full_name, role)
   SELECT 
     id,
     email,
     'Super Administrator',
     'superadmin'
   FROM auth.users
   WHERE email = 'superadmin@palayan.gov.ph'
   ON CONFLICT (id) DO UPDATE
   SET role = 'superadmin';
   ```

3. **Log In**
   - Go to your CLIMA app admin login
   - Use the new credentials
   - Navigate to Settings tab

---

### Method 3: Check All Users (Find Existing Admin)

If you're not sure which account to promote:

```sql
-- List all users with their roles
SELECT 
  au.email,
  au.raw_user_meta_data->>'role' as role,
  p.full_name,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
```

Find an admin account and promote it using Method 1.

---

## Verification Checklist

After promoting to superadmin, verify everything works:

### ✅ Step 1: Check Database
```sql
SELECT 
  email,
  raw_user_meta_data->>'role' as user_meta_role,
  raw_app_meta_data
FROM auth.users
WHERE email = 'YOUR-EMAIL@example.com';
```
Expected: `user_meta_role = "superadmin"`

### ✅ Step 2: Check JWT Token (while logged in)
```sql
SELECT 
  auth.uid() as my_id,
  auth.jwt() -> 'user_metadata' ->> 'role' as my_role;
```
Expected: `my_role = "superadmin"`

### ✅ Step 3: Check Admin Dashboard UI
- Log in to CLIMA admin
- Go to Settings tab
- Look for "Module Permissions" section
- Should be visible at the top with yellow "Quick Role Templates" box

### ✅ Step 4: Check Permissions Query
```sql
SELECT * FROM admin_module_permissions LIMIT 1;
```
Should return empty (no permissions assigned yet) but no error

---

## Troubleshooting

### Problem: "Module Permissions" section not showing

**Cause:** Role not properly set in JWT token

**Solution:**
1. Run this in SQL Editor:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
     raw_user_meta_data,
     '{role}',
     '"superadmin"'
   )
   WHERE email = 'YOUR-EMAIL@example.com';
   ```

2. **Log out completely** (don't just refresh)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Log back in
5. JWT token refreshes on login

### Problem: SQL query returns no rows

**Cause:** Email doesn't exist in auth.users

**Solution:**
1. Check all users:
   ```sql
   SELECT email FROM auth.users;
   ```
2. Find the correct email
3. Use that email in the UPDATE query

### Problem: "profiles" table doesn't exist

**Cause:** profiles table not created yet

**Solution:**
1. Check if table exists:
   ```sql
   SELECT * FROM profiles LIMIT 1;
   ```
2. If error, create manually or use auth.users only
3. The important role is in `auth.users.raw_user_meta_data->>'role'`

### Problem: Still shows as regular admin

**Cause:** Browser cached old JWT token

**Solution:**
1. Open browser DevTools (F12)
2. Go to Application → Storage
3. Clear all site data
4. Close browser completely
5. Reopen and log in again

### Problem: RLS policy errors

**Cause:** Supabase RLS policies not recognizing superadmin

**Solution:**
Check RLS policies use correct syntax:
```sql
-- Correct:
(auth.jwt() -> 'user_metadata' ->> 'role')::text = 'superadmin'

-- Also correct:
auth.jwt() -> 'user_metadata' ->> 'role' = 'superadmin'
```

---

## Testing Module Permissions Feature

Once you have superadmin access:

### Test 1: Create Test Admin User
1. In Supabase Dashboard → Authentication → Users
2. Add user: `test-admin@palayan.gov.ph`
3. Set password, auto-confirm
4. Run SQL:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = '{"role": "admin"}'::jsonb
   WHERE email = 'test-admin@palayan.gov.ph';
   
   INSERT INTO profiles (id, email, full_name, role)
   SELECT id, email, 'Test Admin', 'admin'
   FROM auth.users
   WHERE email = 'test-admin@palayan.gov.ph'
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```

### Test 2: Assign Permissions
1. Log in as superadmin
2. Go to Settings → Module Permissions
3. Select "Test Admin" from dropdown
4. Click "Agriculture Admin" template
5. Should see success modal
6. Expand "Test Admin" row
7. Should see Dashboard + Agriculture with all permissions checked

### Test 3: Verify Database
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
WHERE u.email = 'test-admin@palayan.gov.ph'
ORDER BY amp.module_name;
```

Should show:
- dashboard: all true
- agriculture: all true

### Test 4: Toggle Individual Permission
1. In superadmin UI, expand Test Admin row
2. Click "Create" button on CDRRMO Operations (should be gray/inactive)
3. Button should turn green (active)
4. Check database:
   ```sql
   SELECT * FROM admin_module_permissions 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-admin@palayan.gov.ph')
   AND module_name = 'cdrrmo';
   ```
   Should show: can_create = true

### Test 5: Revoke All
1. Click trash icon on Test Admin row
2. Confirm in modal
3. Should see "No Access" badge
4. Check database:
   ```sql
   SELECT COUNT(*) FROM admin_module_permissions 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-admin@palayan.gov.ph');
   ```
   Should return: 0

---

## Quick Reference

### Check My Current Role
```sql
SELECT 
  auth.jwt() -> 'user_metadata' ->> 'role' as my_role;
```

### List All Admins
```sql
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('admin', 'superadmin')
ORDER BY created_at;
```

### View All Module Permissions
```sql
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as user_role,
  amp.module_name,
  amp.can_view,
  amp.can_create,
  amp.can_edit,
  amp.can_delete
FROM admin_module_permissions amp
JOIN auth.users u ON amp.user_id = u.id
ORDER BY u.email, amp.module_name;
```

### Grant Agriculture Admin Template Manually (SQL)
```sql
WITH target_user AS (
  SELECT id FROM auth.users WHERE email = 'test-admin@palayan.gov.ph'
)
INSERT INTO admin_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT 
  id,
  module_name,
  true, true, true, true
FROM target_user
CROSS JOIN (
  VALUES ('dashboard'), ('agriculture')
) AS modules(module_name)
ON CONFLICT (user_id, module_name) 
DO UPDATE SET 
  can_view = true,
  can_create = true,
  can_edit = true,
  can_delete = true;
```

---

## Support

If you encounter issues:

1. **Check SQL file:** `create_superadmin.sql` has all queries
2. **Check logs:** Browser console (F12) for JavaScript errors
3. **Check network:** Network tab to see API responses
4. **Check RLS:** Supabase logs for policy errors

**Common Issue:** Most problems are solved by:
- Logging out completely
- Clearing browser cache
- Logging back in (refreshes JWT token)

---

**Ready to Test!** 

Run Method 1, log out/in, and go to Settings tab. The Module Permissions section should appear at the top with the yellow templates panel.
