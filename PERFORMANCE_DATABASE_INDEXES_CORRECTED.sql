-- ============================================================================
-- CLIMA PERFORMANCE DATABASE INDEXES (CORRECTED)
-- ============================================================================
-- Run this in Supabase SQL Editor to create all performance indexes
-- Execution time: ~30-60 seconds depending on data volume
-- IMPORTANT: Run during low-traffic period if possible
-- These indexes will significantly improve query performance for date-based and filtered queries
-- 
-- Author: CLIMA Development Team
-- Date: January 2025
-- Purpose: Optimize database query performance for production deployment
-- ============================================================================

-- HOSPITAL DAILY RECORDS INDEXES
-- Optimizes date-based queries and hospital-specific filtering
CREATE INDEX IF NOT EXISTS idx_hospital_records_date_desc ON hospital_daily_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_hospital_records_hospital ON hospital_daily_records(hospital_name);
CREATE INDEX IF NOT EXISTS idx_hospital_records_date_hospital ON hospital_daily_records(record_date DESC, hospital_name);

-- CDRRMO DAILY OPERATIONS INDEXES
-- Optimizes date-based queries and operation type filtering
CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_date_desc ON cdrrmo_daily_operations(operation_date DESC);
CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_type ON cdrrmo_daily_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_date_type ON cdrrmo_daily_operations(operation_date DESC, operation_type);

-- BFP OPERATIONS INDEXES
-- Optimizes date-based queries and operation type filtering
CREATE INDEX IF NOT EXISTS idx_bfp_ops_date_desc ON bfp_operations(operation_date DESC);
CREATE INDEX IF NOT EXISTS idx_bfp_ops_type ON bfp_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_bfp_ops_date_type ON bfp_operations(operation_date DESC, operation_type);

-- AGRICULTURE DAMAGE REPORTS INDEXES
-- Optimizes date-based queries, barangay filtering, crop type filtering, and status checks
CREATE INDEX IF NOT EXISTS idx_agri_damage_date_desc ON agriculture_damage_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_agri_damage_barangay ON agriculture_damage_reports(barangay);
CREATE INDEX IF NOT EXISTS idx_agri_damage_crop ON agriculture_damage_reports(crop_type);
CREATE INDEX IF NOT EXISTS idx_agri_damage_status ON agriculture_damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_agri_damage_category ON agriculture_damage_reports(category);

-- WATER INTERRUPTIONS INDEXES
-- Optimizes date-based queries and text searches
CREATE INDEX IF NOT EXISTS idx_water_int_date_desc ON water_interruptions(interruption_date DESC);
CREATE INDEX IF NOT EXISTS idx_water_int_provider ON water_interruptions(provider);
CREATE INDEX IF NOT EXISTS idx_water_int_date_provider ON water_interruptions(interruption_date DESC, provider);

-- POWER INTERRUPTIONS INDEXES
-- Optimizes date-based queries and text searches
CREATE INDEX IF NOT EXISTS idx_power_int_date_desc ON power_interruptions(interruption_date DESC);
CREATE INDEX IF NOT EXISTS idx_power_int_provider ON power_interruptions(provider);
CREATE INDEX IF NOT EXISTS idx_power_int_date_provider ON power_interruptions(interruption_date DESC, provider);

-- ADVISORIES INDEXES
-- Optimizes status filtering, published date queries, and department filtering
CREATE INDEX IF NOT EXISTS idx_advisories_status ON advisories(status);
CREATE INDEX IF NOT EXISTS idx_advisories_published_desc ON advisories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_advisories_status_published ON advisories(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_advisories_department ON advisories(department_id);

-- REPORTS (CITIZEN REPORTS) INDEXES
-- Optimizes department filtering, status filtering, category filtering, user filtering, and date queries
CREATE INDEX IF NOT EXISTS idx_reports_department ON reports(department_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_desc ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_dept_status_date ON reports(department_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);

-- AUDIT LOGS INDEXES (if table exists)
-- Optimizes user-based queries and date-based filtering
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_desc ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_date ON audit_logs(actor_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
  END IF;
END $$;

-- NOTIFICATIONS INDEXES (if table exists)
-- Optimizes user-based queries, read status filtering, and date sorting
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_desc ON notifications(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read_date ON notifications(user_id, is_read, created_at DESC);
  END IF;
END $$;

-- ============================================================================
-- INDEX RATIONALE
-- ============================================================================
--
-- DESC indexes on date columns:
--   - Most queries sort by recent-first (ORDER BY date DESC)
--   - DESC indexes are optimized for this pattern
--
-- Single-column indexes on frequently filtered columns:
--   - status, provider, operation_type, category
--   - Allow fast filtering without full table scans
--
-- Composite indexes:
--   - Combine date DESC + frequently filtered columns for common query patterns
--   - PostgreSQL can use composite indexes for prefix matches
--
-- ============================================================================
-- PERFORMANCE IMPACT
-- ============================================================================
--
-- QUERY PERFORMANCE: Expect 10-100x speedup on filtered queries
-- WRITE PERFORMANCE: Minimal impact (~5-10% slower inserts/updates)
-- STORAGE: Each index adds ~1-5% to table size
--
-- ============================================================================
-- MONITORING INDEX USAGE
-- ============================================================================
-- Run this query to verify indexes are being used:

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as rows_read,
  idx_tup_fetch as rows_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
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

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
--
-- If an index isn't being used (times_used = 0):
--   1. Check if the query pattern matches the index
--   2. Run ANALYZE on the table to update statistics
--   3. Use EXPLAIN ANALYZE to verify query plan
--
-- To drop an unused index:
--   DROP INDEX IF EXISTS index_name;
--
-- To rebuild a corrupted index:
--   REINDEX INDEX index_name;
--
-- To analyze query performance:
--   EXPLAIN ANALYZE SELECT ... FROM table WHERE ...;
--
-- ============================================================================
