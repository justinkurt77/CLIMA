-- ==========================================
-- CLIMA Database Schema Fix
-- Run this FIRST to fix all column name issues
-- ==========================================

-- This script will:
-- 1. Fix profiles table (add full_name column)
-- 2. Drop and recreate water_interruptions (correct column names)
-- 3. Drop and recreate power_interruptions (correct column names)
-- 4. Create get_auth_users function
-- 5. Create missing tables (bfp_operations, etc.)

-- ==========================================
-- 1. FIX PROFILES TABLE
-- ==========================================

-- Check if full_name exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
  END IF;
END $$;

-- Check if role exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT CHECK (role IN ('admin', 'superadmin'));
  END IF;
END $$;

-- Update profiles from auth.users if empty
UPDATE profiles p
SET 
  full_name = COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.email),
  role = COALESCE(p.role, au.raw_user_meta_data->>'role')
FROM auth.users au
WHERE au.id = p.id
AND (p.full_name IS NULL OR p.role IS NULL);

-- ==========================================
-- 2. FIX WATER_INTERRUPTIONS TABLE
-- ==========================================

DROP TABLE IF EXISTS water_interruptions CASCADE;

CREATE TABLE water_interruptions (
  id BIGSERIAL PRIMARY KEY,
  interruption_date DATE NOT NULL,
  interruption_time TIME,
  provider TEXT NOT NULL CHECK (provider IN ('Palayan City Water District', 'Balibago Waterworks')),
  affected_barangays TEXT,
  cause TEXT CHECK (cause IN ('pipe_burst', 'maintenance', 'shortage', 'pump_failure', 'other')),
  duration_hours NUMERIC(10,2) DEFAULT 0,
  households_affected INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'restored')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_water_int_date ON water_interruptions(interruption_date DESC);
CREATE INDEX idx_water_int_provider ON water_interruptions(provider);
CREATE INDEX idx_water_int_status ON water_interruptions(status);

ALTER TABLE water_interruptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage water interruptions" ON water_interruptions;
CREATE POLICY "Admins can manage water interruptions"
  ON water_interruptions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin'));

-- ==========================================
-- 3. FIX POWER_INTERRUPTIONS TABLE
-- ==========================================

DROP TABLE IF EXISTS power_interruptions CASCADE;

CREATE TABLE power_interruptions (
  id BIGSERIAL PRIMARY KEY,
  interruption_date DATE NOT NULL UNIQUE,
  total_outages INTEGER DEFAULT 0,
  total_affected_households INTEGER DEFAULT 0,
  feeders_affected TEXT,
  total_duration_minutes INTEGER DEFAULT 0,
  peak_outage_time TIME,
  cause TEXT CHECK (cause IN ('line_fault', 'transformer_issue', 'weather', 'maintenance', 'overload', 'other')),
  restoration_status TEXT DEFAULT 'restored' CHECK (restoration_status IN ('ongoing', 'restored', 'partial')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_power_int_date ON power_interruptions(interruption_date DESC);
CREATE INDEX idx_power_int_status ON power_interruptions(restoration_status);

ALTER TABLE power_interruptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage power interruptions" ON power_interruptions;
CREATE POLICY "Admins can manage power interruptions"
  ON power_interruptions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin'));

-- ==========================================
-- 4. CREATE BFP_OPERATIONS TABLE (if doesn't exist)
-- ==========================================

DROP TABLE IF EXISTS bfp_operations CASCADE;

CREATE TABLE bfp_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_date DATE NOT NULL,
  operation_time TIME,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('fire', 'inspection', 'seminar', 'rescue', 'medical', 'emergency')),
  location TEXT NOT NULL,
  personnel_deployed INTEGER DEFAULT 0,
  fire_trucks INTEGER DEFAULT 0,
  casualties INTEGER DEFAULT 0,
  property_damage NUMERIC(15,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bfp_ops_date ON bfp_operations(operation_date DESC, operation_time DESC);
CREATE INDEX idx_bfp_ops_type ON bfp_operations(operation_type);

ALTER TABLE bfp_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage BFP operations" ON bfp_operations;
CREATE POLICY "Admins can manage BFP operations"
  ON bfp_operations FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin'));

-- ==========================================
-- 5. CREATE GET_AUTH_USERS FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  assigned_categories TEXT[],
  full_name TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    (au.raw_user_meta_data->>'role')::TEXT as role,
    COALESCE(
      (au.raw_user_meta_data->'assigned_categories')::TEXT[],
      ARRAY['All Categories']::TEXT[]
    ) as assigned_categories,
    COALESCE(
      (au.raw_user_meta_data->>'full_name')::TEXT,
      au.email::TEXT
    ) as full_name
  FROM auth.users au
  WHERE au.raw_user_meta_data->>'role' IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check profiles columns
SELECT 
  'profiles columns' as check_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- Check water_interruptions columns
SELECT 
  'water_interruptions columns' as check_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'water_interruptions' 
AND table_schema = 'public';

-- Check power_interruptions columns
SELECT 
  'power_interruptions columns' as check_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'power_interruptions' 
AND table_schema = 'public';

-- Check bfp_operations columns
SELECT 
  'bfp_operations columns' as check_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'bfp_operations' 
AND table_schema = 'public';

-- List all tables
SELECT 
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;
