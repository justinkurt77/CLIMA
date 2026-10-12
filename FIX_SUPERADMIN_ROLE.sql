-- ==========================================
-- Fix superadmin role in profiles table
-- ==========================================

-- Update the superadmin user's role
UPDATE profiles
SET role = 'superadmin'
WHERE email = 'superadmin@test.com';

-- Also update the full_name if it's showing email
UPDATE profiles
SET full_name = 'Super Administrator'
WHERE email = 'superadmin@test.com'
AND (full_name IS NULL OR full_name = email);

-- Verification
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email IN ('superadmin@test.com', 'admin@test.com', 'admin@gmail.com')
ORDER BY role DESC, created_at;
