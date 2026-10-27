-- Power Interruptions Table for Super El Nino tracking
-- Run this in Supabase SQL Editor

DROP TABLE IF EXISTS power_interruptions CASCADE;

CREATE TABLE power_interruptions (
  id BIGSERIAL PRIMARY KEY,
  interruption_date DATE NOT NULL,
  total_outages INTEGER DEFAULT 0,
  total_affected_households INTEGER DEFAULT 0,
  feeders_affected TEXT,
  total_duration_minutes INTEGER DEFAULT 0,
  peak_outage_time TIME,
  cause TEXT,
  restoration_status TEXT DEFAULT 'restored',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_power_int_date ON power_interruptions(interruption_date DESC);
CREATE INDEX idx_power_int_status ON power_interruptions(restoration_status);

-- Add CHECK constraints for data integrity
ALTER TABLE power_interruptions 
ADD CONSTRAINT valid_cause 
CHECK (cause IN ('line_fault', 'transformer_issue', 'weather', 'maintenance', 'overload', 'other'));

ALTER TABLE power_interruptions 
ADD CONSTRAINT valid_restoration_status 
CHECK (restoration_status IN ('ongoing', 'restored', 'partial'));

ALTER TABLE power_interruptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage power interruptions"
  ON power_interruptions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

CREATE POLICY "Superadmins can manage power interruptions"
  ON power_interruptions FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'superadmin');
