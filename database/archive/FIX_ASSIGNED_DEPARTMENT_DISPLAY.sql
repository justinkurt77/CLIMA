-- ==========================================
-- Fix get_auth_users() to Return Actual assigned_department
-- Step 1: Add assigned_department column to profiles if it doesn't exist
-- Step 2: Update get_auth_users() function
-- ==========================================

-- Add assigned_department column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS assigned_department TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_department 
ON profiles(assigned_department);

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
    -- Return actual assigned_department from profiles, or 'Not Assigned' if null
    COALESCE(p.assigned_department, 'Not Assigned')::TEXT as assigned_department
  FROM profiles p
  WHERE p.role IN ('admin', 'superadmin')
  ORDER BY 
    CASE WHEN p.role = 'superadmin' THEN 0 ELSE 1 END,
    p.created_at;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_users() TO anon;
GRANT EXECUTE ON FUNCTION get_auth_users() TO service_role;
GRANT EXECUTE ON FUNCTION get_auth_users() TO public;

-- Test it
SELECT 
  id,
  email,
  full_name,
  role,
  assigned_department
FROM get_auth_users();
