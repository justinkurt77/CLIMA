-- ============================================================================
-- Complete Fix for Admin User Login Issues
-- ============================================================================

-- STEP 1: Make auth trigger safe (never fails)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, 'unknown'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Unknown'),
      COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Silent fail
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 2: Fix the admin@test.com user
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get or create the admin user
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@test.com';
  
  IF admin_user_id IS NULL THEN
    -- User doesn't exist, create it
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@test.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      '{"role":"admin","full_name":"Admin User"}'::jsonb,
      null,
      now(),
      now(),
      null,
      null,
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Created new admin user with ID: %', admin_user_id;
  ELSE
    -- User exists, fix their record
    UPDATE auth.users
    SET
      encrypted_password = crypt('admin123', gen_salt('bf')),
      email_confirmed_at = now(),
      last_sign_in_at = now(),
      raw_user_meta_data = '{"role":"admin","full_name":"Admin User"}'::jsonb,
      confirmation_token = '',
      email_change = '',
      email_change_token_new = '',
      recovery_token = '',
      updated_at = now()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Fixed existing admin user: %', admin_user_id;
  END IF;
  
  -- Fix or create profile
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    admin_user_id,
    'admin@test.com',
    'Admin User',
    'admin',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 'admin@test.com',
    full_name = 'Admin User',
    role = 'admin',
    updated_at = now();
    
  RAISE NOTICE 'Profile synced for admin user';
END $$;

-- STEP 3: Verify the fix
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  raw_user_meta_data->>'role' as role,
  encrypted_password IS NOT NULL as has_password,
  created_at,
  updated_at
FROM auth.users
WHERE email = 'admin@test.com';

SELECT 
  id,
  email,
  full_name,
  role
FROM profiles
WHERE email = 'admin@test.com';
