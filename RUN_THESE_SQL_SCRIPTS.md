# ✅ FINAL SQL Scripts - Ready to Run

## These are the CORRECT files to run:

### 1. Performance Indexes
**File:** `PERFORMANCE_DATABASE_INDEXES_FINAL.sql`

**What it does:**
- Creates ~20 indexes on tables that actually exist
- Only indexes columns that are verified to exist
- Skips CDRRMO operation_type index (column doesn't exist)
- Includes BFP operation_type index (column exists)

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `PERFORMANCE_DATABASE_INDEXES_FINAL.sql`
3. Paste and click "Run"
4. Should complete in ~10-20 seconds with SUCCESS

**Expected result:**
```
✅ Success - Indexes created
```

---

### 2. Security Validation with Data Cleanup
**File:** `SECURITY_INPUT_VALIDATION_FINAL.sql`

**What it does:**
- **STEP 1:** Fixes existing invalid data FIRST
  - Fixes advisory titles that are too short/long
  - Fixes report descriptions that are too short/long  
  - Fixes invalid coordinates
  - Fixes empty locations
- **STEP 2:** Adds constraints AFTER data is clean
- **STEP 3:** Creates validation triggers

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `SECURITY_INPUT_VALIDATION_FINAL.sql`
3. Paste and click "Run"
4. Should complete in ~20-30 seconds with SUCCESS

**Expected result:**
```
✅ Success - Data cleaned, constraints and triggers created
```

---

## ❌ DO NOT USE These Files (They Have Errors)

- ❌ `PERFORMANCE_DATABASE_INDEXES.sql` - Wrong column names
- ❌ `SECURITY_INPUT_VALIDATION.sql` - Wrong column names
- ❌ `PERFORMANCE_DATABASE_INDEXES_CORRECTED.sql` - Still has operation_type error
- ❌ `SECURITY_INPUT_VALIDATION_CORRECTED.sql` - Doesn't fix existing data first

**Use ONLY the FINAL versions!**

---

## Verification After Running

After running both scripts, verify they worked:

```sql
-- Check indexes were created
SELECT tablename, indexname 
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('reports', 'advisories', 'bfp_operations', 'cdrrmo_daily_operations')
ORDER BY tablename;

-- Check constraints were created
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'c' 
  AND conrelid::regclass::text IN ('reports', 'advisories', 'agriculture_damage_reports')
ORDER BY table_name;

-- Check triggers were created
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

---

## Summary

**Just run these 2 files in order:**

1. ✅ `PERFORMANCE_DATABASE_INDEXES_FINAL.sql`
2. ✅ `SECURITY_INPUT_VALIDATION_FINAL.sql`

Both should complete successfully without errors!
