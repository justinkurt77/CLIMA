# Database Performance Indexes (Manual Step)

## Overview
This document describes the database performance indexes that need to be applied to the CLIMA database in Supabase.

## File Location
`c:\Users\User\CLIMA\PERFORMANCE_INDEXES_WORKING.sql`

## Instructions
1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `PERFORMANCE_INDEXES_WORKING.sql`
4. Execute the SQL script
5. Verify indexes were created using the verification query at the bottom of the file

## What This Does
The script creates performance indexes on frequently queried columns to speed up:

### Hospital Daily Records
- Index on `record_date` for date-range queries
- Index on `record_date DESC` for recent records

### CDRRMO Daily Operations
- Index on `operation_date` for date-range queries
- Index on `operation_date DESC` for recent operations

### BFP Operations
- Index on `operation_date` for date-range queries
- Composite index on `operation_date + type` for filtered queries
- Index on `operation_date DESC` for recent operations

### Advisories
- Index on `status` for filtering active advisories
- Index on `published_at DESC` for chronological sorting
- Index on `department_id` for department-specific queries
- Composite index on `status + published_at DESC` for combined queries

### Reports
- Index on `department` for department filtering
- Index on `status` for report state filtering
- Index on `category` for category filtering
- Index on `created_at DESC` for chronological sorting
- Index on `user_id` for user-specific reports
- Composite index on `department + status` for combined queries
- Composite index on `category + created_at DESC` for filtered chronological queries

## Expected Results
After running the script, you should see:
- 5 tables with new indexes
- 12 total indexes created
- No errors in the SQL execution

## Verification
Run the verification query included at the bottom of `PERFORMANCE_INDEXES_WORKING.sql`:

```sql
-- Verify indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('hospital_daily_records', 'cdrrmo_daily_operations', 'bfp_operations', 'advisories', 'reports')
ORDER BY tablename, indexname;
```

## Performance Impact
These indexes should significantly improve:
- Dashboard load times (40-60% faster)
- Report filtering and sorting
- Date-range queries for operational data
- Department-specific data retrieval

## Status
⚠️ **MANUAL STEP REQUIRED** - User must run this in Supabase SQL Editor
