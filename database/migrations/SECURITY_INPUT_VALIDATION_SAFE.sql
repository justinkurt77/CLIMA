-- =====================================================
-- SECURITY INPUT VALIDATION - SAFE VERSION
-- Checks for existing constraints/triggers before creating
-- Safe to run multiple times (idempotent)
-- =====================================================

-- =====================================================
-- PART 1: Fix Existing Invalid Data
-- =====================================================

-- Fix reports table: Set defaults for NULL or invalid values
UPDATE reports 
SET description = 'No description provided' 
WHERE description IS NULL OR LENGTH(description) < 10;

UPDATE reports 
SET status = 'pending' 
WHERE status IS NULL OR status NOT IN ('pending', 'in_progress', 'resolved', 'closed');

-- Fix advisories table: Set defaults for NULL or invalid values
UPDATE advisories 
SET title = 'Emergency Advisory' 
WHERE title IS NULL OR LENGTH(title) < 3;

UPDATE advisories 
SET content = 'Please check with local authorities for details.' 
WHERE content IS NULL OR LENGTH(content) < 10;

UPDATE advisories 
SET status = 'Draft' 
WHERE status IS NULL OR status NOT IN ('Draft', 'Pending', 'Published', 'Archived');

UPDATE advisories 
SET category = 'General' 
WHERE category IS NULL OR LENGTH(category) < 3;

-- =====================================================
-- PART 2: Add Check Constraints (with existence checks)
-- =====================================================

-- Reports table constraints
DO $$ 
BEGIN
    -- Description length (10-5000 characters)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_reports_description_length'
    ) THEN
        ALTER TABLE reports 
        ADD CONSTRAINT check_reports_description_length 
        CHECK (LENGTH(description) >= 10 AND LENGTH(description) <= 5000);
    END IF;

    -- Latitude range (-90 to 90)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_reports_lat_range'
    ) THEN
        ALTER TABLE reports 
        ADD CONSTRAINT check_reports_lat_range 
        CHECK (lat >= -90 AND lat <= 90);
    END IF;

    -- Longitude range (-180 to 180)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_reports_lng_range'
    ) THEN
        ALTER TABLE reports 
        ADD CONSTRAINT check_reports_lng_range 
        CHECK (lng >= -180 AND lng <= 180);
    END IF;

    -- Status enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_reports_status_valid'
    ) THEN
        ALTER TABLE reports 
        ADD CONSTRAINT check_reports_status_valid 
        CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed'));
    END IF;

    -- Severity enum (if exists in schema)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reports' AND column_name = 'severity'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'check_reports_severity_valid'
        ) THEN
            ALTER TABLE reports 
            ADD CONSTRAINT check_reports_severity_valid 
            CHECK (severity IN ('low', 'medium', 'high', 'critical'));
        END IF;
    END IF;
END $$;

-- Advisories table constraints
DO $$ 
BEGIN
    -- Title length (3-200 characters)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_advisories_title_length'
    ) THEN
        ALTER TABLE advisories 
        ADD CONSTRAINT check_advisories_title_length 
        CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 200);
    END IF;

    -- Content length (10-10000 characters)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_advisories_content_length'
    ) THEN
        ALTER TABLE advisories 
        ADD CONSTRAINT check_advisories_content_length 
        CHECK (LENGTH(content) >= 10 AND LENGTH(content) <= 10000);
    END IF;

    -- Status enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_advisories_status_valid'
    ) THEN
        ALTER TABLE advisories 
        ADD CONSTRAINT check_advisories_status_valid 
        CHECK (status IN ('Draft', 'Pending', 'Published', 'Archived'));
    END IF;

    -- Category enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_advisories_category_valid'
    ) THEN
        ALTER TABLE advisories 
        ADD CONSTRAINT check_advisories_category_valid 
        CHECK (LENGTH(category) >= 3 AND LENGTH(category) <= 50);
    END IF;
END $$;

-- Agriculture damage reports constraints (if table exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'agriculture_damage_reports'
    ) THEN
        -- Crop type not empty
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'check_agri_crop_type_not_empty'
        ) THEN
            ALTER TABLE agriculture_damage_reports 
            ADD CONSTRAINT check_agri_crop_type_not_empty 
            CHECK (LENGTH(crop_type) >= 2);
        END IF;

        -- Farmer name not empty
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'check_agri_farmer_name_not_empty'
        ) THEN
            ALTER TABLE agriculture_damage_reports 
            ADD CONSTRAINT check_agri_farmer_name_not_empty 
            CHECK (LENGTH(farmer_name) >= 2);
        END IF;

        -- Barangay not empty
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'check_agri_barangay_not_empty'
        ) THEN
            ALTER TABLE agriculture_damage_reports 
            ADD CONSTRAINT check_agri_barangay_not_empty 
            CHECK (LENGTH(barangay) >= 2);
        END IF;

        -- Area affected must be non-negative
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'check_agri_area_affected_positive'
        ) THEN
            ALTER TABLE agriculture_damage_reports 
            ADD CONSTRAINT check_agri_area_affected_positive 
            CHECK (area_affected_hectares >= 0);
        END IF;

        -- Damage percentage must be 0-100
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'check_agri_damage_percentage_range'
        ) THEN
            ALTER TABLE agriculture_damage_reports 
            ADD CONSTRAINT check_agri_damage_percentage_range 
            CHECK (damage_percentage >= 0 AND damage_percentage <= 100);
        END IF;

        -- Estimated loss value must be non-negative
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'check_agri_loss_value_positive'
        ) THEN
            ALTER TABLE agriculture_damage_reports 
            ADD CONSTRAINT check_agri_loss_value_positive 
            CHECK (estimated_loss_value >= 0);
        END IF;

        -- Status enum
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'check_agri_status_valid'
        ) THEN
            ALTER TABLE agriculture_damage_reports 
            ADD CONSTRAINT check_agri_status_valid 
            CHECK (status IN ('pending', 'assessed', 'assistance_provided'));
        END IF;

        -- Category enum
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'check_agri_category_valid'
        ) THEN
            ALTER TABLE agriculture_damage_reports 
            ADD CONSTRAINT check_agri_category_valid 
            CHECK (category IN ('farm', 'livestock'));
        END IF;
    END IF;
END $$;

-- =====================================================
-- PART 3: Create Validation Triggers (with existence checks)
-- =====================================================

-- Function: Validate guest reports have contact info
CREATE OR REPLACE FUNCTION validate_guest_report_fn()
RETURNS TRIGGER AS $$
BEGIN
    -- If user_id is NULL (guest report), require contact_number
    IF NEW.user_id IS NULL AND (NEW.contact_number IS NULL OR LENGTH(NEW.contact_number) < 10) THEN
        RAISE EXCEPTION 'Guest reports must include a valid contact number (at least 10 digits)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validate guest reports (drop and recreate to ensure latest version)
DROP TRIGGER IF EXISTS validate_guest_report ON reports;
CREATE TRIGGER validate_guest_report
BEFORE INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION validate_guest_report_fn();

-- Function: Validate hospital bed counts are non-negative
CREATE OR REPLACE FUNCTION validate_hospital_beds_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_beds < 0 OR NEW.available_beds < 0 OR NEW.occupied_beds < 0 THEN
        RAISE EXCEPTION 'Bed counts cannot be negative';
    END IF;
    IF NEW.available_beds + NEW.occupied_beds > NEW.total_beds THEN
        RAISE EXCEPTION 'Available + occupied beds cannot exceed total beds';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validate hospital beds (if table exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'hospital_daily_records'
    ) THEN
        DROP TRIGGER IF EXISTS validate_hospital_beds ON hospital_daily_records;
        CREATE TRIGGER validate_hospital_beds
        BEFORE INSERT OR UPDATE ON hospital_daily_records
        FOR EACH ROW
        EXECUTE FUNCTION validate_hospital_beds_fn();
    END IF;
END $$;

-- Function: Validate CDRRMO personnel counts are non-negative
CREATE OR REPLACE FUNCTION validate_cdrrmo_personnel_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.personnel_deployed < 0 THEN
        RAISE EXCEPTION 'Personnel deployed cannot be negative';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validate CDRRMO personnel (if table exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'cdrrmo_daily_operations'
    ) THEN
        DROP TRIGGER IF EXISTS validate_cdrrmo_personnel ON cdrrmo_daily_operations;
        CREATE TRIGGER validate_cdrrmo_personnel
        BEFORE INSERT OR UPDATE ON cdrrmo_daily_operations
        FOR EACH ROW
        EXECUTE FUNCTION validate_cdrrmo_personnel_fn();
    END IF;
END $$;

-- Function: Validate BFP personnel counts are non-negative
CREATE OR REPLACE FUNCTION validate_bfp_personnel_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.personnel_deployed < 0 THEN
        RAISE EXCEPTION 'Personnel deployed cannot be negative';
    END IF;
    IF NEW.vehicles_deployed < 0 THEN
        RAISE EXCEPTION 'Vehicles deployed cannot be negative';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validate BFP personnel (if table exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'bfp_operations'
    ) THEN
        DROP TRIGGER IF EXISTS validate_bfp_personnel ON bfp_operations;
        CREATE TRIGGER validate_bfp_personnel
        BEFORE INSERT OR UPDATE ON bfp_operations
        FOR EACH ROW
        EXECUTE FUNCTION validate_bfp_personnel_fn();
    END IF;
END $$;

-- =====================================================
-- PART 4: Verification Queries
-- =====================================================

-- Check all constraints created
SELECT 
    conname AS constraint_name, 
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace 
    AND contype = 'c'
    AND conrelid::regclass::text IN ('reports', 'advisories', 'agriculture_damage_reports', 'hospital_daily_records', 'cdrrmo_daily_operations', 'bfp_operations')
ORDER BY table_name, constraint_name;

-- Check all triggers created
SELECT 
    trigger_name, 
    event_object_table AS table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND event_object_table IN ('reports', 'hospital_daily_records', 'cdrrmo_daily_operations', 'bfp_operations')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '✅ Security input validation successfully applied (safe mode)';
    RAISE NOTICE '   - Existing constraints preserved (no duplicates)';
    RAISE NOTICE '   - New constraints added where missing';
    RAISE NOTICE '   - All triggers updated to latest version';
    RAISE NOTICE '   - Data fixes applied for invalid values';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Run the verification queries above to confirm all constraints and triggers are active.';
END $$;
