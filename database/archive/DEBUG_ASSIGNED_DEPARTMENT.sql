-- ==========================================
-- Debug: Check if assigned_department is being saved
-- ==========================================

-- 1. Check if the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'assigned_department';

-- 2. Check current values in profiles table
SELECT 
  id,
  email,
  full_name,
  role,
  assigned_department,
  created_at
FROM profiles
WHERE role IN ('admin', 'superadmin')
ORDER BY created_at DESC;

-- 3. Test get_auth_users() function
SELECT 
  email,
  full_name,
  role,
  assigned_department
FROM get_auth_users();

-- 4. Manually update one user to test (replace email)
-- UPDATE profiles 
-- SET assigned_department = 'CITY VET OFFICE'
-- WHERE email = 'errenjohnvaldez@gmail.com';

-- 5. Check if the update worked
-- SELECT email, assigned_department FROM profiles WHERE email = 'errenjohnvaldez@gmail.com';
