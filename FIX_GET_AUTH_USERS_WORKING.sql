-- ==========================================
-- Fix get_auth_users() - Working Version
-- Fixes: cannot cast type jsonb to text[]
-- ==========================================

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
  -- Query profiles table directly (no JSONB casting issues)
  RETURN QUERY
  SELECT 
    p.id,
    p.email::TEXT,
    COALESCE(p.full_name, p.email)::TEXT as full_name,
    COALESCE(p.role, 'admin')::TEXT as role,
    ARRAY['All Categories']::TEXT[] as assigned_categories,  -- Simple array, no JSONB
    'All Departments'::TEXT as assigned_department
  FROM profiles p
  WHERE p.role IN ('admin', 'superadmin')
  ORDER BY 
    CASE WHEN p.role = 'superadmin' THEN 0 ELSE 1 END,  -- Superadmins first
    p.created_at;
END;
$$;

-- Grant all permissions
GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_users() TO anon;
GRANT EXECUTE ON FUNCTION get_auth_users() TO service_role;
GRANT EXECUTE ON FUNCTION get_auth_users() TO public;

-- Test it works
SELECT 
  id,
  email,
  full_name,
  role,
  assigned_categories,
  assigned_department
FROM get_auth_users();

-- Should show all 3 admins with no errors!
