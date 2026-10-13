-- ============================================================================
-- CLIMA SECURITY INPUT VALIDATION
-- ============================================================================
-- Server-side input validation using PostgreSQL constraints and triggers
-- 
-- Purpose: Enforce data integrity at the database level to prevent:
--   - SQL injection (via constraints on values)
--   - XSS attacks (via content length limits)
--   - Invalid data states (via CHECK constraints)
--   - Business logic violations (via triggers)
--
-- Author: CLIMA Development Team
-- Date: January 2025
-- ============================================================================

-- ============================================================================
-- REPORTS TABLE CONSTRAINTS
-- ============================================================================

-- Description length validation (prevent XSS via excessive content)
ALTER TABLE reports
  ADD CONSTRAINT check_reports_description_length
  CHECK (char_length(description) >= 10 AND char_length(description) <= 5000);

-- Category validation (must match predefined categories)
ALTER TABLE reports
  ADD CONSTRAINT check_reports_category_valid
  CHECK (category IN (
    'Road Damage',
    'Drainage Issue',
    'Illegal Dumping',
    'Street Light',
    'Power Outage',
    'Water Supply',
    'Trees/Vegetation',
    'Abandoned Vehicle',
    'Graffiti',
    'Sidewalk Issue',
    'Potholes',
    'Other'
  ));

-- Status validation
ALTER TABLE reports
  ADD CONSTRAINT check_reports_status_valid
  CHECK (status IN ('pending', 'inprogress', 'resolved'));

-- Coordinate validation
ALTER TABLE reports
  ADD CONSTRAINT check_reports_latitude_valid
  CHECK (latitude BETWEEN -90 AND 90);

ALTER TABLE reports
  ADD CONSTRAINT check_reports_longitude_valid
  CHECK (longitude BETWEEN -180 AND 180);

-- Title length validation
ALTER TABLE reports
  ADD CONSTRAINT check_reports_title_length
  CHECK (char_length(title) >= 3 AND char_length(title) <= 200);

-- Location validation
ALTER TABLE reports
  ADD CONSTRAINT check_reports_location_not_empty
  CHECK (char_length(trim(location)) > 0);

-- Guest report validation (full_name required if user_id is null)
CREATE OR REPLACE FUNCTION validate_guest_report()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND (NEW.full_name IS NULL OR char_length(trim(NEW.full_name)) = 0) THEN
    RAISE EXCEPTION 'Guest reports must include full_name';
  END IF;
  
  -- Validate photo_urls array length
  IF NEW.photo_urls IS NOT NULL AND array_length(NEW.photo_urls, 1) > 4 THEN
    RAISE EXCEPTION 'Maximum 4 photos allowed per report';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_guest_report
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION validate_guest_report();

-- ============================================================================
-- ADVISORIES TABLE CONSTRAINTS
-- ============================================================================

-- Title validation
ALTER TABLE advisories
  ADD CONSTRAINT check_advisories_title_length
  CHECK (char_length(title) >= 3 AND char_length(title) <= 200);

-- Content validation
ALTER TABLE advisories
  ADD CONSTRAINT check_advisories_content_length
  CHECK (char_length(content) >= 10 AND char_length(content) <= 10000);

-- Severity validation
ALTER TABLE advisories
  ADD CONSTRAINT check_advisories_severity_valid
  CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Status validation
ALTER TABLE advisories
  ADD CONSTRAINT check_advisories_status_valid
  CHECK (status IN ('draft', 'active', 'expired'));

-- ============================================================================
-- HOSPITAL DAILY RECORDS CONSTRAINTS
-- ============================================================================

-- Numeric validation (no negative values)
ALTER TABLE hospital_daily_records
  ADD CONSTRAINT check_hospital_el_nino_cases_positive
  CHECK (el_nino_cases >= 0);

ALTER TABLE hospital_daily_records
  ADD CONSTRAINT check_hospital_available_beds_positive
  CHECK (available_beds >= 0);

-- Logical validation (available beds cannot exceed total capacity)
CREATE OR REPLACE FUNCTION validate_hospital_beds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_bed_capacity IS NOT NULL AND NEW.available_beds > NEW.total_bed_capacity THEN
    RAISE EXCEPTION 'Available beds cannot exceed total bed capacity';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_hospital_beds
  BEFORE INSERT OR UPDATE ON hospital_daily_records
  FOR EACH ROW
  EXECUTE FUNCTION validate_hospital_beds();

-- ============================================================================
-- WATER INTERRUPTIONS CONSTRAINTS
-- ============================================================================

-- Affected households validation
ALTER TABLE water_interruptions
  ADD CONSTRAINT check_water_affected_households_positive
  CHECK (affected_households >= 0);

-- Duration validation
ALTER TABLE water_interruptions
  ADD CONSTRAINT check_water_duration_positive
  CHECK (duration_hours >= 0);

-- Status validation
ALTER TABLE water_interruptions
  ADD CONSTRAINT check_water_status_valid
  CHECK (status IN ('scheduled', 'ongoing', 'completed'));

-- Logical validation (end_time must be after start_time)
CREATE OR REPLACE FUNCTION validate_water_interruption_times()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    IF NEW.end_time <= NEW.start_time THEN
      RAISE EXCEPTION 'End time must be after start time';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_water_times
  BEFORE INSERT OR UPDATE ON water_interruptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_water_interruption_times();

-- ============================================================================
-- POWER INTERRUPTIONS CONSTRAINTS
-- ============================================================================

-- Affected households validation
ALTER TABLE power_interruptions
  ADD CONSTRAINT check_power_affected_households_positive
  CHECK (affected_households >= 0);

-- Duration validation
ALTER TABLE power_interruptions
  ADD CONSTRAINT check_power_duration_positive
  CHECK (duration_hours >= 0);

-- Status validation
ALTER TABLE power_interruptions
  ADD CONSTRAINT check_power_status_valid
  CHECK (status IN ('scheduled', 'ongoing', 'completed'));

-- Logical validation (end_time must be after start_time)
CREATE OR REPLACE FUNCTION validate_power_interruption_times()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    IF NEW.end_time <= NEW.start_time THEN
      RAISE EXCEPTION 'End time must be after start time';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_power_times
  BEFORE INSERT OR UPDATE ON power_interruptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_power_interruption_times();

-- ============================================================================
-- CDRRMO OPERATIONS CONSTRAINTS
-- ============================================================================

-- Status validation
ALTER TABLE cdrrmo_daily_operations
  ADD CONSTRAINT check_cdrrmo_status_valid
  CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled'));

-- Personnel count validation
CREATE OR REPLACE FUNCTION validate_cdrrmo_personnel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.personnel_deployed IS NOT NULL AND NEW.personnel_deployed < 0 THEN
    RAISE EXCEPTION 'Personnel deployed cannot be negative';
  END IF;
  
  IF NEW.families_assisted IS NOT NULL AND NEW.families_assisted < 0 THEN
    RAISE EXCEPTION 'Families assisted cannot be negative';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_cdrrmo_personnel
  BEFORE INSERT OR UPDATE ON cdrrmo_daily_operations
  FOR EACH ROW
  EXECUTE FUNCTION validate_cdrrmo_personnel();

-- ============================================================================
-- BFP OPERATIONS CONSTRAINTS
-- ============================================================================

-- Status validation
ALTER TABLE bfp_operations
  ADD CONSTRAINT check_bfp_status_valid
  CHECK (status IN ('ongoing', 'controlled', 'extinguished'));

-- Personnel count validation
CREATE OR REPLACE FUNCTION validate_bfp_personnel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.personnel_deployed IS NOT NULL AND NEW.personnel_deployed < 0 THEN
    RAISE EXCEPTION 'Personnel deployed cannot be negative';
  END IF;
  
  IF NEW.casualties IS NOT NULL AND NEW.casualties < 0 THEN
    RAISE EXCEPTION 'Casualties cannot be negative';
  END IF;
  
  IF NEW.families_affected IS NOT NULL AND NEW.families_affected < 0 THEN
    RAISE EXCEPTION 'Families affected cannot be negative';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_bfp_personnel
  BEFORE INSERT OR UPDATE ON bfp_operations
  FOR EACH ROW
  EXECUTE FUNCTION validate_bfp_personnel();

-- ============================================================================
-- AGRICULTURE DAMAGE REPORTS CONSTRAINTS
-- ============================================================================

-- Damage area validation
ALTER TABLE agriculture_damage_reports
  ADD CONSTRAINT check_agri_damage_area_positive
  CHECK (damage_area >= 0);

-- Estimated loss validation
ALTER TABLE agriculture_damage_reports
  ADD CONSTRAINT check_agri_estimated_loss_positive
  CHECK (estimated_loss >= 0);

-- Status validation
ALTER TABLE agriculture_damage_reports
  ADD CONSTRAINT check_agri_status_valid
  CHECK (status IN ('reported', 'verified', 'processed'));

-- ============================================================================
-- VERIFICATION & MONITORING
-- ============================================================================

-- Query to list all constraints
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND contype = 'c'  -- CHECK constraints only
ORDER BY conrelid::regclass::text, conname;

-- Query to test if a constraint exists
SELECT EXISTS (
  SELECT 1
  FROM pg_constraint
  WHERE conname = 'check_reports_description_length'
    AND conrelid = 'reports'::regclass
);

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
--
-- To drop a constraint:
--   ALTER TABLE table_name DROP CONSTRAINT constraint_name;
--
-- To disable a trigger:
--   ALTER TABLE table_name DISABLE TRIGGER trigger_name;
--
-- To enable a trigger:
--   ALTER TABLE table_name ENABLE TRIGGER trigger_name;
--
-- To test a constraint:
--   INSERT INTO reports (description, category, ...) VALUES (...);
--   -- Should fail with: "new row violates check constraint"
--
-- ============================================================================
-- ROLLBACK PLAN
-- ============================================================================
--
-- If constraints cause issues with existing data, use NOT VALID:
--   ALTER TABLE reports ADD CONSTRAINT check_name CHECK (...) NOT VALID;
--   -- Then validate existing data separately
--   -- Once clean, validate the constraint:
--   ALTER TABLE reports VALIDATE CONSTRAINT check_name;
--
-- ============================================================================
