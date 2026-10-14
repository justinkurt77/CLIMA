-- ============================================================================
-- CDRRMO Operations Module (Per-Operation Records)
-- Palayan City CDRRMO Operations - Super El Niño Response Tracking
-- Migration from daily aggregates to individual operation records
-- ============================================================================

-- Create new per-operation table
CREATE TABLE IF NOT EXISTS cdrrmo_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_date DATE NOT NULL,
  operation_time TIME NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('evacuation', 'rescue', 'relief_distribution', 'damage_assessment', 'ambulance_dispatch', 'emergency_response')),
  description TEXT,
  location TEXT NOT NULL,
  personnel_deployed INTEGER DEFAULT 0,
  beneficiaries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_date ON cdrrmo_operations(operation_date DESC, operation_time DESC);
CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_type ON cdrrmo_operations(operation_type);

-- Enable Row Level Security
ALTER TABLE cdrrmo_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view CDRRMO operations"
  ON cdrrmo_operations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert CDRRMO operations"
  ON cdrrmo_operations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can update CDRRMO operations"
  ON cdrrmo_operations
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

CREATE POLICY "Admins can delete CDRRMO operations"
  ON cdrrmo_operations
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cdrrmo_ops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cdrrmo_ops_updated_at
  BEFORE UPDATE ON cdrrmo_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_cdrrmo_ops_updated_at();

-- Sample data for testing (individual operations)
INSERT INTO cdrrmo_operations (operation_date, operation_time, operation_type, description, location, personnel_deployed, beneficiaries)
VALUES
  (CURRENT_DATE, '08:30', 'evacuation', 'Evacuation of families due to extreme heat', 'Brgy. Singalat', 8, 25),
  (CURRENT_DATE, '10:15', 'ambulance_dispatch', 'Heat exhaustion patient transport', 'Brgy. Atate', 2, 1),
  (CURRENT_DATE, '14:00', 'relief_distribution', 'Water and food distribution', 'Evacuation Center A', 12, 45),
  (CURRENT_DATE - INTERVAL '1 day', '07:00', 'evacuation', 'Pre-emptive evacuation', 'Brgy. Caballero', 10, 32),
  (CURRENT_DATE - INTERVAL '1 day', '09:30', 'relief_distribution', 'Relief goods distribution', 'Brgy. Singalat', 8, 78),
  (CURRENT_DATE - INTERVAL '1 day', '11:45', 'ambulance_dispatch', 'Medical emergency response', 'City Proper', 2, 1),
  (CURRENT_DATE - INTERVAL '1 day', '13:20', 'emergency_response', 'Water shortage emergency', 'Brgy. Libertad', 6, 0),
  (CURRENT_DATE - INTERVAL '2 days', '08:00', 'relief_distribution', 'Water distribution', 'Multiple barangays', 6, 34),
  (CURRENT_DATE - INTERVAL '2 days', '15:30', 'damage_assessment', 'Crop damage assessment', 'Agricultural areas', 4, 0),
  (CURRENT_DATE - INTERVAL '3 days', '09:00', 'evacuation', 'Emergency evacuation', 'Brgy. Malate', 12, 56),
  (CURRENT_DATE - INTERVAL '3 days', '14:30', 'ambulance_dispatch', 'Heatstroke patient', 'Public Market', 2, 1)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON cdrrmo_operations TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE cdrrmo_operations_id_seq TO authenticated;
