-- ========================================
-- SECURITY: Server-Side Input Validation
-- ========================================
-- This file contains PostgreSQL CHECK constraints and trigger functions
-- to enforce data integrity at the database level, preventing malicious
-- or malformed data from being inserted even if client validation is bypassed.
--
-- Apply this file in Supabase SQL Editor to add validation constraints.

-- ===========================================
-- REPORTS TABLE VALIDATION
-- ===========================================

-- Add CHECK constraints to reports table
ALTER TABLE reports
ADD CONSTRAINT check_description_length 
CHECK (char_length(description) >= 10 AND char_length(description) <= 5000);

ALTER TABLE reports
ADD CONSTRAINT check_category_valid
CHECK (category IN (
  'Flood', 'Fire', 'Landslide', 'Accident', 'Medical Emergency', 
  'Utility Outage', 'Road Damage', 'Other', 'Drought', 'Heat Stroke',
  'Crop Failure', 'Water Shortage', 'Power Outage', 'Infrastructure Damage'
));

ALTER TABLE reports
ADD CONSTRAINT check_status_valid
CHECK (status IN ('pending', 'inprogress', 'resolved', 'rejected'));

ALTER TABLE reports
ADD CONSTRAINT check_latitude_range
CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90));

ALTER TABLE reports
ADD CONSTRAINT check_longitude_range
CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180));

-- Palayan City bounds check (optional, stricter validation)
ALTER TABLE reports
ADD CONSTRAINT check_palayan_coordinates
CHECK (
  lat IS NULL OR lng IS NULL OR
  (lat BETWEEN 15.4 AND 15.6 AND lng BETWEEN 121.0 AND 121.2)
);

-- Create trigger function for additional business logic validation
CREATE OR REPLACE FUNCTION validate_report_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure full_name is provided for guest reports (user_id is null)
  IF NEW.user_id IS NULL AND (NEW.full_name IS NULL OR trim(NEW.full_name) = '') THEN
    RAISE EXCEPTION 'full_name is required for guest reports';
  END IF;

  -- Ensure location is not empty
  IF NEW.location IS NULL OR trim(NEW.location) = '' THEN
    RAISE EXCEPTION 'location is required';
  END IF;

  -- Validate photo_url format (must be comma-separated URLs if provided)
  IF NEW.photo_url IS NOT NULL AND NEW.photo_url != '' THEN
    -- Check that photo_url contains valid URL patterns
    IF NOT (NEW.photo_url ~ '^https?://.*') THEN
      RAISE EXCEPTION 'photo_url must contain valid URLs';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to reports table
DROP TRIGGER IF EXISTS trigger_validate_report ON reports;
CREATE TRIGGER trigger_validate_report
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION validate_report_before_insert();

-- ===========================================
-- ADVISORIES TABLE VALIDATION
-- ===========================================

ALTER TABLE advisories
ADD CONSTRAINT check_title_length
CHECK (char_length(title) >= 5 AND char_length(title) <= 200);

ALTER TABLE advisories
ADD CONSTRAINT check_content_length
CHECK (char_length(content) >= 20 AND char_length(content) <= 10000);

ALTER TABLE advisories
ADD CONSTRAINT check_severity_valid
CHECK (severity IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE advisories
ADD CONSTRAINT check_status_advisory_valid
CHECK (status IN ('Draft', 'Pending', 'Published', 'Unpublished', 'Archived'));

-- ===========================================
-- HOSPITAL_DAILY_RECORDS TABLE VALIDATION
-- ===========================================

ALTER TABLE hospital_daily_records
ADD CONSTRAINT check_el_nino_cases_positive
CHECK (el_nino_cases >= 0);

ALTER TABLE hospital_daily_records
ADD CONSTRAINT check_available_beds_positive
CHECK (available_beds >= 0);

ALTER TABLE hospital_daily_records
ADD CONSTRAINT check_beds_capacity_logical
CHECK (available_beds <= total_bed_capacity);

-- Create trigger to validate hospital record logic
CREATE OR REPLACE FUNCTION validate_hospital_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure total_bed_capacity is positive
  IF NEW.total_bed_capacity IS NOT NULL AND NEW.total_bed_capacity <= 0 THEN
    RAISE EXCEPTION 'total_bed_capacity must be greater than 0';
  END IF;

  -- Ensure record_date is not in the future
  IF NEW.record_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'record_date cannot be in the future';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_hospital_record ON hospital_daily_records;
CREATE TRIGGER trigger_validate_hospital_record
  BEFORE INSERT OR UPDATE ON hospital_daily_records
  FOR EACH ROW
  EXECUTE FUNCTION validate_hospital_record();

-- ===========================================
-- WATER_INTERRUPTIONS TABLE VALIDATION
-- ===========================================

ALTER TABLE water_interruptions
ADD CONSTRAINT check_affected_households_positive
CHECK (affected_households >= 0);

ALTER TABLE water_interruptions
ADD CONSTRAINT check_duration_hours_positive
CHECK (duration_hours >= 0);

ALTER TABLE water_interruptions
ADD CONSTRAINT check_water_status_valid
CHECK (status IN ('Scheduled', 'Ongoing', 'Restored', 'Cancelled'));

-- ===========================================
-- POWER_INTERRUPTIONS TABLE VALIDATION
-- ===========================================

ALTER TABLE power_interruptions
ADD CONSTRAINT check_power_affected_households_positive
CHECK (affected_households >= 0);

ALTER TABLE power_interruptions
ADD CONSTRAINT check_power_duration_hours_positive
CHECK (duration_hours >= 0);

ALTER TABLE power_interruptions
ADD CONSTRAINT check_power_status_valid
CHECK (status IN ('Scheduled', 'Ongoing', 'Restored', 'Cancelled'));

-- ===========================================
-- CDRRMO_OPERATIONS TABLE VALIDATION (if applicable)
-- ===========================================

-- Add validation for CDRRMO operations if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cdrrmo_operations') THEN
    ALTER TABLE cdrrmo_operations
    ADD CONSTRAINT check_evacuees_positive
    CHECK (evacuees >= 0);

    ALTER TABLE cdrrmo_operations
    ADD CONSTRAINT check_operation_status_valid
    CHECK (status IN ('Active', 'Standby', 'Completed', 'Cancelled'));
  END IF;
END $$;

-- ===========================================
-- BFP_OPERATIONS TABLE VALIDATION (if applicable)
-- ===========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bfp_operations') THEN
    ALTER TABLE bfp_operations
    ADD CONSTRAINT check_fire_personnel_positive
    CHECK (personnel_deployed >= 0);

    ALTER TABLE bfp_operations
    ADD CONSTRAINT check_fire_status_valid
    CHECK (status IN ('Active', 'Controlled', 'Extinguished', 'Monitoring'));
  END IF;
END $$;

-- ===========================================
-- AGRICULTURE_DAMAGES TABLE VALIDATION (if applicable)
-- ===========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agriculture_damages') THEN
    ALTER TABLE agriculture_damages
    ADD CONSTRAINT check_affected_area_positive
    CHECK (affected_area >= 0);

    ALTER TABLE agriculture_damages
    ADD CONSTRAINT check_estimated_loss_positive
    CHECK (estimated_loss >= 0);
  END IF;
END $$;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- List all CHECK constraints added
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'c'
  AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND conname LIKE 'check_%'
ORDER BY conrelid::regclass::text, conname;

-- Test constraints (these should fail)
-- Uncomment to test:

-- INSERT INTO reports (description, category, status, latitude, longitude, location, full_name)
-- VALUES ('short', 'InvalidCategory', 'invalid', 91, 200, 'Test', 'Test User');

-- INSERT INTO hospital_daily_records (hospital_id, record_date, el_nino_cases, available_beds, total_bed_capacity)
-- VALUES (1, CURRENT_DATE, -5, 150, 100);

-- INSERT INTO water_interruptions (barangay, affected_households, duration_hours, status)
-- VALUES ('Test Barangay', -10, -5, 'InvalidStatus');
