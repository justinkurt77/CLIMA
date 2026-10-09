-- ============================================================================
-- CDRRMO Operations Module v2 - Per-Operation Records
-- Palayan City CDRRMO Operations - Super El Niño Response Tracking
-- Each row = one individual operation (not a daily aggregate)
-- ============================================================================

-- Drop old per-day table and create new per-operation table
DROP TABLE IF EXISTS cdrrmo_daily_operations CASCADE;

CREATE TABLE IF NOT EXISTS cdrrmo_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_date DATE NOT NULL,
  operation_time TIME,
  operation_type TEXT NOT NULL,
  -- Valid types: 'evacuation', 'rescue', 'relief_distribution', 'damage_assessment', 'ambulance_dispatch', 'emergency_response'
  description TEXT,
  location TEXT,
  personnel_deployed INTEGER DEFAULT 0,
  beneficiaries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- No unique constraint on date (multiple operations per day are allowed)
CREATE INDEX idx_cdrrmo_ops_date ON cdrrmo_operations(operation_date DESC);
CREATE INDEX idx_cdrrmo_ops_type ON cdrrmo_operations(operation_type);

-- Row Level Security
ALTER TABLE cdrrmo_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view CDRRMO operations"
  ON cdrrmo_operations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert CDRRMO operations"
  ON cdrrmo_operations FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can update CDRRMO operations"
  ON cdrrmo_operations FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can delete CDRRMO operations"
  ON cdrrmo_operations FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_cdrrmo_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cdrrmo_operations_updated_at
  BEFORE UPDATE ON cdrrmo_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_cdrrmo_operations_updated_at();

-- Grant permissions
GRANT ALL ON cdrrmo_operations TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
