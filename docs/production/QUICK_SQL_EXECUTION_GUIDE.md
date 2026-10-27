# Quick SQL Execution Guide

## ✅ FIXED - Ready to Run

The SQL scripts have been corrected to match your actual database schema.

## Execute in Supabase Dashboard

**Navigate to:** Supabase Dashboard → SQL Editor

### Step 1: Run Security Validations (~3 minutes)

Copy and paste the entire contents of:
```
database/migrations/SECURITY_INPUT_VALIDATION_SAFE.sql
```

**Expected Result:**
```
✅ Security input validation successfully applied (safe mode)
   - Existing constraints preserved (no duplicates)
   - New constraints added where missing
   - All triggers updated to latest version
   - Data fixes applied for invalid values
```

**What it does:**
- Adds length constraints on reports descriptions (10-5000 chars)
- Adds lat/lng range validation (-90 to 90, -180 to 180)
- Validates status values (pending, in_progress, resolved, closed)
- Adds advisory title/content length constraints
- Validates hospital bed counts (non-negative, logical)
- Validates CDRRMO/BFP personnel counts (non-negative)

---

### Step 2: Run Performance Indexes (~2 minutes)

Copy and paste the entire contents of:
```
database/migrations/PERFORMANCE_INDEXES_WORKING.sql
```

**Expected Result:**
```
CREATE INDEX (repeated for each index)
```

**What it does:**
- Indexes hospital_daily_records by date (DESC for latest first)
- Indexes cdrrmo_daily_operations by date
- Indexes bfp_operations by date and type
- Indexes advisories by status, published_at, department_id
- Indexes reports by department, status, category, created_at, user_id

**Performance Impact:**
- Faster dashboard loading (date-based queries)
- Faster report filtering (status/category/department)
- Faster advisory retrieval (published advisories)

---

### Step 3: Verify Everything (~1 minute)

Run this verification query:
```sql
-- Check all indexes are created
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
```

**Expected:** You should see 15+ indexes listed across the 5 tables.

---

### Step 4: Verify Constraints

Run this verification query:
```sql
-- Check all constraints
SELECT 
    conname AS constraint_name, 
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace 
    AND contype = 'c'
    AND conrelid::regclass::text IN ('reports', 'advisories', 'hospital_daily_records', 'cdrrmo_daily_operations', 'bfp_operations')
ORDER BY table_name, constraint_name;
```

**Expected:** You should see 10+ check constraints listed.

---

## Troubleshooting

### If you see "constraint already exists"
✅ **This is fine!** The scripts are idempotent (safe to run multiple times). The script checks for existence before creating.

### If you see "column does not exist"
❌ **Contact support.** Your schema might differ from expected. Check which column is missing.

### If indexes take too long (>5 minutes)
- Check if you have a lot of existing data
- Indexes are created in the background
- They will complete eventually

---

## Total Time: ~6 minutes

After completion, your database will have:
- ✅ Input validation on all user-submitted data
- ✅ Performance indexes on all frequently queried tables
- ✅ Data integrity constraints preventing invalid data
- ✅ Optimized queries for dashboards and reports

---

## Next Steps After SQL Execution

1. ✅ Test the application - ensure everything still works
2. ✅ Monitor performance - dashboards should load faster
3. ✅ Check error logs - validation constraints may catch invalid submissions
4. ✅ Ready for production deployment!

---

**Last Updated:** January 14, 2025  
**Status:** Production Ready ✅
