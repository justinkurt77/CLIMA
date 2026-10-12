-- ==========================================
-- Sync auth.users to profiles table
-- Run this to make admin users appear in Users page
-- ==========================================

-- This will create profile entries for all admin/superadmin users
-- that exist in auth.users but not in profiles

INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)  -- Use email username if no name
  ) as full_name,
  COALESCE(
    au.raw_user_meta_data->>'role',
    'admin'  -- Default to admin if no role specified
  ) as role,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE 
  au.raw_user_meta_data->>'role' IN ('admin', 'superadmin')
  AND au.id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL)
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();

-- Verification: Show all admin profiles
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  au.raw_user_meta_data->>'role' as auth_role,
  p.created_at
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.role IN ('admin', 'superadmin')
ORDER BY p.created_at DESC;
