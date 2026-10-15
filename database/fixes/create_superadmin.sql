-- Script to Create or Promote a Super Admin Account
-- Run this in Supabase SQL Editor

-- OPTION 1: Update existing admin user to superadmin
-- Replace 'your-email@example.com' with your actual admin email

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"superadmin"'
)
WHERE email = 'your-email@example.com';

-- Also update the profiles table if it exists
UPDATE profiles
SET role = 'superadmin'
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';


-- OPTION 2: Create a brand new superadmin account
-- If you don't have an existing account, use the Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add user"
-- 3. Fill in:
--    - Email: superadmin@palayan.gov.ph
--    - Password: (your secure password)
--    - Auto Confirm User: ✓ (checked)
-- 4. After creating, run this SQL:

/*
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"superadmin"'
)
WHERE email = 'superadmin@palayan.gov.ph';

-- Create profile entry
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
*/


-- OPTION 3: Check all existing users and their roles
-- Run this to see all users in your system

SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'role' as user_metadata_role,
  p.role as profile_role,
  p.full_name,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;


-- OPTION 4: Quick test query to verify superadmin access
-- This should return TRUE if you're logged in as superadmin

SELECT 
  auth.uid() as my_user_id,
  (auth.jwt() -> 'user_metadata' ->> 'role')::text as my_role,
  CASE 
    WHEN (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'superadmin' THEN 'YES'
    ELSE 'NO'
  END as is_superadmin;


-- TROUBLESHOOTING: If role is not reflecting

-- 1. Force JWT refresh by logging out and back in
-- 2. Check if raw_user_meta_data has the role:
SELECT email, raw_user_meta_data FROM auth.users WHERE email = 'your-email@example.com';

-- 3. If null or missing, set it properly:
UPDATE auth.users
SET raw_user_meta_data = '{"role": "superadmin"}'::jsonb
WHERE email = 'your-email@example.com';

-- 4. Verify profiles table also has the role:
SELECT * FROM profiles WHERE email = 'your-email@example.com';
