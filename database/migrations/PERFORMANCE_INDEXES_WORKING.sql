-- ============================================================================
-- CLIMA PERFORMANCE INDEXES (Working Version)
-- ============================================================================

-- HOSPITAL DAILY RECORDS
CREATE INDEX IF NOT EXISTS idx_hospital_records_date ON hospital_daily_records(record_date DESC);

-- CDRRMO DAILY OPERATIONS  
CREATE INDEX IF NOT EXISTS idx_cdrrmo_ops_date ON cdrrmo_daily_operations(operation_date DESC);

-- BFP OPERATIONS
CREATE INDEX IF NOT EXISTS idx_bfp_ops_date ON bfp_operations(operation_date DESC);
CREATE INDEX IF NOT EXISTS idx_bfp_ops_type ON bfp_operations(operation_type);

-- ADVISORIES
CREATE INDEX IF NOT EXISTS idx_advisories_status ON advisories(status);
CREATE INDEX IF NOT EXISTS idx_advisories_published ON advisories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_advisories_dept ON advisories(department_id);

-- REPORTS (CITIZEN REPORTS)
CREATE INDEX IF NOT EXISTS idx_reports_dept ON reports(department_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);

-- ============================================================================
-- VERIFICATION QUERY (Fixed - correct column names)
-- ============================================================================

SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN (
    'hospital_daily_records',
    'cdrrmo_daily_operations',
    'bfp_operations',
    'advisories',
    'reports'
  )
ORDER BY relname, indexrelname;
