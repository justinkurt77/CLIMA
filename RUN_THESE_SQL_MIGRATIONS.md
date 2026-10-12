# SQL Migrations to Run - In Order

## Current Errors You're Seeing

```
❌ 404: power_interruptions table doesn't exist
❌ 404: water_interruptions table doesn't exist  
❌ 404: bfp_operations table doesn't exist
❌ 404: bfp_daily_operations table doesn't exist
❌ 400: profiles.role column query failing
❌ 400: get_auth_users RPC function doesn't exist
```

## Required SQL Files (Run in Supabase SQL Editor)

### Step 1: Hospital Module
**File:** `supabase_hospital_redesign.sql`

This creates:
- `hospital_data` table
- Daily tracking with El Niño admissions
- RLS policies

### Step 2: CDRRMO Operations
**File:** `supabase_cdrrmo_operations_v2.sql`

This creates:
- `cdrrmo_operations` table  
- Per-operation tracking (evacuation, rescue, relief, etc.)
- RLS policies

### Step 3: BFP Operations
**File:** `supabase_bfp_operations_v2.sql`

This creates:
- `bfp_operations` table
- Per-operation tracking (fire, inspection, rescue, etc.)
- RLS policies

### Step 4: Agriculture Damages
**File:** `supabase_agriculture_damages.sql`

This creates:
- `agriculture_damage_reports` table
- Farm and livestock damage tracking
- RLS policies

### Step 5: Water Interruptions
**File:** `supabase_water_interruptions.sql`

This creates:
- `water_interruptions` table
- Per-provider tracking (PCWD, Balibago Waterworks)
- RLS policies

### Step 6: Power Interruptions
**File:** `supabase_power_interruptions.sql`

This creates:
- `power_interruptions` table
- NEECO daily tracking
- RLS policies

### Step 7: Module Permissions (Already Done? ✅)
**File:** `supabase_module_permissions.sql`

This creates:
- `admin_module_permissions` table
- `has_module_permission()` function
- Permission management system

---

## How to Run Each Migration

### In Supabase Dashboard:

1. **Go to SQL Editor**
   - Open https://supabase.com
   - Select your CLIMA project
   - Click "SQL Editor" in left sidebar

2. **For Each File Above:**
   - Click "+ New query"
   - Copy ENTIRE contents of the SQL file
   - Paste into SQL editor
   - Click "Run" or press `Ctrl+Enter`
   - Wait for "Success. No rows returned"
   - Move to next file

3. **Check for Errors**
   - If you see "relation already exists" - **that's OK!** Skip to next file
   - If you see "permission denied" - you need to be database owner
   - If you see "syntax error" - copy the error and let me know

---

## Quick Check: Which Tables Exist?

Run this query to see what you already have:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'hospital_data',
  'cdrrmo_operations',
  'bfp_operations',
  'agriculture_damage_reports',
  'water_interruptions',
  'power_interruptions',
  'admin_module_permissions',
  'profiles'
)
ORDER BY tablename;
```

Expected result (all 8 tables):
```
agriculture_damage_reports
admin_module_permissions
bfp_operations
cdrrmo_operations
hospital_data
power_interruptions
profiles
water_interruptions
```

---

## Fix for "profiles" Query Error

The error shows: `profiles?select=id,full_name,email&role=eq.admin`

This means the query is trying to filter by `role` column on `profiles` table.

### Check if profiles table has role column:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### If `role` column is missing, add it:

```sql
-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT CHECK (role IN ('admin', 'superadmin'));
  END IF;
END $$;

-- Update existing profiles to have role based on auth.users
UPDATE profiles p
SET role = (
  SELECT au.raw_user_meta_data->>'role'
  FROM auth.users au
  WHERE au.id = p.id
)
WHERE role IS NULL;
```

---

## Fix for "get_auth_users" RPC Error

This RPC function might not exist. Let's create it:

```sql
-- Create get_auth_users function (if it doesn't exist)
CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  assigned_categories TEXT[]
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    (au.raw_user_meta_data->>'role')::TEXT as role,
    COALESCE(
      (au.raw_user_meta_data->'assigned_categories')::TEXT[],
      ARRAY['All Categories']::TEXT[]
    ) as assigned_categories
  FROM auth.users au
  WHERE au.raw_user_meta_data->>'role' IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;
```

---

## Complete Setup Script (All-in-One)

If you want to run everything at once, copy this into SQL Editor:

```sql
-- ==========================================
-- CLIMA Database Setup - All Modules
-- Run this entire script in Supabase SQL Editor
-- ==========================================

-- 1. Add role column to profiles (if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT CHECK (role IN ('admin', 'superadmin'));
  END IF;
END $$;

-- 2. Create get_auth_users function
CREATE OR REPLACE FUNCTION get_auth_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  assigned_categories TEXT[]
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    (au.raw_user_meta_data->>'role')::TEXT as role,
    COALESCE(
      (au.raw_user_meta_data->'assigned_categories')::TEXT[],
      ARRAY['All Categories']::TEXT[]
    ) as assigned_categories
  FROM auth.users au
  WHERE au.raw_user_meta_data->>'role' IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_auth_users() TO authenticated;

-- 3. Then run each module SQL file individually:
-- - supabase_hospital_redesign.sql
-- - supabase_cdrrmo_operations_v2.sql
-- - supabase_bfp_operations_v2.sql
-- - supabase_agriculture_damages.sql
-- - supabase_water_interruptions.sql
-- - supabase_power_interruptions.sql
-- - supabase_module_permissions.sql
```

---

## After Running Migrations

### 1. Verify Tables Created

```sql
SELECT 
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'hospital_data',
  'cdrrmo_operations',
  'bfp_operations',
  'agriculture_damage_reports',
  'water_interruptions',
  'power_interruptions',
  'admin_module_permissions'
)
ORDER BY tablename;
```

### 2. Test Module Permissions

```sql
-- Check if you can query module permissions
SELECT * FROM admin_module_permissions LIMIT 1;

-- Should return empty set (no error)
```

### 3. Refresh Admin Dashboard

1. Go back to CLIMA admin
2. **Hard refresh:** `Ctrl + Shift + R`
3. Errors should be gone! ✅

---

## Expected Results

After running all migrations:

✅ No more 404 errors  
✅ No more 400 errors  
✅ "Failed to load admin users" error gone  
✅ All module tabs work  
✅ Module Permissions section loads in Settings  

---

## Still Have Errors?

### Error: "relation already exists"
**Solution:** Skip that file, it's already created ✅

### Error: "must be owner of table"
**Solution:** You need database admin privileges in Supabase

### Error: "column 'role' does not exist"
**Solution:** Run the "Add role column" script above

### Error: Function "get_auth_users" does not exist
**Solution:** Run the "Create get_auth_users function" script above

---

## Priority Order (If Short on Time)

If you can't run all migrations right now, run these FIRST:

1. ✅ **Fix profiles.role** (run the role column script)
2. ✅ **Create get_auth_users** (run the function script)  
3. ✅ **supabase_module_permissions.sql** (for permissions UI)

Then run the other module SQLs when you need those features.

---

**Current Status:** Dashboard loaded but modules have missing tables  
**Next Action:** Run SQL migrations in Supabase SQL Editor  
**Time Required:** ~10 minutes to run all migrations
