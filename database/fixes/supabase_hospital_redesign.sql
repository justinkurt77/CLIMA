-- Hospital Module Redesign: Daily Records for Palayan City Hospital
-- Focus: El Niño Health Impact Tracking
-- 
-- PREREQUISITES:
-- - Supabase project must be set up
-- - auth.users table exists (default in Supabase)
-- - User roles stored in auth.users.raw_user_meta_data->>'role'
--
-- DEPLOYMENT:
-- 1. Run this file in Supabase SQL Editor
-- 2. Grant admin role to test user if needed:
--    UPDATE auth.users 
--    SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb 
--    WHERE email = 'your-email@example.com';
-- 3. Test CRUD operations from admin dashboard

-- Drop old hospitals table if exists (BACKUP DATA FIRST!)
-- Uncomment next line if you want to remove old hospital table:
-- DROP TABLE IF EXISTS hospitals CASCADE;

-- Create new daily records table
CREATE TABLE IF NOT EXISTS hospital_daily_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_name TEXT NOT NULL DEFAULT 'Palayan City Hospital',
  record_date DATE NOT NULL,
  
  -- El Niño Health Impact Metrics
  heat_stroke_cases INT DEFAULT 0,
  heat_exhaustion_cases INT DEFAULT 0,
  dehydration_cases INT DEFAULT 0,
  respiratory_cases INT DEFAULT 0,
  
  -- Hospital Capacity
  total_admissions INT DEFAULT 0,
  
  -- Additional Context
  remarks TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure one record per date
  CONSTRAINT unique_date_record UNIQUE (hospital_name, record_date)
);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_hospital_records_date 
ON hospital_daily_records(record_date DESC);

-- Create index for created_by
CREATE INDEX IF NOT EXISTS idx_hospital_records_created_by 
ON hospital_daily_records(created_by);

-- Enable Row Level Security
ALTER TABLE hospital_daily_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can read all published records (for citizen dashboard if needed)
CREATE POLICY "Public can view hospital records"
ON hospital_daily_records
FOR SELECT
USING (true);

-- Authenticated users can insert records
CREATE POLICY "Authenticated users can insert hospital records"
ON hospital_daily_records
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own records
CREATE POLICY "Users can update own records"
ON hospital_daily_records
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Admin/superadmin can update any record
CREATE POLICY "Admins can update any hospital record"
ON hospital_daily_records
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
);

-- Users can delete their own records
CREATE POLICY "Users can delete own records"
ON hospital_daily_records
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Admin/superadmin can delete any record
CREATE POLICY "Admins can delete any hospital record"
ON hospital_daily_records
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hospital_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hospital_records_updated_at_trigger
BEFORE UPDATE ON hospital_daily_records
FOR EACH ROW
EXECUTE FUNCTION update_hospital_records_updated_at();

-- Function to get statistics for date range
CREATE OR REPLACE FUNCTION get_hospital_stats(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_heat_stroke BIGINT,
  total_heat_exhaustion BIGINT,
  total_dehydration BIGINT,
  total_respiratory BIGINT,
  total_admissions BIGINT,
  avg_available_beds NUMERIC,
  record_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(heat_stroke_cases), 0) as total_heat_stroke,
    COALESCE(SUM(heat_exhaustion_cases), 0) as total_heat_exhaustion,
    COALESCE(SUM(dehydration_cases), 0) as total_dehydration,
    COALESCE(SUM(respiratory_cases), 0) as total_respiratory,
    COALESCE(SUM(total_admissions), 0) as total_admissions,
    COUNT(*) as record_count
  FROM hospital_daily_records
  WHERE record_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data for testing (optional - remove in production)
/*
INSERT INTO hospital_daily_records (
  hospital_name, 
  record_date, 
  heat_stroke_cases, 
  heat_exhaustion_cases, 
  dehydration_cases,
  respiratory_cases,
  total_admissions,
  available_beds,
  remarks
) VALUES
(
  'Palayan City Hospital',
  CURRENT_DATE,
  2,
  5,
  8,
  3,
  45,
  12,
  'High heat index reported today. Increased dehydration cases from agricultural workers.'
),
(
  'Palayan City Hospital',
  CURRENT_DATE - INTERVAL '1 day',
  1,
  3,
  6,
  2,
  38,
  15,
  'Normal operations. Preventive health advisory issued.'
),
(
  'Palayan City Hospital',
  CURRENT_DATE - INTERVAL '2 days',
  3,
  7,
  12,
  4,
  52,
  8,
  'Critical day - peak heat conditions. Emergency protocols activated.'
);
*/

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON hospital_daily_records TO authenticated;
GRANT SELECT ON hospital_daily_records TO anon;
GRANT EXECUTE ON FUNCTION get_hospital_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE hospital_daily_records IS 'Daily health records for Palayan City Hospital - tracking El Niño health impacts';
COMMENT ON COLUMN hospital_daily_records.heat_stroke_cases IS 'Number of heat stroke cases admitted on this date';
COMMENT ON COLUMN hospital_daily_records.heat_exhaustion_cases IS 'Number of heat exhaustion cases admitted on this date';
COMMENT ON COLUMN hospital_daily_records.dehydration_cases IS 'Number of dehydration cases admitted on this date';
COMMENT ON COLUMN hospital_daily_records.respiratory_cases IS 'Number of respiratory-related cases (dust, air quality)';
COMMENT ON COLUMN hospital_daily_records.total_admissions IS 'Total number of admissions for the day';
COMMENT ON COLUMN hospital_daily_records.remarks IS 'Notable observations, incidents, or context for the day';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Hospital Module Setup Complete!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Table: hospital_daily_records';
  RAISE NOTICE 'RLS: Enabled with role-based policies';
  RAISE NOTICE 'Policies: 6 policies created';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Ensure users have roles set!';
  RAISE NOTICE '';
  RAISE NOTICE 'To set admin role:';
  RAISE NOTICE '  UPDATE auth.users';
  RAISE NOTICE '  SET raw_user_meta_data = raw_user_meta_data || ''{"role":"admin"}''::jsonb';
  RAISE NOTICE '  WHERE email = ''your-email@example.com'';';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to use in admin dashboard!';
  RAISE NOTICE '====================================';
END $$;
