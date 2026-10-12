-- ==========================================
-- Create Admin User - Bypass Email Rate Limit
-- Run this in Supabase SQL Editor
-- ==========================================

-- This creates an admin user directly in the database
-- without sending any confirmation emails

-- STEP 1: Create the user in auth.users
-- Replace with your desired email and password
DO $$
DECLARE
  new_user_id UUID;
  user_email TEXT := 'admin@test.com';  -- CHANGE THIS
  user_password TEXT := 'admin123';  -- CHANGE THIS (min 6 chars)
  user_full_name TEXT := 'Admin User';  -- CHANGE THIS
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE NOTICE 'User % already exists, updating...', user_email;
    
    -- Get existing user ID
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
    
    -- Update existing user
    UPDATE auth.users
    SET 
      raw_user_meta_data = jsonb_build_object(
        'role', 'admin',
        'full_name', user_full_name
      ),
      email_confirmed_at = now()
    WHERE email = user_email;
    
  ELSE
    -- Create new user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      user_email,
      crypt(user_password, gen_salt('bf')),  -- Encrypt password
      now(),  -- Auto-confirm email
      jsonb_build_object(
        'role', 'admin',
        'full_name', user_full_name
      ),
      now(),
      now()
    )
    RETURNING id INTO new_user_id;
    
    RAISE NOTICE 'Created new user % with ID %', user_email, new_user_id;
  END IF;

  -- STEP 2: Create or update profile
  INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    new_user_id,
    user_email,
    user_full_name,
    'admin',
    now(),
    now()
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    full_name = user_full_name,
    role = 'admin',
    updated_at = now();
  
  RAISE NOTICE 'Profile created/updated for %', user_email;
  
END $$;

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Check the user was created
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
WHERE email = 'admin@test.com';  -- CHANGE THIS to match above

-- Check the profile
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'admin@test.com';  -- CHANGE THIS to match above

-- ==========================================
-- INSTRUCTIONS
-- ==========================================

-- 1. Edit the variables at the top:
--    - user_email: Change to your desired admin email
--    - user_password: Change to your desired password (min 6 chars)
--    - user_full_name: Change to admin's full name
--
-- 2. Also update the email in both SELECT queries at the bottom
--
-- 3. Run this entire script
--
-- 4. Login credentials:
--    Email: (whatever you set in user_email)
--    Password: (whatever you set in user_password)
--
-- 5. No email confirmation needed! User can login immediately.
