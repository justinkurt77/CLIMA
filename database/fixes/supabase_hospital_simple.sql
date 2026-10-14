-- SIMPLE Hospital Daily Records Setup
-- Use this for quick testing without complex RLS policies

-- Create table
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
  created_by UUID,
  
  -- Ensure one record per date
  CONSTRAINT unique_date_record UNIQUE (hospital_name, record_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hospital_records_date 
ON hospital_daily_records(record_date DESC);

-- Enable RLS (but with permissive policies for testing)
ALTER TABLE hospital_daily_records ENABLE ROW LEVEL SECURITY;

-- SIMPLE POLICIES - Everyone can do everything (testing only!)
CREATE POLICY "Allow all operations for authenticated users"
ON hospital_daily_records
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow public read (for citizen view if needed)
CREATE POLICY "Allow public read"
ON hospital_daily_records
FOR SELECT
TO anon
USING (true);

-- Auto-update timestamp trigger
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

-- Sample data for testing
INSERT INTO hospital_daily_records (
  hospital_name, record_date,
  heat_stroke_cases, heat_exhaustion_cases, 
  dehydration_cases, respiratory_cases,
  total_admissions, remarks
) VALUES
('Palayan City Hospital', CURRENT_DATE, 2, 5, 8, 3, 45, 'High heat index reported today. Increased dehydration cases from agricultural workers.'),
('Palayan City Hospital', CURRENT_DATE - INTERVAL '1 day', 1, 3, 6, 2, 38, 'Normal operations. Preventive health advisory issued.'),
('Palayan City Hospital', CURRENT_DATE - INTERVAL '2 days', 3, 7, 12, 4, 52, 'Critical day - peak heat conditions. Emergency protocols activated.'),
('Palayan City Hospital', CURRENT_DATE - INTERVAL '3 days', 0, 2, 4, 1, 35, 'Preventive measures showing results.'),
('Palayan City Hospital', CURRENT_DATE - INTERVAL '4 days', 1, 4, 7, 2, 41, 'Agricultural workers affected by prolonged sun exposure.')
ON CONFLICT (hospital_name, record_date) DO NOTHING;

-- Grant permissions
GRANT ALL ON hospital_daily_records TO authenticated;
GRANT SELECT ON hospital_daily_records TO anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Hospital daily records table created!';
  RAISE NOTICE '✅ Sample data inserted (5 records)';
  RAISE NOTICE '✅ Simple RLS policies enabled (testing mode)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test in admin dashboard';
  RAISE NOTICE '2. Add/edit/delete records';
  RAISE NOTICE '3. When ready, switch to supabase_hospital_redesign.sql for production RLS';
END $$;
