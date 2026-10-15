-- ==========================================
-- Fix get_auth_users() Function - Final Version
-- This should make admins appear in Users page
-- ==========================================

-- Drop and recreate the function with proper permissions
DROP FUNCTION IF EXISTS get_auth_users() CASCADE;

CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  assigned_categories TEXT[],
  assigned_department TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email::TEXT,
    COALESCE(p.full_name, p.email)::TEXT as full_name,
    COALESCE(p.role, 'admin')::TEXT as role,
    ARRAY['All Categories']::TEXT[] as assigned_categories,
    'All Departments'::TEXT as assigned_department
  FROM profiles p
  WHERE p.role IN ('admin', 'superadmin')
  ORDER BY p.email;
END;
$$;

-- Grant permissions to everyone (since it's SECURITY DEFINER, it runs with creator's permissions)
GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_users() TO anon;
GRANT EXECUTE ON FUNCTION get_auth_users() TO service_role;
GRANT EXECUTE ON FUNCTION get_auth_users() TO public;

-- Test the function
SELECT * FROM get_auth_users();

-- You should see all your admin users listed!
-- If this returns empty, check: SELECT * FROM profiles WHERE role IN ('admin', 'superadmin');
