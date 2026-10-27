-- ============================================================================
-- CDRRMO Daily Operations Module
-- Palayan City CDRRMO Operations - Super El Niño Response Tracking
-- ============================================================================

-- Drop existing table if migrating from old structure
DROP TABLE IF EXISTS cdrrmo_daily_operations CASCADE;

-- Create CDRRMO daily operations table
CREATE TABLE cdrrmo_daily_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_name TEXT DEFAULT 'Palayan City CDRRMO',
  operation_date DATE NOT NULL,
  relief_operations INTEGER DEFAULT 0,
  evacuations_conducted INTEGER DEFAULT 0,
  families_assisted INTEGER DEFAULT 0,
  distribution_points INTEGER DEFAULT 0,
  ambulance_dispatches INTEGER DEFAULT 0,
  emergency_responses INTEGER DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One record per date constraint
  CONSTRAINT unique_operation_date UNIQUE (operation_date)
);

-- Create index for date queries
CREATE INDEX idx_cdrrmo_operations_date ON cdrrmo_daily_operations(operation_date DESC);

-- Enable Row Level Security
ALTER TABLE cdrrmo_daily_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read all records
CREATE POLICY "Anyone can view CDRRMO operations"
  ON cdrrmo_daily_operations
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert CDRRMO operations"
  ON cdrrmo_daily_operations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can update CDRRMO operations"
  ON cdrrmo_daily_operations
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can delete CDRRMO operations"
  ON cdrrmo_daily_operations
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cdrrmo_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cdrrmo_operations_updated_at
  BEFORE UPDATE ON cdrrmo_daily_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_cdrrmo_operations_updated_at();

-- Sample data for testing (last 7 days)
INSERT INTO cdrrmo_daily_operations (operation_date, relief_operations, evacuations_conducted, families_assisted, distribution_points, ambulance_dispatches, emergency_responses, remarks)
VALUES
  (CURRENT_DATE, 3, 1, 45, 2, 12, 8, 'Heat exhaustion responses increased today. Multiple ambulance calls.'),
  (CURRENT_DATE - INTERVAL '1 day', 5, 2, 78, 3, 18, 12, 'Major relief distribution in Brgy. Singalat. Heavy ambulance activity.'),
  (CURRENT_DATE - INTERVAL '2 days', 2, 0, 34, 1, 8, 6, 'Water distribution operations. Routine medical transports.'),
  (CURRENT_DATE - INTERVAL '3 days', 4, 1, 56, 2, 15, 9, 'Emergency evacuations due to extreme heat. Ambulance standby at cooling centers.'),
  (CURRENT_DATE - INTERVAL '4 days', 3, 1, 42, 2, 10, 7, 'Relief goods delivered to 3 barangays. Medical emergencies responded.'),
  (CURRENT_DATE - INTERVAL '5 days', 6, 3, 89, 4, 22, 15, 'Multiple heat-related emergencies. All ambulances deployed.'),
  (CURRENT_DATE - INTERVAL '6 days', 2, 0, 28, 1, 7, 5, 'Routine monitoring and patrols. Regular ambulance service.')
ON CONFLICT (operation_date) DO NOTHING;

-- Grant permissions
GRANT ALL ON cdrrmo_daily_operations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
