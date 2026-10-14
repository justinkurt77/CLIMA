# How to Run SQL Scripts in Supabase

## Quick Start (If You Hit Errors)

If you got an error like `constraint already exists`, use these **SAFE** versions:

1. **Security Validation:** Use `SECURITY_INPUT_VALIDATION_SAFE.sql` ✅
2. **Performance Indexes:** Use `PERFORMANCE_INDEXES_WORKING.sql` ✅ (already safe)

Both scripts are **idempotent** (safe to run multiple times).

---

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `palayan-clima` (or your project name)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

### 2. Run Security Validation (SAFE Version)

**File:** `SECURITY_INPUT_VALIDATION_SAFE.sql`

**Steps:**
1. Open the file in your code editor (VS Code)
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click **Run** (or press Ctrl+Enter)

**Expected Output:**
```
✅ Security input validation successfully applied (safe mode)
   - Existing constraints preserved (no duplicates)
   - New constraints added where missing
   - All triggers updated to latest version
   - Data fixes applied for invalid values
```

**What It Does:**
- Checks if constraints already exist before creating
- Fixes existing invalid data (NULL values, out-of-range coordinates)
- Adds 19 check constraints (description length, lat/lng ranges, status enums)
- Creates/updates 4 validation triggers (guest reports, hospital beds, personnel counts)

**Verification:**
Scroll down to the verification queries at the end of the output. You should see:
- **19+ constraints** listed (check_reports_description_length, check_reports_lat_range, etc.)
- **4 triggers** listed (validate_guest_report, validate_hospital_beds, validate_cdrrmo_personnel, validate_bfp_personnel)

### 3. Run Performance Indexes

**File:** `PERFORMANCE_INDEXES_WORKING.sql`

**Steps:**
1. Open the file in your code editor
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into a **NEW** Supabase SQL query (don't reuse the previous one)
5. Click **Run**

**Expected Output:**
```
CREATE INDEX (repeated 12 times)
```

**What It Does:**
- Creates 12 indexes on frequently queried columns
- Uses `CREATE INDEX IF NOT EXISTS` (safe to run multiple times)
- Indexes cover: hospital_daily_records, cdrrmo_daily_operations, bfp_operations, advisories, reports

**Verification:**
The verification query at the end shows all indexes created with their sizes:

| Schema | Table | Index | Size |
|--------|-------|-------|------|
| public | advisories | idx_advisories_dept | 16 KB |
| public | advisories | idx_advisories_published | 16 KB |
| public | advisories | idx_advisories_status | 16 KB |
| public | reports | idx_reports_category | 32 KB |
| public | reports | idx_reports_created | 32 KB |
| ... | ... | ... | ... |

*Sizes will vary based on how much data you have*

### 4. Verify Row Level Security (RLS)

**Query:**
```sql
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected Output:**
All tables should show `rowsecurity = true` (t):

| tablename | rowsecurity |
|-----------|-------------|
| advisories | t |
| bfp_operations | t |
| cdrrmo_daily_operations | t |
| hospital_daily_records | t |
| profiles | t |
| reports | t |

**If Any Show `f` (false):**
```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
```

Example:
```sql
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;
```

---

## Troubleshooting

### Error: "constraint already exists"

**Solution:** You're using the original `SECURITY_INPUT_VALIDATION_FINAL.sql`. Switch to `SECURITY_INPUT_VALIDATION_SAFE.sql` instead.

The SAFE version checks if constraints exist before creating them, so it won't error on duplicates.

### Error: "column does not exist"

**Cause:** The SQL script references a column that doesn't exist in your schema.

**Solution:**
1. Read the error message to see which column is missing
2. Check your actual schema in Supabase → Table Editor
3. If the column truly doesn't exist, comment out that line in the SQL:
   ```sql
   -- CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
   ```
4. Re-run the script

### Error: "permission denied"

**Cause:** You're not logged in as the database owner.

**Solution:**
1. Make sure you're logged into the correct Supabase project
2. Use the **SQL Editor** (not the psql command line)
3. If still failing, check with your Supabase project admin

### Error: "syntax error at or near"

**Cause:** Part of the SQL wasn't copied correctly, or there's a mismatch in quotes.

**Solution:**
1. Make sure you copied the **entire** SQL file (select all, not partial)
2. Re-copy and re-paste
3. Check for any smart quotes (" instead of ") if you edited the file

### No Output / Silent Success

**This is normal!** Many SQL commands succeed silently. To verify:

1. Run the verification queries at the end of each SQL file
2. Check Supabase → Table Editor → Click a table → Constraints tab
3. Check Supabase → Database → Indexes (if available in UI)

---

## After Running Scripts

### Test the Constraints

Try inserting invalid data to confirm constraints work:

```sql
-- Test 1: Description too short (should FAIL)
INSERT INTO reports (description, lat, lng) 
VALUES ('short', 15.5, 121.0);
-- Expected: ERROR - violates check constraint "check_reports_description_length"

-- Test 2: Invalid coordinates (should FAIL)
INSERT INTO reports (description, lat, lng) 
VALUES ('Valid description here with at least 10 characters', 999, 999);
-- Expected: ERROR - violates check constraint "check_reports_lat_range"

-- Test 3: Valid data (should SUCCEED)
INSERT INTO reports (description, lat, lng, status, category) 
VALUES ('This is a valid report description with sufficient length', 15.5399, 121.0983, 'pending', 'Flood');
-- Expected: SUCCESS (1 row inserted)
```

If tests 1 and 2 fail with constraint errors, and test 3 succeeds → **Constraints are working!** ✅

### Test the Indexes

Check query performance:

```sql
-- Explain plan should show "Index Scan" (good), not "Seq Scan" (bad)
EXPLAIN ANALYZE
SELECT * FROM reports
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 50;
```

**Look for:**
- `Index Scan using idx_reports_status` → ✅ Index is being used
- `Seq Scan on reports` → ⚠️ Index not being used (might need to rebuild statistics)

**If indexes not being used:**
```sql
-- Rebuild table statistics
ANALYZE reports;
ANALYZE advisories;
ANALYZE bfp_operations;
ANALYZE cdrrmo_daily_operations;
ANALYZE hospital_daily_records;
```

---

## Summary Checklist

- [ ] Ran `SECURITY_INPUT_VALIDATION_SAFE.sql` (no errors)
- [ ] Verification: 19+ constraints listed
- [ ] Verification: 4 triggers listed
- [ ] Ran `PERFORMANCE_INDEXES_WORKING.sql` (no errors)
- [ ] Verification: 12 indexes listed with sizes
- [ ] Ran RLS verification query
- [ ] All tables show `rowsecurity = true`
- [ ] Tested constraints with invalid data (failed as expected)
- [ ] Tested valid data (succeeded)
- [ ] Checked query plans (indexes being used)

---

## Expected Duration

- **Security Validation:** 2-3 minutes (includes data fixes)
- **Performance Indexes:** 1-2 minutes (depends on data volume)
- **RLS Verification:** 10 seconds
- **Testing:** 5 minutes

**Total: ~10 minutes**

---

## Success!

When all scripts complete successfully, you should see:

✅ **19 security constraints** protecting data quality  
✅ **4 validation triggers** enforcing business rules  
✅ **12 performance indexes** speeding up queries  
✅ **RLS enabled** on all tables for row-level security  

Your database is now **production-ready** for CLIMA launch! 🎉

---

## Need Help?

**Palayan City ICT Office**  
Email: ict@palayan.gov.ph  
Phone: (044) XXX-XXXX

**Supabase Support**  
Dashboard: https://supabase.com/dashboard  
Docs: https://supabase.com/docs/guides/database  
Community: https://github.com/supabase/supabase/discussions
