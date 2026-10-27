# RLS Verification Steps (Manual - Supabase Dashboard)

## Overview
Row Level Security (RLS) must be enabled on all tables to ensure proper data isolation and access control. This document outlines the manual verification steps required in the Supabase Dashboard.

## Verification Steps

### 1. Access Supabase Dashboard
1. Log into your Supabase project at https://supabase.com/dashboard
2. Select the CLIMA project (dkuztdffceayepajhnvz)

### 2. Verify RLS Enabled on All Tables
1. Navigate to **Table Editor** in the left sidebar
2. For each table in the list:
   - `profiles`
   - `reports`
   - `advisories`
   - `hospital_daily_records`
   - `cdrrmo_daily_operations`
   - `bfp_operations`
   - `agriculture_damage_reports`
   - `water_utility_interruptions`
   - `power_utility_outages`
   - `departments`
   - `categories`
   - `admin_module_permissions`
   - `password_reset_otps`
   - `audit_logs`

3. Click on the table name
4. Look for the **RLS** badge in the table header
5. It should show **"RLS enabled"** with a green checkmark
6. If RLS is not enabled, click the badge and toggle it on

### 3. Verify RLS Policies Exist
1. Navigate to **Authentication > Policies** in the left sidebar
2. Verify that policies exist for each table
3. Common policy patterns to check:
   - **Public read policies** for `advisories` (status = 'Published')
   - **Authenticated user policies** for `reports` (users can only access their own reports)
   - **Admin-only policies** for management tables (`departments`, `categories`, `admin_module_permissions`)
   - **Service role bypass** for server-side operations

### 4. SQL Verification Query
Run this query in the **SQL Editor** to programmatically verify RLS status:

```sql
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Result:** All tables should have `rls_enabled = true`

### 5. Test with Non-Admin User
1. Create a test non-admin user account
2. Log in as that user
3. Navigate to the app and attempt to:
   - View another user's profile → Should be denied
   - Access admin-only tables → Should be denied
   - Read published advisories → Should succeed
   - Create a report → Should succeed (as their own user)

### 6. Test with Anonymous User
1. Log out completely (anonymous access)
2. Attempt to:
   - Write to `reports` table → Should be denied
   - Write to `profiles` table → Should be denied
   - Read `advisories` with status='Published' → Should succeed (if policy allows)

## Common Issues

### Issue: RLS Enabled but Queries Fail
**Cause:** Missing policies for specific operations (SELECT, INSERT, UPDATE, DELETE)
**Solution:** Create policies for each operation needed by the application

### Issue: Admin Users Cannot Access Data
**Cause:** Policies are too restrictive and don't account for admin role
**Solution:** Add policy clauses that check `auth.jwt() ->> 'role' = 'admin'` or use service role for admin operations

### Issue: Service Role Operations Fail
**Cause:** Service role bypasses RLS by default but code might not be using service role key
**Solution:** Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env` and used for admin API operations

## Documentation

Document the verification results:
- Date verified: _________________
- Verified by: ___________________
- All tables RLS enabled: ☐ Yes ☐ No
- All policies in place: ☐ Yes ☐ No
- Test user verification passed: ☐ Yes ☐ No
- Anonymous user verification passed: ☐ Yes ☐ No

## Next Steps

If any verification step fails:
1. Enable RLS on the failing table
2. Create appropriate policies for the table
3. Re-run verification tests
4. Document any changes made

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
