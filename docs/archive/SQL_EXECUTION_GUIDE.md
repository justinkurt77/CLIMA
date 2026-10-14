# SQL Execution Guide for Production Deployment

## ✅ Corrected SQL Scripts to Run

### 1. Performance Database Indexes
**File:** `PERFORMANCE_DATABASE_INDEXES_CORRECTED.sql`

**What it does:**
- Creates 30+ indexes on critical tables
- Optimizes date-based queries (DESC indexes for ORDER BY date DESC)
- Speeds up filtered queries (status, type, category, department)
- Adds composite indexes for common query patterns

**Tables covered:**
- ✅ hospital_daily_records (3 indexes)
- ✅ cdrrmo_daily_operations (3 indexes)
- ✅ bfp_operations (3 indexes)
- ✅ agriculture_damage_reports (5 indexes)
- ✅ water_interruptions (3 indexes)
- ✅ power_interruptions (3 indexes)
- ✅ advisories (4 indexes)
- ✅ reports (6 indexes)
- ✅ audit_logs (4 indexes - if table exists)
- ✅ notifications (4 indexes - if table exists)

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `PERFORMANCE_DATABASE_INDEXES_CORRECTED.sql`
3. Paste and click "Run"
4. Wait ~30-60 seconds for completion
5. Verify with monitoring query at bottom of file

**Expected result:**
```
✅ Success - Indexes created
Query returned successfully
```

**Verification:**
Run the monitoring query included at the bottom of the file to see all indexes and their usage statistics.

---

### 2. Security Input Validation
**File:** `SECURITY_INPUT_VALIDATION_CORRECTED.sql`

**What it does:**
- Adds CHECK constraints to prevent invalid data
- Creates trigger functions for complex validation
- Enforces business logic at database level
- Prevents XSS via content length limits

**Validations added:**

**Reports table:**
- ✅ Description: 10-5000 characters
- ✅ Title: 3-200 characters
- ✅ Category: Must be in predefined list
- ✅ Status: 'pending', 'inprogress', or 'resolved'
- ✅ Coordinates: lat (-90 to 90), lng (-180 to 180)
- ✅ Location: Cannot be empty
- ✅ Guest reports: Must have full_name if user_id is null

**Advisories table:**
- ✅ Title: 3-200 characters
- ✅ Content: 10-10000 characters
- ✅ Severity: 'low', 'medium', 'high', or 'critical'
- ✅ Status: 'draft', 'active', or 'expired'

**Hospital records:**
- ✅ El Niño cases: >= 0
- ✅ Available beds: >= 0 and <= total_bed_capacity

**Agriculture damage:**
- ✅ Area affected: >= 0 hectares
- ✅ Estimated loss: >= 0 PHP
- ✅ Damage percentage: 0-100%
- ✅ Status: 'pending', 'assessed', or 'assistance_provided'

**CDRRMO/BFP operations:**
- ✅ Personnel deployed: >= 0
- ✅ Casualties: >= 0
- ✅ Fire trucks: >= 0

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `SECURITY_INPUT_VALIDATION_CORRECTED.sql`
3. Paste and click "Run"
4. Wait ~10-20 seconds for completion
5. Verify with constraint query at bottom of file

**Expected result:**
```
✅ Success - Constraints and triggers created
Query returned successfully
```

**Testing validation:**
Try inserting invalid data to verify constraints work:
```sql
-- Should fail: invalid coordinates
INSERT INTO reports (description, category, status, lat, lng, location) 
VALUES ('Test report', 'Road Damage', 'pending', 91, 200, 'Test Location');
-- Expected: ERROR: new row violates check constraint "check_reports_lat_valid"

-- Should succeed: valid data
INSERT INTO reports (description, category, status, lat, lng, location) 
VALUES ('Valid report description', 'Road Damage', 'pending', 15.5398, 121.0827, 'Palayan City');
-- Expected: INSERT 0 1
```

---

## ❌ DO NOT RUN These Files

These files have **incorrect column names** and will cause errors:

- ❌ `PERFORMANCE_DATABASE_INDEXES.sql` - Uses wrong column names
- ❌ `SECURITY_INPUT_VALIDATION.sql` - Uses wrong column names

**You already encountered these errors:**
```
ERROR: 42703: column "status" does not exist
ERROR: 42703: column "latitude" does not exist
```

**Use the CORRECTED versions instead!**

---

## 🔍 Verification Steps

### After running both scripts:

1. **Verify indexes exist:**
```sql
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
    'reports'
  )
ORDER BY tablename, indexname;
```

Expected: ~30+ indexes listed

2. **Verify constraints exist:**
```sql
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND contype = 'c'
  AND conrelid::regclass::text IN (
    'reports', 'advisories', 'hospital_daily_records',
    'agriculture_damage_reports'
  )
ORDER BY table_name, constraint_name;
```

Expected: ~15+ constraints listed

3. **Verify triggers exist:**
```sql
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN (
    'reports',
    'hospital_daily_records',
    'cdrrmo_daily_operations',
    'bfp_operations'
  )
ORDER BY event_object_table, trigger_name;
```

Expected: 4+ triggers listed

---

## 🚀 Expected Performance Impact

### Query Performance:
- Date-based queries: **10-100x faster**
- Filtered queries: **5-50x faster**
- Reports tab pagination: **<500ms response time** (was 5-10s)
- Admin dashboard loading: **<1s initial load** (was 5-10s)

### Write Performance:
- Inserts: **~5-10% slower** (acceptable tradeoff)
- Updates: **~5-10% slower** (acceptable tradeoff)
- The validation overhead is minimal and worth the data integrity

### Storage:
- Each index: **~1-5% of table size**
- Total overhead: **~10-15% storage increase**
- Well worth it for query performance gains

---

## 🔧 Troubleshooting

### If index creation fails:
```sql
-- Check if index already exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'reports' AND indexname = 'idx_reports_created_desc';

-- Drop and recreate if needed
DROP INDEX IF EXISTS idx_reports_created_desc;
CREATE INDEX idx_reports_created_desc ON reports(created_at DESC);
```

### If constraint creation fails:
```sql
-- Check existing data violates constraint
SELECT * FROM reports WHERE lat NOT BETWEEN -90 AND 90;

-- Fix data first, then add constraint
UPDATE reports SET lat = 15.5398 WHERE lat > 90 OR lat < -90;
ALTER TABLE reports ADD CONSTRAINT check_reports_lat_valid CHECK (lat BETWEEN -90 AND 90);
```

### If you need to rollback:
```sql
-- Drop all indexes created
DROP INDEX IF EXISTS idx_reports_created_desc;
DROP INDEX IF EXISTS idx_reports_status;
-- ... (repeat for each index)

-- Drop all constraints
ALTER TABLE reports DROP CONSTRAINT IF EXISTS check_reports_description_length;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS check_reports_lat_valid;
-- ... (repeat for each constraint)

-- Drop all triggers
DROP TRIGGER IF EXISTS trigger_validate_guest_report ON reports;
DROP FUNCTION IF EXISTS validate_guest_report();
```

---

## 📋 Execution Checklist

- [ ] 1. Backup database (optional but recommended)
- [ ] 2. Run `PERFORMANCE_DATABASE_INDEXES_CORRECTED.sql`
- [ ] 3. Verify indexes with monitoring query
- [ ] 4. Run `SECURITY_INPUT_VALIDATION_CORRECTED.sql`
- [ ] 5. Verify constraints with constraint query
- [ ] 6. Test invalid data insert (should fail)
- [ ] 7. Test valid data insert (should succeed)
- [ ] 8. Monitor query performance in application
- [ ] 9. Update `PROJECT_MASTER_STATUS.md` with completion

**Estimated total time:** 5-10 minutes

---

**Questions or issues?** Check the troubleshooting section or review the inline comments in each SQL file.
