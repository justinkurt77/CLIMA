# Hospital Module - Quick Setup Guide

## 🚀 Quick Start (Choose One)

### Option 1: Simple Setup (Recommended for Testing)
**Use this if**: You want to test immediately without complex permissions

```sql
-- In Supabase SQL Editor, run:
\i supabase_hospital_simple.sql
```

✅ **What this does**:
- Creates `hospital_daily_records` table
- Sets up basic RLS (everyone can access)
- Inserts 5 sample records
- Ready to use immediately!

---

### Option 2: Production Setup (Full Security)
**Use this if**: You're deploying to production with proper role-based access

```sql
-- In Supabase SQL Editor, run:
\i supabase_hospital_redesign.sql
```

⚠️ **Prerequisites**:
- User roles must be configured in `auth.users.raw_user_meta_data`
- At least one admin user must exist

**Set up admin user** (if not already):
```sql
UPDATE auth.users 
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role":"admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role":"admin"}'::jsonb
  END
WHERE email = 'your-email@example.com';
```

---

## 🔧 Troubleshooting

### Error: "relation user_roles does not exist"
**Solution**: Use `supabase_hospital_simple.sql` instead, or fix the RLS policies to use JWT metadata

**Fix for production file**:
The file has been updated to use:
```sql
(auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
```
Instead of querying a non-existent `user_roles` table.

---

### Error: "permission denied for table hospital_daily_records"
**Solution**: 
1. Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'hospital_daily_records';
```

2. Check policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'hospital_daily_records';
```

3. Temporarily disable RLS for testing:
```sql
ALTER TABLE hospital_daily_records DISABLE ROW LEVEL SECURITY;
-- Test your operations
-- Then re-enable:
ALTER TABLE hospital_daily_records ENABLE ROW LEVEL SECURITY;
```

---

### Error: "duplicate key value violates unique constraint"
**Cause**: Trying to add two records for the same date

**Solution**: Each date can only have ONE record. To update:
1. Use the Edit button in the UI, OR
2. Delete the existing record first, OR
3. Change the date

---

## 📊 Verify Installation

### Check table exists:
```sql
SELECT COUNT(*) FROM hospital_daily_records;
```

### View sample data:
```sql
SELECT 
  record_date,
  heat_stroke_cases + heat_exhaustion_cases + dehydration_cases as total_heat_cases,
  available_beds
FROM hospital_daily_records
ORDER BY record_date DESC
LIMIT 5;
```

### Test insert (as authenticated user):
```sql
INSERT INTO hospital_daily_records (
  hospital_name, record_date,
  heat_stroke_cases, heat_exhaustion_cases,
  dehydration_cases, respiratory_cases,
  total_admissions, available_beds,
  remarks
) VALUES (
  'Palayan City Hospital',
  CURRENT_DATE + INTERVAL '1 day',
  1, 2, 3, 1, 25, 20,
  'Test record'
);
```

---

## 🎯 Migration Path

### From Simple → Production

1. **Backup your data**:
```sql
CREATE TABLE hospital_daily_records_backup AS 
SELECT * FROM hospital_daily_records;
```

2. **Drop simple policies**:
```sql
DROP POLICY "Allow all operations for authenticated users" ON hospital_daily_records;
DROP POLICY "Allow public read" ON hospital_daily_records;
```

3. **Run production RLS policies**:
```sql
-- Copy policies from supabase_hospital_redesign.sql
-- Lines 50-100 (the CREATE POLICY statements)
```

4. **Test with admin user**:
- Login as admin
- Try adding a record
- Try editing a record
- Try deleting a record

5. **Test with regular user**:
- Login as non-admin
- Should be able to add records
- Should only edit/delete own records

---

## 🧪 Testing Checklist

- [ ] Table created successfully
- [ ] Sample data visible in admin dashboard
- [ ] Can add new record
- [ ] Can edit existing record
- [ ] Can delete record
- [ ] Statistics cards show correct totals (last 7 days)
- [ ] Critical badge appears when heat_stroke > 5
- [ ] Warning badge appears when total heat > 10
- [ ] Remarks field saves and displays
- [ ] Date picker works
- [ ] No duplicate date errors

---

## 📞 Need Help?

### Check logs:
```sql
-- Recent errors
SELECT * FROM pg_stat_activity 
WHERE state = 'active';

-- Check RLS
SELECT * FROM pg_policies 
WHERE tablename = 'hospital_daily_records';
```

### Reset everything:
```sql
-- ⚠️ WARNING: This deletes ALL data!
DROP TABLE IF EXISTS hospital_daily_records CASCADE;
-- Then run setup script again
```

---

## ✅ Success Criteria

You're ready to use the module when:

1. ✅ SQL script runs without errors
2. ✅ Table appears in Supabase dashboard
3. ✅ Sample records are visible
4. ✅ Admin dashboard "Hospital Monitoring" tab loads
5. ✅ Can add/edit/delete records from UI
6. ✅ Statistics cards show data
7. ✅ No console errors in browser

---

## 📝 Quick Reference

### File Purposes

| File | Purpose | When to Use |
|------|---------|-------------|
| `supabase_hospital_simple.sql` | Basic setup, permissive RLS | Testing, development |
| `supabase_hospital_redesign.sql` | Production setup, strict RLS | Production deployment |
| `HOSPITAL_MODULE_REDESIGN.md` | Full documentation | Reference, training |
| `HOSPITAL_SETUP_GUIDE.md` | This file | Setup, troubleshooting |

### Common SQL Commands

```sql
-- View all records
SELECT * FROM hospital_daily_records ORDER BY record_date DESC;

-- Count records
SELECT COUNT(*) FROM hospital_daily_records;

-- Last 7 days summary
SELECT 
  SUM(heat_stroke_cases) as total_heat_stroke,
  SUM(heat_exhaustion_cases) as total_exhaustion,
  AVG(available_beds) as avg_beds
FROM hospital_daily_records
WHERE record_date >= CURRENT_DATE - INTERVAL '7 days';

-- Delete all sample data
DELETE FROM hospital_daily_records WHERE remarks LIKE '%Test%';

-- Reset sequence (if needed)
ALTER TABLE hospital_daily_records ALTER COLUMN id SET DEFAULT gen_random_uuid();
```

---

**Last Updated**: May 8, 2026  
**Version**: 1.0  
**Status**: Production Ready
