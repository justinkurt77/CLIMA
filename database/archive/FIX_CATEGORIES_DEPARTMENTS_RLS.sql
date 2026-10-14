-- ============================================================================
-- Fix Categories and Departments Table RLS Policies
-- Allow admin users to read categories and departments for login
-- ============================================================================

-- ===== DEPARTMENTS TABLE =====
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read departments" ON departments;
DROP POLICY IF EXISTS "Allow admins to manage departments" ON departments;

-- Allow all authenticated users (including admins) to read departments
CREATE POLICY "Allow authenticated users to read departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins and superadmins to insert/update/delete departments
CREATE POLICY "Allow admins to manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON departments TO authenticated;

-- ===== CATEGORIES TABLE =====
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON categories;
DROP POLICY IF EXISTS "Allow admins to manage categories" ON categories;

-- Allow all authenticated users (including admins) to read categories
CREATE POLICY "Allow authenticated users to read categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins and superadmins to insert/update/delete categories
CREATE POLICY "Allow admins to manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;

-- Verify policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename IN ('departments', 'categories')
ORDER BY tablename, policyname;
