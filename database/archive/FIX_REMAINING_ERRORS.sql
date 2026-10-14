-- ==========================================
-- Fix Remaining Errors
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Fix get_auth_users function (proper permissions and simpler query)
-- ==========================================

DROP FUNCTION IF EXISTS get_auth_users() CASCADE;

CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  assigned_categories TEXT[]
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
    COALESCE(p.role, 'admin')::TEXT as role,
    ARRAY['All Categories']::TEXT[] as assigned_categories
  FROM profiles p
  WHERE p.role IN ('admin', 'superadmin')
  ORDER BY p.email;
END;
$$;

-- Grant execute to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_users() TO anon;
GRANT EXECUTE ON FUNCTION get_auth_users() TO service_role;

-- 2. Create bfp_daily_operations table (if code still references it)
-- ==========================================

DROP TABLE IF EXISTS bfp_daily_operations CASCADE;

CREATE TABLE bfp_daily_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_date DATE NOT NULL UNIQUE,
  total_fire_incidents INTEGER DEFAULT 0,
  total_inspections INTEGER DEFAULT 0,
  total_seminars INTEGER DEFAULT 0,
  total_rescues INTEGER DEFAULT 0,
  total_medical_assists INTEGER DEFAULT 0,
  total_emergency_calls INTEGER DEFAULT 0,
  total_personnel_deployed INTEGER DEFAULT 0,
  total_fire_trucks INTEGER DEFAULT 0,
  total_casualties INTEGER DEFAULT 0,
  total_property_damage NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bfp_daily_date ON bfp_daily_operations(operation_date DESC);

ALTER TABLE bfp_daily_operations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage BFP daily operations" ON bfp_daily_operations;
CREATE POLICY "Admins can manage BFP daily operations"
  ON bfp_daily_operations FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin'));

-- 3. Test the function works
-- ==========================================

SELECT * FROM get_auth_users();

-- 4. Verify tables exist
-- ==========================================

SELECT 
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as columns
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('bfp_operations', 'bfp_daily_operations')
ORDER BY tablename;
