-- ==========================================
-- Debug get_auth_users() Function
-- Run this to see what it returns
-- ==========================================

-- Test 1: Call the function
SELECT * FROM get_auth_users();

-- Test 2: Check if profiles have the right data
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE role IN ('admin', 'superadmin')
ORDER BY created_at;

-- Test 3: Check function permissions
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'get_auth_users';

-- Expected Results:
-- Test 1 should show 3 rows (your 3 admins)
-- Test 2 should show 3 rows with proper roles
-- Test 3 should show "DEFINER" for security_type
