-- ============================================================================
-- Agricultural Damage Reports Table
-- Palayan City Agricultural Damages - Super El Niño Impact Tracking
-- ============================================================================

-- Agricultural Damage Reports Table
CREATE TABLE agriculture_damage_reports (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'farm', -- 'farm' or 'livestock'
  report_date DATE NOT NULL,
  report_time TIME,
  farmer_name TEXT NOT NULL,
  barangay TEXT NOT NULL,
  
  -- For farm: crop type, for livestock: animal type
  crop_type TEXT NOT NULL, -- Farm: 'rice', 'corn', 'vegetables', 'fruits', 'fishery', 'other' | Livestock: 'cattle', 'carabao', 'swine', 'poultry', 'goats', 'fish', 'other'
  
  -- For farm: hectares, for livestock: animal count
  area_affected_hectares NUMERIC(10,2) NOT NULL DEFAULT 0, -- Farm: hectares | Livestock: number of animals
  
  -- For farm: crop damage %, for livestock: mortality rate %
  damage_percentage INTEGER NOT NULL DEFAULT 0, -- 0-100% (Farm: crop damage | Livestock: mortality rate)
  
  estimated_loss_value NUMERIC(12,2) NOT NULL DEFAULT 0, -- PHP
  
  -- Cause varies by category
  cause TEXT, -- Farm: 'drought', 'pest_infestation', 'crop_failure', 'water_shortage', 'heat_stress', 'flood', 'other' | Livestock: 'disease', 'heat_stress', 'water_shortage', 'drought', 'malnutrition', 'predator_attack', 'other'
  
  description TEXT,
  
  -- Assistance varies by category  
  assistance_needed TEXT, -- Farm: 'seeds', 'fertilizer', 'irrigation', 'pesticides', 'financial', 'equipment', 'none' | Livestock: 'veterinary', 'medicine', 'feed', 'water', 'financial', 'shelter', 'none'
  
  status TEXT DEFAULT 'pending', -- 'pending', 'assessed', 'assistance_provided'
  assessed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_agri_damage_date ON agriculture_damage_reports(report_date DESC);
CREATE INDEX idx_agri_damage_category ON agriculture_damage_reports(category);
CREATE INDEX idx_agri_damage_barangay ON agriculture_damage_reports(barangay);
CREATE INDEX idx_agri_damage_crop ON agriculture_damage_reports(crop_type);
CREATE INDEX idx_agri_damage_status ON agriculture_damage_reports(status);

-- Enable Row Level Security
ALTER TABLE agriculture_damage_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view damage reports" 
  ON agriculture_damage_reports 
  FOR SELECT 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

CREATE POLICY "Admins can insert damage reports" 
  ON agriculture_damage_reports 
  FOR INSERT 
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

CREATE POLICY "Admins can update damage reports" 
  ON agriculture_damage_reports 
  FOR UPDATE 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

CREATE POLICY "Admins can delete damage reports" 
  ON agriculture_damage_reports 
  FOR DELETE 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin');

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agriculture_damage_updated_at() 
RETURNS TRIGGER AS $$ 
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

CREATE TRIGGER agriculture_damage_updated_at_trigger 
  BEFORE UPDATE ON agriculture_damage_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_agriculture_damage_updated_at();
