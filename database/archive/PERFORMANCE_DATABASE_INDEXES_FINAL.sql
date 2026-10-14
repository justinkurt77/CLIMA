-- ============================================================================
-- CLIMA PERFORMANCE DATABASE INDEXES (FINAL - Schema Verified)
-- ============================================================================
-- Run this in Supabase SQL Editor to create all performance indexes
-- Execution time: ~30-60 seconds depending on data volume
-- 
-- This version ONLY creates indexes on columns that definitely exist
-- ============================================================================

-- HOSPITAL DAILY RECORDS INDEXES
-- Optimizes date-based queries
CREATE INDEX IF NOT EXISTS idx_hospital_records_date_desc ON hospital_daily_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_hospital_records_hospital ON hospital_daily_records(hospital_name);

-- CDRRMO DAILY OPERATIONS INDEXES
-- Optimizes date-based queries (NO operation_type column exists!)
CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_date_desc ON cdrrmo_daily_operations(operation_date DESC);

-- BFP OPERATIONS INDEXES
-- Optimizes date-based queries and operation type filtering
CREATE INDEX IF NOT EXISTS idx_bfp_ops_date_desc ON bfp_operations(operation_date DESC);
CREATE INDEX IF NOT EXISTS idx_bfp_ops_type ON bfp_operations(operation_type);

-- AGRICULTURE DAMAGE REPORTS INDEXES
-- Most indexes already created by schema file, just add missing ones
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agri_damage_farmer') THEN
    CREATE INDEX idx_agri_damage_farmer ON agriculture_damage_reports(farmer_name);
  END IF;
END $$;

-- WATER INTERRUPTIONS INDEXES
CREATE INDEX IF NOT EXISTS idx_water_int_date_desc ON water_interruptions(interruption_date DESC);
CREATE INDEX IF NOT EXISTS idx_water_int_provider ON water_interruptions(provider);

-- POWER INTERRUPTIONS INDEXES
CREATE INDEX IF NOT EXISTS idx_power_int_date_desc ON power_interruptions(interruption_date DESC);
CREATE INDEX IF NOT EXISTS idx_power_int_provider ON power_interruptions(provider);

-- ADVISORIES INDEXES
CREATE INDEX IF NOT EXISTS idx_advisories_status ON advisories(status);
CREATE INDEX IF NOT EXISTS idx_advisories_published_desc ON advisories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_advisories_department ON advisories(department_id);

-- REPORTS (CITIZEN REPORTS) INDEXES
CREATE INDEX IF NOT EXISTS idx_reports_department ON reports(department_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_desc ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);

-- AUDIT LOGS INDEXES (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_desc ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
  END IF;
END $$;

-- NOTIFICATIONS INDEXES (if table exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_desc ON notifications(created_at DESC);
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERY - Run this after to confirm indexes were created
-- ============================================================================

SELECT
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'hospital_daily_records',
    'cdrrmo_daily_operations',
    'bfp_operations',
    'agriculture_damage_reports',
    'water_interruptions',
    'power_interruptions',
    'advisories',
    'reports',
    'audit_logs',
    'notifications'
  )
ORDER BY tablename, indexname;
