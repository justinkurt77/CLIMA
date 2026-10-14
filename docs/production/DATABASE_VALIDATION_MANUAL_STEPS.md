# Database Input Validation - Manual Setup Instructions

## Overview
This document describes the manual SQL steps required to add comprehensive input validation constraints and triggers to the CLIMA database.

## Prerequisites
- Access to Supabase SQL Editor
- Database: `palayan-clima` (or your production database)
- Admin/owner permissions to create constraints and triggers

## Step 1: Run Security Validation SQL

**File:** `SECURITY_INPUT_VALIDATION_FINAL.sql`

**What it does:**
1. Fixes existing invalid data (sets defaults for NULL/invalid values)
2. Adds 19 check constraints across 4 tables:
   - `reports`: description length (10-5000 chars), lat/lng ranges, status enum
   - `advisories`: title length (3-200 chars), content length (10-10000 chars)
   - `agriculture_damage_reports`: similar constraints
3. Creates 4 validation triggers:
   - `validate_guest_report`: ensures guest reports have valid contact info
   - `validate_hospital_beds`: ensures bed counts are non-negative
   - `validate_cdrrmo_personnel`: ensures personnel counts are non-negative
   - `validate_bfp_personnel`: ensures BFP personnel counts are non-negative

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `SECURITY_INPUT_VALIDATION_FINAL.sql`
3. Paste into editor
4. Click "Run" (or Ctrl+Enter)
5. Verify success message (should see "UPDATE N" for data fixes, "ALTER TABLE" for constraints, "CREATE TRIGGER" for triggers)

## Step 2: Verify Constraints Created

Run this verification query in Supabase SQL Editor:

```sql
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
```

**Expected result:** Should see 19+ constraints including:
- `reports_description_length`
- `reports_lat_range`
- `reports_lng_range`
- `reports_status_valid`
- `advisories_title_length`
- `advisories_content_length`
- etc.

## Step 3: Verify Triggers Created

Run this verification query:

```sql
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
```

**Expected result:** Should see 4 triggers:
- `validate_guest_report` (reports table, BEFORE INSERT)
- `validate_hospital_beds` (hospital_daily_records, BEFORE INSERT OR UPDATE)
- `validate_cdrrmo_personnel` (cdrrmo_daily_operations, BEFORE INSERT OR UPDATE)
- `validate_bfp_personnel` (bfp_operations, BEFORE INSERT OR UPDATE)

## Step 4: Test Constraint Enforcement

Try inserting invalid data to verify constraints are working:

```sql
-- Test 1: Invalid description (too short)
INSERT INTO reports (description, lat, lng) VALUES ('short', 15.5, 121.0);
-- Expected: ERROR - violates check constraint "reports_description_length"

-- Test 2: Invalid coordinates (out of range)
INSERT INTO reports (description, lat, lng) VALUES ('Valid description text here', 999, 999);
-- Expected: ERROR - violates check constraint "reports_lat_range" or "reports_lng_range"

-- Test 3: Invalid status
INSERT INTO reports (description, lat, lng, status) VALUES ('Valid description text', 15.5, 121.0, 'invalid_status');
-- Expected: ERROR - violates check constraint "reports_status_valid"

-- Test 4: Invalid advisory title (too long)
INSERT INTO advisories (title, content) VALUES (REPEAT('x', 201), 'Valid content here');
-- Expected: ERROR - violates check constraint "advisories_title_length"
```

If all tests fail with constraint errors, validation is working correctly! ✅

## Step 5: Run Performance Indexes

**File:** `PERFORMANCE_INDEXES_WORKING.sql`

**What it does:**
Creates 20+ database indexes on:
- Foreign keys (user_id, department_id, category_id)
- Timestamp columns (created_at, updated_at, date)
- Status/filter columns (status, severity, role)
- Location columns (lat, lng for geographic queries)

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `PERFORMANCE_INDEXES_WORKING.sql`
3. Paste into editor
4. Click "Run"
5. Verify success (should see "CREATE INDEX" messages)

## Step 6: Verify Indexes Created

Run the verification query included at the bottom of `PERFORMANCE_INDEXES_WORKING.sql`:

```sql
-- Verify all indexes created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'reports', 'advisories', 'profiles', 
    'hospital_daily_records', 'cdrrmo_daily_operations', 
    'bfp_operations', 'water_interruptions', 'power_interruptions'
  )
ORDER BY tablename, indexname;
```

**Expected result:** Should see 20+ indexes including:
- `idx_reports_created_at`
- `idx_reports_status`
- `idx_reports_user_id`
- `idx_advisories_created_at`
- `idx_profiles_role`
- etc.

## Step 7: Verify RLS (Row Level Security) Enabled

Check that RLS is enabled on all public tables:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected result:** All tables should have `rowsecurity = true`

If any table has `rowsecurity = false`, enable it:

```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
```

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
- The constraint or index already exists
- Safe to ignore, or use `DROP INDEX IF EXISTS` first

### Error: "column does not exist"
- SQL script may be outdated
- Verify column names match your schema exactly
- Check for typos in column references

### Error: "permission denied"
- You need database owner/admin permissions
- Contact your Supabase project admin

### Error: "constraint already exists"
- The constraint was previously created
- Safe to ignore, or drop and recreate:
  ```sql
  ALTER TABLE <table_name> DROP CONSTRAINT IF EXISTS <constraint_name>;
  ```

## Success Criteria

✅ All 19 check constraints created  
✅ All 4 validation triggers created  
✅ All 20+ performance indexes created  
✅ RLS enabled on all tables  
✅ Test inserts fail with appropriate constraint errors  

## Rollback (if needed)

If you need to remove these changes:

```sql
-- Drop all custom constraints
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname, conrelid::regclass AS tablename
    FROM pg_constraint
    WHERE connamespace = 'public'::regnamespace 
      AND contype = 'c'
      AND conname LIKE 'reports_%' OR conname LIKE 'advisories_%'
  )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.tablename, r.conname);
  END LOOP;
END $$;

-- Drop all custom triggers
DROP TRIGGER IF EXISTS validate_guest_report ON reports;
DROP TRIGGER IF EXISTS validate_hospital_beds ON hospital_daily_records;
DROP TRIGGER IF EXISTS validate_cdrrmo_personnel ON cdrrmo_daily_operations;
DROP TRIGGER IF EXISTS validate_bfp_personnel ON bfp_operations;

-- Drop custom functions
DROP FUNCTION IF EXISTS validate_guest_report_fn();
DROP FUNCTION IF EXISTS validate_hospital_beds_fn();
DROP FUNCTION IF EXISTS validate_cdrrmo_personnel_fn();
DROP FUNCTION IF EXISTS validate_bfp_personnel_fn();
```

## Contact

For issues or questions:
- Palayan City ICT Office
- CLIMA System Administrator
