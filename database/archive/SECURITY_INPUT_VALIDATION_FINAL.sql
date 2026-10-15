-- ============================================================================
-- CLIMA SECURITY INPUT VALIDATION (FINAL - With Data Cleanup)
-- ============================================================================
-- This version cleans up invalid data BEFORE adding constraints
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX EXISTING DATA
-- ============================================================================

-- Fix advisories with titles that are too short or too long
UPDATE advisories 
SET title = 'Advisory ' || id::text 
WHERE char_length(title) < 3;

UPDATE advisories 
SET title = substring(title, 1, 200) 
WHERE char_length(title) > 200;

-- Fix reports with invalid descriptions
UPDATE reports 
SET description = 'No description provided - ' || COALESCE(title, category, 'Report')
WHERE description IS NULL OR char_length(description) < 10;

UPDATE reports 
SET description = substring(description, 1, 5000) 
WHERE char_length(description) > 5000;

-- Fix reports with invalid coordinates
UPDATE reports 
SET lat = 15.5398, lng = 121.0827  -- Palayan City center
WHERE lat IS NULL OR lng IS NULL OR lat < -90 OR lat > 90 OR lng < -180 OR lng > 180;

-- Fix reports with empty locations
UPDATE reports 
SET location = 'Palayan City' 
WHERE location IS NULL OR trim(location) = '';

-- Fix advisories with invalid content length
UPDATE advisories 
SET content = 'Advisory content - ' || title 
WHERE content IS NULL OR char_length(content) < 10;

UPDATE advisories 
SET content = substring(content, 1, 10000) 
WHERE char_length(content) > 10000;

-- ============================================================================
-- STEP 2: ADD CONSTRAINTS (After data is clean)
-- ============================================================================

-- REPORTS TABLE CONSTRAINTS
ALTER TABLE reports
  ADD CONSTRAINT check_reports_description_length
  CHECK (char_length(description) >= 10 AND char_length(description) <= 5000);

ALTER TABLE reports
  ADD CONSTRAINT check_reports_status_valid
  CHECK (status IN ('pending', 'inprogress', 'resolved'));

ALTER TABLE reports
  ADD CONSTRAINT check_reports_lat_valid
  CHECK (lat BETWEEN -90 AND 90);

ALTER TABLE reports
  ADD CONSTRAINT check_reports_lng_valid
  CHECK (lng BETWEEN -180 AND 180);

ALTER TABLE reports
  ADD CONSTRAINT check_reports_location_not_empty
  CHECK (char_length(trim(location)) > 0);

-- ADVISORIES TABLE CONSTRAINTS
ALTER TABLE advisories
  ADD CONSTRAINT check_advisories_title_length
  CHECK (char_length(title) >= 3 AND char_length(title) <= 200);

ALTER TABLE advisories
  ADD CONSTRAINT check_advisories_content_length
  CHECK (char_length(content) >= 10 AND char_length(content) <= 10000);

-- Only add severity constraint if the column exists and has valid values
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advisories' AND column_name = 'severity') THEN
    -- Check if all current values are valid
    IF NOT EXISTS (SELECT 1 FROM advisories WHERE severity NOT IN ('low', 'medium', 'high', 'critical')) THEN
      ALTER TABLE advisories
        ADD CONSTRAINT check_advisories_severity_valid
        CHECK (severity IN ('low', 'medium', 'high', 'critical'));
    END IF;
  END IF;
END $$;

-- Only add status constraint if the column exists and has valid values  
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'advisories' AND column_name = 'status') THEN
    -- Check if all current values are valid
    IF NOT EXISTS (SELECT 1 FROM advisories WHERE status NOT IN ('draft', 'active', 'expired')) THEN
      ALTER TABLE advisories
        ADD CONSTRAINT check_advisories_status_valid
        CHECK (status IN ('draft', 'active', 'expired'));
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: ADD VALIDATION TRIGGERS
-- ============================================================================

-- Guest report validation
CREATE OR REPLACE FUNCTION validate_guest_report()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND (NEW.full_name IS NULL OR char_length(trim(NEW.full_name)) = 0) THEN
    RAISE EXCEPTION 'Guest reports must include full_name';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_guest_report ON reports;
CREATE TRIGGER trigger_validate_guest_report
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION validate_guest_report();

-- Hospital beds validation (if columns exist)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hospital_daily_records' 
    AND column_name IN ('total_bed_capacity', 'available_beds')
  ) THEN
    CREATE OR REPLACE FUNCTION validate_hospital_beds()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.total_bed_capacity IS NOT NULL AND NEW.available_beds IS NOT NULL THEN
        IF NEW.available_beds > NEW.total_bed_capacity THEN
          RAISE EXCEPTION 'Available beds cannot exceed total bed capacity';
        END IF;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_validate_hospital_beds ON hospital_daily_records;
    CREATE TRIGGER trigger_validate_hospital_beds
      BEFORE INSERT OR UPDATE ON hospital_daily_records
      FOR EACH ROW
      EXECUTE FUNCTION validate_hospital_beds();
  END IF;
END $$;

-- BFP validation
CREATE OR REPLACE FUNCTION validate_bfp_personnel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.personnel_deployed IS NOT NULL AND NEW.personnel_deployed < 0 THEN
    RAISE EXCEPTION 'Personnel deployed cannot be negative';
  END IF;
  
  IF NEW.casualties IS NOT NULL AND NEW.casualties < 0 THEN
    RAISE EXCEPTION 'Casualties cannot be negative';
  END IF;
  
  IF NEW.fire_trucks_dispatched IS NOT NULL AND NEW.fire_trucks_dispatched < 0 THEN
    RAISE EXCEPTION 'Fire trucks dispatched cannot be negative';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_bfp_personnel ON bfp_operations;
CREATE TRIGGER trigger_validate_bfp_personnel
  BEFORE INSERT OR UPDATE ON bfp_operations
  FOR EACH ROW
  EXECUTE FUNCTION validate_bfp_personnel();

-- CDRRMO validation
CREATE OR REPLACE FUNCTION validate_cdrrmo_personnel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.families_assisted IS NOT NULL AND NEW.families_assisted < 0 THEN
    RAISE EXCEPTION 'Families assisted cannot be negative';
  END IF;
  
  IF NEW.relief_operations IS NOT NULL AND NEW.relief_operations < 0 THEN
    RAISE EXCEPTION 'Relief operations cannot be negative';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_cdrrmo_personnel ON cdrrmo_daily_operations;
CREATE TRIGGER trigger_validate_cdrrmo_personnel
  BEFORE INSERT OR UPDATE ON cdrrmo_daily_operations
  FOR EACH ROW
  EXECUTE FUNCTION validate_cdrrmo_personnel();

-- Agriculture damage validation
ALTER TABLE agriculture_damage_reports
  ADD CONSTRAINT check_agri_damage_area_positive
  CHECK (area_affected_hectares >= 0);

ALTER TABLE agriculture_damage_reports
  ADD CONSTRAINT check_agri_estimated_loss_positive
  CHECK (estimated_loss_value >= 0);

ALTER TABLE agriculture_damage_reports
  ADD CONSTRAINT check_agri_damage_percentage_valid
  CHECK (damage_percentage >= 0 AND damage_percentage <= 100);

ALTER TABLE agriculture_damage_reports
  ADD CONSTRAINT check_agri_status_valid
  CHECK (status IN ('pending', 'assessed', 'assistance_provided'));

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check all constraints were created
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND contype = 'c'
  AND conrelid::regclass::text IN (
    'reports', 'advisories', 'agriculture_damage_reports'
  )
ORDER BY table_name, constraint_name;

-- Check all triggers were created
SELECT
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'reports',
    'hospital_daily_records',
    'cdrrmo_daily_operations',
    'bfp_operations'
  )
ORDER BY event_object_table, trigger_name;
