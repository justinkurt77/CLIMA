-- ============================================================================
-- Module-Based Permission System for Admin Users
-- Allows Super Admin to grant/revoke module access to regular admins
-- ============================================================================

-- Module Permissions Table
CREATE TABLE IF NOT EXISTS admin_module_permissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  -- Available modules: 'dashboard', 'reports', 'advisories', 'hospital', 'cdrrmo', 'bfp', 'agriculture', 'water', 'power', 'users', 'settings', 'logs'
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT true,
  can_delete BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- Create indexes
CREATE INDEX idx_module_permissions_user ON admin_module_permissions(user_id);
CREATE INDEX idx_module_permissions_module ON admin_module_permissions(module_name);

-- Add CHECK constraint for valid module names
ALTER TABLE admin_module_permissions
ADD CONSTRAINT valid_module_name CHECK (
  module_name IN (
    'dashboard',
    'reports', 
    'advisories',
    'hospital',
    'cdrrmo',
    'bfp',
    'agriculture',
    'water',
    'power',
    'users',
    'settings',
    'logs'
  )
);

-- Enable RLS
ALTER TABLE admin_module_permissions ENABLE ROW LEVEL SECURITY;

-- Policies: Only superadmins can manage permissions
CREATE POLICY "Superadmins can view all permissions"
  ON admin_module_permissions FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'superadmin');

CREATE POLICY "Superadmins can insert permissions"
  ON admin_module_permissions FOR INSERT
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'superadmin');

CREATE POLICY "Superadmins can update permissions"
  ON admin_module_permissions FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'superadmin');

CREATE POLICY "Superadmins can delete permissions"
  ON admin_module_permissions FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'superadmin');

-- Admins can view their own permissions
CREATE POLICY "Admins can view own permissions"
  ON admin_module_permissions FOR SELECT
  USING (
    user_id = auth.uid() 
    AND (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_module_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER module_permissions_updated_at_trigger
  BEFORE UPDATE ON admin_module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_module_permissions_updated_at();

-- ============================================================================
-- Helper View: Admin Users with Their Module Access
-- ============================================================================

CREATE OR REPLACE VIEW admin_users_with_modules AS
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'role' as role,
  au.created_at as user_created_at,
  json_agg(
    json_build_object(
      'module', amp.module_name,
      'can_view', amp.can_view,
      'can_create', amp.can_create,
      'can_edit', amp.can_edit,
      'can_delete', amp.can_delete,
      'granted_at', amp.granted_at
    )
  ) FILTER (WHERE amp.module_name IS NOT NULL) as modules
FROM auth.users au
LEFT JOIN admin_module_permissions amp ON au.id = amp.user_id
WHERE au.raw_user_meta_data->>'role' IN ('admin', 'superadmin')
GROUP BY au.id, au.email, au.raw_user_meta_data, au.created_at;

-- ============================================================================
-- Helper Function: Check if user has module permission
-- ============================================================================

CREATE OR REPLACE FUNCTION has_module_permission(
  p_user_id UUID,
  p_module_name TEXT,
  p_permission_type TEXT DEFAULT 'view' -- 'view', 'create', 'edit', 'delete'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_has_permission BOOLEAN;
BEGIN
  -- Get user role
  SELECT raw_user_meta_data->>'role' INTO v_role
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Superadmins have all permissions
  IF v_role = 'superadmin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission for regular admins
  IF p_permission_type = 'view' THEN
    SELECT can_view INTO v_has_permission
    FROM admin_module_permissions
    WHERE user_id = p_user_id AND module_name = p_module_name;
  ELSIF p_permission_type = 'create' THEN
    SELECT can_create INTO v_has_permission
    FROM admin_module_permissions
    WHERE user_id = p_user_id AND module_name = p_module_name;
  ELSIF p_permission_type = 'edit' THEN
    SELECT can_edit INTO v_has_permission
    FROM admin_module_permissions
    WHERE user_id = p_user_id AND module_name = p_module_name;
  ELSIF p_permission_type = 'delete' THEN
    SELECT can_delete INTO v_has_permission
    FROM admin_module_permissions
    WHERE user_id = p_user_id AND module_name = p_module_name;
  END IF;
  
  RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Predefined Admin Roles (Insert as templates)
-- ============================================================================

-- Example: How to grant all modules to an admin (run per user)
-- INSERT INTO admin_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
-- VALUES 
--   ('USER_UUID_HERE', 'dashboard', true, false, false, false),
--   ('USER_UUID_HERE', 'reports', true, true, true, true),
--   ('USER_UUID_HERE', 'hospital', true, true, true, true);

-- Predefined role: Agriculture Admin
-- Copy and modify for each user:
/*
INSERT INTO admin_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
VALUES 
  ('USER_UUID', 'dashboard', true, false, false, false),
  ('USER_UUID', 'agriculture', true, true, true, true);
*/

-- Predefined role: CDRRMO Admin
/*
INSERT INTO admin_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
VALUES 
  ('USER_UUID', 'dashboard', true, false, false, false),
  ('USER_UUID', 'reports', true, true, true, true),
  ('USER_UUID', 'cdrrmo', true, true, true, true);
*/

-- Predefined role: BFP Admin
/*
INSERT INTO admin_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
VALUES 
  ('USER_UUID', 'dashboard', true, false, false, false),
  ('USER_UUID', 'bfp', true, true, true, true);
*/

-- Predefined role: Hospital Admin
/*
INSERT INTO admin_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
VALUES 
  ('USER_UUID', 'dashboard', true, false, false, false),
  ('USER_UUID', 'hospital', true, true, true, true);
*/

-- Predefined role: Water Admin
/*
INSERT INTO admin_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
VALUES 
  ('USER_UUID', 'dashboard', true, false, false, false),
  ('USER_UUID', 'water', true, true, true, true);
*/

-- Predefined role: Power Admin  
/*
INSERT INTO admin_module_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
VALUES 
  ('USER_UUID', 'dashboard', true, false, false, false),
  ('USER_UUID', 'power', true, true, true, true);
*/

COMMENT ON TABLE admin_module_permissions IS 'Module-level permissions for admin users. Superadmins bypass this and have all permissions.';
COMMENT ON COLUMN admin_module_permissions.module_name IS 'Module identifier: dashboard, reports, advisories, hospital, cdrrmo, bfp, agriculture, water, power, users, settings, logs';
COMMENT ON FUNCTION has_module_permission IS 'Check if a user has a specific permission for a module. Superadmins always return true.';
