-- ============================================================================
-- BFP Operations Module v2 - Per-Operation Records
-- Palayan City BFP Operations - Super El Niño Fire Risk Tracking
-- Each row = one individual operation (not a daily aggregate)
-- ============================================================================

-- Drop existing indexes first (if they exist)
DROP INDEX IF EXISTS idx_bfp_ops_date CASCADE;
DROP INDEX IF EXISTS idx_bfp_ops_type CASCADE;

-- Drop old tables (both possible names)
DROP TABLE IF EXISTS bfp_daily_operations CASCADE;
DROP TABLE IF EXISTS bfp_operations CASCADE;

-- Create new per-operation table
CREATE TABLE bfp_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_date DATE NOT NULL,
  operation_time TIME,
  operation_type TEXT NOT NULL,
  -- Valid types: 'fire_incident', 'fire_prevention_inspection', 'fire_safety_seminar', 'rescue_operation', 'medical_assist', 'emergency_response'
  description TEXT,
  location TEXT,
  personnel_deployed INTEGER DEFAULT 0,
  fire_trucks_dispatched INTEGER DEFAULT 0,
  casualties INTEGER DEFAULT 0,
  property_damage_estimate NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bfp_ops_date ON bfp_operations(operation_date DESC);
CREATE INDEX idx_bfp_ops_type ON bfp_operations(operation_type);

-- Row Level Security
ALTER TABLE bfp_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view BFP operations"
  ON bfp_operations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert BFP operations"
  ON bfp_operations FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can update BFP operations"
  ON bfp_operations FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can delete BFP operations"
  ON bfp_operations FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_bfp_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bfp_operations_updated_at
  BEFORE UPDATE ON bfp_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_bfp_operations_updated_at();

-- Grant permissions
GRANT ALL ON bfp_operations TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
