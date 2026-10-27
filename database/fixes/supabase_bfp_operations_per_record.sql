-- ============================================================================
-- BFP Operations Module (Per-Operation Records)
-- Palayan City BFP Operations - Super El Niño Fire Risk Tracking
-- Migration from daily aggregates to individual operation records
-- ============================================================================

-- Create new per-operation table
CREATE TABLE IF NOT EXISTS bfp_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_date DATE NOT NULL,
  operation_time TIME NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('fire_incident', 'fire_prevention_inspection', 'fire_safety_seminar', 'rescue_operation', 'medical_assist', 'emergency_response')),
  description TEXT,
  location TEXT NOT NULL,
  personnel_deployed INTEGER DEFAULT 0,
  fire_trucks_dispatched INTEGER DEFAULT 0,
  casualties INTEGER DEFAULT 0,
  property_damage_estimate NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bfp_ops_date ON bfp_operations(operation_date DESC, operation_time DESC);
CREATE INDEX IF NOT EXISTS idx_bfp_ops_type ON bfp_operations(operation_type);

-- Enable Row Level Security
ALTER TABLE bfp_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view BFP operations"
  ON bfp_operations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert BFP operations"
  ON bfp_operations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can update BFP operations"
  ON bfp_operations
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can delete BFP operations"
  ON bfp_operations
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bfp_ops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bfp_ops_updated_at
  BEFORE UPDATE ON bfp_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_bfp_ops_updated_at();

-- Sample data for testing (individual operations)
INSERT INTO bfp_operations (operation_date, operation_time, operation_type, description, location, personnel_deployed, fire_trucks_dispatched, casualties, property_damage_estimate)
VALUES
  (CURRENT_DATE, '09:15', 'fire_incident', 'Grass fire due to extreme heat', 'Brgy. Atate', 12, 2, 0, 5000.00),
  (CURRENT_DATE, '11:30', 'fire_prevention_inspection', 'Commercial establishment inspection', 'City Proper', 3, 0, 0, 0),
  (CURRENT_DATE, '14:00', 'rescue_operation', 'Vehicle accident rescue', 'National Highway', 8, 1, 2, 0),
  (CURRENT_DATE, '16:45', 'fire_safety_seminar', 'Community fire safety education', 'Brgy. Atate Elementary School', 4, 0, 0, 0),
  (CURRENT_DATE - INTERVAL '1 day', '08:20', 'fire_incident', 'Residential fire', 'Brgy. Malate', 15, 3, 1, 250000.00),
  (CURRENT_DATE - INTERVAL '1 day', '10:00', 'fire_prevention_inspection', 'Market inspection', 'Public Market', 2, 0, 0, 0),
  (CURRENT_DATE - INTERVAL '1 day', '13:30', 'medical_assist', 'Emergency medical response', 'Brgy. Caballero', 4, 1, 0, 0),
  (CURRENT_DATE - INTERVAL '2 days', '07:45', 'fire_incident', 'Vegetation fire', 'Agricultural area', 10, 2, 0, 15000.00),
  (CURRENT_DATE - INTERVAL '2 days', '09:30', 'fire_prevention_inspection', 'Residential area inspection', 'Subdivision Area', 3, 0, 0, 0),
  (CURRENT_DATE - INTERVAL '2 days', '15:00', 'rescue_operation', 'Water rescue operation', 'Peñaranda River', 8, 1, 0, 0),
  (CURRENT_DATE - INTERVAL '3 days', '11:00', 'fire_incident', 'Small electrical fire', 'Brgy. Singalat', 8, 1, 0, 30000.00),
  (CURRENT_DATE - INTERVAL '3 days', '14:30', 'fire_safety_seminar', 'Workplace fire safety training', 'City Hall', 3, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON bfp_operations TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE bfp_operations_id_seq TO authenticated;
