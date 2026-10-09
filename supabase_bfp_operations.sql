-- ============================================================================
-- BFP Daily Operations Module
-- Palayan City BFP Operations - Super El Niño Fire Risk Tracking
-- ============================================================================

-- Drop existing table if migrating from old structure
DROP TABLE IF EXISTS bfp_daily_operations CASCADE;

-- Create BFP daily operations table
CREATE TABLE bfp_daily_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_name TEXT DEFAULT 'Palayan City BFP',
  operation_date DATE NOT NULL,
  fire_incidents INTEGER DEFAULT 0,
  fire_prevention_inspections INTEGER DEFAULT 0,
  fire_safety_seminars INTEGER DEFAULT 0,
  rescue_operations INTEGER DEFAULT 0,
  medical_assists INTEGER DEFAULT 0,
  emergency_responses INTEGER DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One record per date constraint
  CONSTRAINT unique_bfp_operation_date UNIQUE (operation_date)
);

-- Create index for date queries
CREATE INDEX idx_bfp_operations_date ON bfp_daily_operations(operation_date DESC);

-- Enable Row Level Security
ALTER TABLE bfp_daily_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read all records
CREATE POLICY "Anyone can view BFP operations"
  ON bfp_daily_operations
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert BFP operations"
  ON bfp_daily_operations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can update BFP operations"
  ON bfp_daily_operations
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can delete BFP operations"
  ON bfp_daily_operations
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bfp_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bfp_operations_updated_at
  BEFORE UPDATE ON bfp_daily_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_bfp_operations_updated_at();

-- Sample data for testing (last 7 days)
INSERT INTO bfp_daily_operations (operation_date, fire_incidents, fire_prevention_inspections, fire_safety_seminars, rescue_operations, medical_assists, emergency_responses, remarks)
VALUES
  (CURRENT_DATE, 2, 5, 1, 3, 4, 9, 'Increased grass fires due to extreme heat. Fire safety seminar at Brgy. Atate.'),
  (CURRENT_DATE - INTERVAL '1 day', 1, 8, 0, 2, 3, 6, 'Fire prevention inspections in commercial establishments.'),
  (CURRENT_DATE - INTERVAL '2 days', 3, 6, 1, 4, 5, 13, 'Multiple vegetation fires reported. High fire risk advisory issued.'),
  (CURRENT_DATE - INTERVAL '3 days', 1, 7, 0, 1, 2, 5, 'Routine inspections and patrol operations.'),
  (CURRENT_DATE - INTERVAL '4 days', 4, 5, 2, 5, 6, 18, 'Widespread grass fires due to drought. Community fire safety seminars conducted.'),
  (CURRENT_DATE - INTERVAL '5 days', 2, 9, 1, 3, 4, 10, 'Fire prevention focus on residential areas.'),
  (CURRENT_DATE - INTERVAL '6 days', 1, 4, 0, 2, 2, 6, 'Light operations day. Maintenance and training.')
ON CONFLICT (operation_date) DO NOTHING;

-- Grant permissions
GRANT ALL ON bfp_daily_operations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
