-- Step 1: Create departments (offices) and categories
CREATE TABLE IF NOT EXISTS departments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  accent_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT 'General',
  icon TEXT,
  icon_name TEXT,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial departments (offices)
INSERT INTO departments (name) VALUES 
  ('CDRRMO'), 
  ('ENRO'), 
  ('CITY TRAFFIC'), 
  ('CITY VET OFFICE'), 
  ('ENGINEERING'),
  ('GENERAL SERVICES')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create or modify the reports table
-- If reports table already exists, run these lines manually to alter it:
-- ALTER TABLE reports ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  icon TEXT,
  title TEXT,
  category TEXT,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  description TEXT,
  location TEXT,
  lat FLOAT,
  lng FLOAT,
  status TEXT DEFAULT 'pending',
  status_label TEXT DEFAULT 'pending',
  upvotes INTEGER DEFAULT 0,
  photo_url TEXT,
  full_name TEXT,
  is_guest BOOLEAN DEFAULT true,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies (adjust based on your auth needs)
-- This allows anyone to read the reports
DROP POLICY IF EXISTS "Allow public read access on reports" ON reports;
CREATE POLICY "Allow public read access on reports" 
  ON reports FOR SELECT 
  USING (true);

-- This allows anyone to insert a report (since you might not have auth setup yet)
DROP POLICY IF EXISTS "Allow public insert access on reports" ON reports;
CREATE POLICY "Allow public insert access on reports" 
  ON reports FOR INSERT 
  WITH CHECK (true);

-- This allows updates only for report creators (authenticated) or admins
DROP POLICY IF EXISTS "Allow authenticated owner or admin update access on reports" ON reports;
CREATE POLICY "Allow authenticated owner or admin update access on reports" 
  ON reports FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Step 4: Create RPC functions to manage auth.users from the dashboard safely
-- First, drop the existing functions so we can recreate them with new columns
DROP FUNCTION IF EXISTS get_auth_users();
DROP FUNCTION IF EXISTS set_user_role(uuid, text);
DROP FUNCTION IF EXISTS set_user_role(uuid, text, text);
DROP FUNCTION IF EXISTS set_user_role(uuid, text, jsonb, text);
DROP FUNCTION IF EXISTS confirm_user_email(uuid);

-- This function allows retrieving user details including their assigned categories
CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE(id uuid, email text, full_name text, role text, assigned_categories jsonb, assigned_department text, created_at timestamptz)
SECURITY DEFINER
AS $$
BEGIN
  -- Strict security check: Caller must be an admin
  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Access denied. You must be an admin to retrieve users.';
  END IF;

  RETURN QUERY 
  SELECT 
    au.id, 
    au.email::text, 
    (au.raw_user_meta_data->>'full_name')::text as full_name,
    (au.raw_user_meta_data->>'role')::text as role,
    (au.raw_user_meta_data->'assigned_categories') as assigned_categories,
    (au.raw_user_meta_data->>'assigned_department')::text as assigned_department,
    au.created_at
  FROM auth.users au;
END;
$$ LANGUAGE plpgsql;

-- Revoke default public execute privileges and restrict to authenticated role
REVOKE EXECUTE ON FUNCTION get_auth_users() FROM public;
GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;

-- This function allows superadmins to update a user's role and category securely
CREATE OR REPLACE FUNCTION set_user_role(target_user_id uuid, new_role text, assigned_categories jsonb DEFAULT NULL, assigned_department text DEFAULT NULL)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  -- Strict security check: Only admins can assign roles
  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only admins can update user roles.';
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('role', new_role, 'assigned_categories', assigned_categories, 'assigned_department', assigned_department)
      ELSE raw_user_meta_data || jsonb_build_object('role', new_role, 'assigned_categories', assigned_categories, 'assigned_department', assigned_department)
    END
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Revoke default public execute privileges
REVOKE EXECUTE ON FUNCTION set_user_role(uuid, text, jsonb, text) FROM public;
GRANT EXECUTE ON FUNCTION set_user_role(uuid, text, jsonb, text) TO authenticated;

-- This function auto-confirms a user's email when registered by an admin
CREATE OR REPLACE FUNCTION confirm_user_email(target_user_id uuid)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  -- Strict security check: Only admins can confirm user emails
  IF (auth.jwt() -> 'user_metadata' ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Only admins can confirm user emails.';
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Revoke default public execute privileges
REVOKE EXECUTE ON FUNCTION confirm_user_email(uuid) FROM public;
GRANT EXECUTE ON FUNCTION confirm_user_email(uuid) TO authenticated;
