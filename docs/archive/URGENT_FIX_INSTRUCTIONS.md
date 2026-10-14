# 🚨 URGENT: Fix Database Schema Errors

## Your Current Errors

```
❌ column water_interruptions.interruption_date does not exist
❌ column power_interruptions.interruption_date does not exist
❌ column profiles.full_name does not exist
❌ table bfp_operations does not exist (404)
❌ function get_auth_users does not exist
```

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Select your CLIMA project
3. Click **"SQL Editor"** in left sidebar
4. Click **"+ New query"**

### Step 2: Run the Fix Script

1. Open the file: **`FIX_DATABASE_SCHEMA.sql`** (in your CLIMA folder)
2. **Copy ALL contents** (Ctrl+A, Ctrl+C)
3. **Paste into Supabase SQL Editor** (Ctrl+V)
4. **Click "Run"** button (or press Ctrl+Enter)
5. Wait for "Success" message

### Step 3: Verify Tables Created

You should see this output at the bottom:

```
profiles columns: id, email, full_name, role, created_at, updated_at
water_interruptions columns: id, interruption_date, interruption_time, provider, ...
power_interruptions columns: id, interruption_date, total_outages, ...
bfp_operations columns: id, operation_date, operation_time, ...
```

### Step 4: Refresh Admin Dashboard

1. Go back to your CLIMA admin dashboard
2. **Hard refresh**: Press `Ctrl + Shift + R`
3. All errors should be gone! ✅

---

## What This Script Does

### 1. Fixes `profiles` table
- ✅ Adds `full_name` column
- ✅ Adds `role` column
- ✅ Populates from `auth.users`

### 2. Recreates `water_interruptions` table
- ✅ Correct column: `interruption_date` 
- ✅ Adds all required columns
- ✅ Sets up RLS policies

### 3. Recreates `power_interruptions` table
- ✅ Correct column: `interruption_date`
- ✅ Unique constraint on date (one record per day)
- ✅ Sets up RLS policies

### 4. Creates `bfp_operations` table
- ✅ Per-operation tracking
- ✅ All required columns
- ✅ Sets up RLS policies

### 5. Creates `get_auth_users()` function
- ✅ Returns admin users with roles
- ✅ Grants execute permission

---

## Still Need to Run (After Fix Script)

After the fix script works, you still need these modules:

### Optional Modules (run if you want those features):

1. **Hospital Module**: `supabase_hospital_redesign.sql`
2. **CDRRMO Operations**: `supabase_cdrrmo_operations_v2.sql`
3. **Agriculture Damages**: `supabase_agriculture_damages.sql`
4. **Module Permissions**: `supabase_module_permissions.sql`

But the **critical errors will be fixed** with just the `FIX_DATABASE_SCHEMA.sql`!

---

## Expected Results After Fix

### ✅ Module Permissions Section Works
- Settings tab shows "Module Permissions"
- Can select admin users
- Can assign templates

### ✅ No More Console Errors
- `interruption_date` columns exist
- `full_name` column exists
- `get_auth_users` function exists
- BFP operations table exists

### ✅ All Tabs Load
- Overview tab works
- Water tab loads (empty but no errors)
- Power tab loads (empty but no errors)
- BFP tab loads (empty but no errors)

---

## Troubleshooting

### Error: "relation profiles does not exist"
**Solution:** You need to run `supabase_phase1.sql` first to create basic tables

### Error: "permission denied"
**Solution:** Make sure you're logged into Supabase as the project owner

### Error: "must be owner of database"
**Solution:** Check your Supabase role - you need admin access

### Script runs but errors persist
**Solution:** 
1. Check if script actually completed (scroll to bottom of results)
2. Run verification queries manually:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'profiles';
   ```
3. Hard refresh browser (Ctrl+Shift+R) after SQL changes

---

## Quick Verification Query

Run this after the fix script to confirm everything worked:

```sql
-- This should return 4 rows with no errors
SELECT 
  'profiles' as table_name, 
  COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'profiles'
UNION ALL
SELECT 'water_interruptions', COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'water_interruptions'
UNION ALL
SELECT 'power_interruptions', COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'power_interruptions'
UNION ALL
SELECT 'bfp_operations', COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'bfp_operations';
```

Expected output:
```
profiles               6-8 columns
water_interruptions    11-12 columns
power_interruptions    10-11 columns
bfp_operations         9-10 columns
```

---

**Next Step:** Run `FIX_DATABASE_SCHEMA.sql` in Supabase → SQL Editor → Click Run

**Time Required:** 2 minutes to run, 3 minutes to verify

**After This:** Your admin dashboard should work without errors! 🎉
