-- ==========================================
-- FINAL FIX: set_user_role() that ACTUALLY updates profiles table
-- ==========================================

-- Drop existing function
DROP FUNCTION IF EXISTS set_user_role(uuid, text, jsonb, text) CASCADE;

CREATE OR REPLACE FUNCTION set_user_role(
  target_user_id uuid, 
  new_role text, 
  assigned_categories jsonb DEFAULT NULL, 
  p_assigned_department text DEFAULT NULL  -- Renamed to avoid ambiguity
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role from profiles
  SELECT role INTO current_user_role
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Security check: Only admins/superadmins can assign roles
  IF current_user_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Access denied. Only admins can update user roles.';
  END IF;

  -- Update auth.users metadata
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN 
        jsonb_build_object(
          'role', new_role, 
          'assigned_categories', assigned_categories, 
          'assigned_department', p_assigned_department
        )
      ELSE 
        raw_user_meta_data || jsonb_build_object(
          'role', new_role, 
          'assigned_categories', assigned_categories, 
          'assigned_department', p_assigned_department
        )
    END
  WHERE id = target_user_id;

  -- Update profiles table (THIS IS THE CRITICAL PART)
  UPDATE profiles
  SET 
    role = new_role,
    assigned_department = p_assigned_department,  -- Use parameter prefix
    updated_at = NOW()
  WHERE id = target_user_id;
  
  -- If no rows were updated, the profile doesn't exist - create it
  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, full_name, role, assigned_department, created_at, updated_at)
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', au.email),
      new_role,
      p_assigned_department,  -- Use parameter prefix
      NOW(),
      NOW()
    FROM auth.users au
    WHERE au.id = target_user_id;
  END IF;
  
  -- Log for debugging
  RAISE NOTICE 'Updated user % with role % and department %', target_user_id, new_role, p_assigned_department;
END;
$$;

-- Grant permissions
REVOKE EXECUTE ON FUNCTION set_user_role(uuid, text, jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION set_user_role(uuid, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_role(uuid, text, jsonb, text) TO service_role;

-- Test the function by updating Erren Valdez
-- Replace with actual UUID from the profiles table query above
SELECT set_user_role(
  (SELECT id FROM profiles WHERE email = 'errenjasonvaldez@gmail.com'),
  'admin',
  '["All Categories"]'::jsonb,
  'ENGINEERING'
);

-- Verify it worked
SELECT 
  email,
  full_name,
  role,
  assigned_department
FROM profiles
WHERE email = 'errenjasonvaldez@gmail.com';
