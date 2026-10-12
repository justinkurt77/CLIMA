-- ==========================================
-- Fix set_user_role() to Update Both auth.users AND profiles Table
-- ==========================================

DROP FUNCTION IF EXISTS set_user_role(uuid, text, jsonb, text) CASCADE;

CREATE OR REPLACE FUNCTION set_user_role(
  target_user_id uuid, 
  new_role text, 
  assigned_categories jsonb DEFAULT NULL, 
  assigned_department text DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Security check: Only admins/superadmins can assign roles
  IF COALESCE((SELECT role FROM profiles WHERE id = auth.uid()), 'user') NOT IN ('admin', 'superadmin') THEN
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
          'assigned_department', assigned_department
        )
      ELSE 
        raw_user_meta_data || jsonb_build_object(
          'role', new_role, 
          'assigned_categories', assigned_categories, 
          'assigned_department', assigned_department
        )
    END
  WHERE id = target_user_id;

  -- Also update profiles table
  UPDATE profiles
  SET 
    role = new_role,
    assigned_department = assigned_department,
    updated_at = NOW()
  WHERE id = target_user_id;
  
  -- If profile doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, role, assigned_department, created_at, updated_at)
    SELECT 
      au.id,
      au.email,
      new_role,
      assigned_department,
      NOW(),
      NOW()
    FROM auth.users au
    WHERE au.id = target_user_id;
  END IF;
END;
$$;

-- Grant permissions
REVOKE EXECUTE ON FUNCTION set_user_role(uuid, text, jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION set_user_role(uuid, text, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_role(uuid, text, jsonb, text) TO service_role;

-- Test: Promote a user (replace with actual user email)
-- SELECT set_user_role(
--   (SELECT id FROM profiles WHERE email = 'test@test.com'),
--   'admin',
--   '["All Categories"]'::jsonb,
--   'ENRO'
-- );
