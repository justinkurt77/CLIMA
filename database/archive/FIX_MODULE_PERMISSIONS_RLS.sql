-- ============================================================================
-- Fix Module Permissions RLS Policies
-- Issue: Policies check JWT user_metadata, but role is in profiles table
-- Solution: Update policies to check profiles.role instead
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Superadmins can view all permissions" ON admin_module_permissions;
DROP POLICY IF EXISTS "Superadmins can insert permissions" ON admin_module_permissions;
DROP POLICY IF EXISTS "Superadmins can update permissions" ON admin_module_permissions;
DROP POLICY IF EXISTS "Superadmins can delete permissions" ON admin_module_permissions;
DROP POLICY IF EXISTS "Admins can view own permissions" ON admin_module_permissions;

-- Create new policies that check profiles table
CREATE POLICY "Superadmins can view all permissions"
  ON admin_module_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can insert permissions"
  ON admin_module_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can update permissions"
  ON admin_module_permissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can delete permissions"
  ON admin_module_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'superadmin'
    )
  );

-- Admins can view their own permissions
CREATE POLICY "Admins can view own permissions"
  ON admin_module_permissions FOR SELECT
  USING (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_module_permissions TO authenticated;

-- Verify the fix
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'admin_module_permissions'
ORDER BY policyname;
