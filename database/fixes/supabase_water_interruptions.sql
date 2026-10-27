-- Water Interruptions Table for Super El Nino tracking
-- Run this in Supabase SQL Editor

DROP TABLE IF EXISTS water_interruptions CASCADE;

CREATE TABLE water_interruptions (
  id BIGSERIAL PRIMARY KEY,
  interruption_date DATE NOT NULL,
  interruption_time TIME,
  provider TEXT NOT NULL,
  affected_barangays TEXT,
  cause TEXT,
  duration_hours NUMERIC(10,2) DEFAULT 0,
  households_affected INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ongoing',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_water_int_date ON water_interruptions(interruption_date DESC);
CREATE INDEX idx_water_int_provider ON water_interruptions(provider);
CREATE INDEX idx_water_int_status ON water_interruptions(status);

-- Add CHECK constraints for data integrity
ALTER TABLE water_interruptions 
ADD CONSTRAINT valid_provider 
CHECK (provider IN ('Palayan City Water District', 'Balibago Waterworks'));

ALTER TABLE water_interruptions 
ADD CONSTRAINT valid_cause 
CHECK (cause IN ('pipe_burst', 'maintenance', 'shortage', 'pump_failure', 'other'));

ALTER TABLE water_interruptions 
ADD CONSTRAINT valid_status 
CHECK (status IN ('ongoing', 'restored'));

ALTER TABLE water_interruptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage water interruptions"
  ON water_interruptions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

CREATE POLICY "Superadmins can manage water interruptions"
  ON water_interruptions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'superadmin');
