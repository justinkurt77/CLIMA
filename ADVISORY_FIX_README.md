# Official Advisories - Visibility Fix

## Problem
After submitting an advisory for approval, it doesn't appear in the list.

## Root Cause
The Row Level Security (RLS) policies on the `advisories` table were too restrictive. Admins couldn't see advisories they authored if the policies only checked department matching.

## Solution Applied

### 1. Database Fix (Required)
Run the SQL fix to update RLS policies:

```bash
psql -h your-supabase-host -U postgres -d postgres -f supabase_phase3_fix.sql
```

**Or manually in Supabase SQL Editor:**

```sql
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Admin read advisories" ON advisories;

-- Create new policy that allows admins to see:
-- 1. Advisories from their department
-- 2. Advisories they authored themselves
CREATE POLICY "Admin read advisories" ON advisories FOR SELECT
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
    (
        -- Their department's advisories
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
        OR
        -- OR advisories they authored (even if pending approval)
        author_id = auth.uid()
    )
);

-- Also update the modify policy
DROP POLICY IF EXISTS "Admin modify advisories" ON advisories;
CREATE POLICY "Admin modify advisories" ON advisories FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
    (
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
        OR
        author_id = auth.uid()
    )
);

-- Ensure admins can insert
DROP POLICY IF EXISTS "Admin insert advisories" ON advisories;
CREATE POLICY "Admin insert advisories" ON advisories FOR INSERT
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
);
```

### 2. Code Improvements (Already Applied)
Updated `AdminDashboard.jsx` to:
- ✅ Check for errors during submission
- ✅ Show success/error messages to user
- ✅ Automatically switch filter to "Pending" after submission
- ✅ Log errors to console for debugging

## How It Works Now

### For Regular Admins:
1. Create an advisory
2. Click "Submit for Approval"
3. Advisory status = "Pending"
4. **Advisory appears immediately** in the list (filtered to "Pending")
5. Success message confirms submission

### For Superadmins:
1. Create an advisory
2. Click "Publish Now"
3. Advisory status = "Published"
4. Advisory appears immediately in the list
5. Public can see it on citizen app

### Approval Workflow:
1. Admin submits → Status: "Pending"
2. Superadmin reviews in "Pending" filter
3. Superadmin changes status to "Published"
4. Advisory goes live to public

## Testing the Fix

### Test 1: Admin Submission
1. Login as Admin (not superadmin)
2. Go to Official Advisories
3. Click "+ New Advisory"
4. Fill in:
   - Headline: "Test Advisory"
   - Category: "General"
   - Content: "This is a test"
5. Click "Submit for Approval"
6. **Expected Result:** 
   - Success alert appears
   - Filter auto-switches to "Pending"
   - Advisory visible in list with "Pending" badge

### Test 2: Superadmin Approval
1. Login as Superadmin
2. Go to Official Advisories
3. Set filter to "Pending"
4. Find the test advisory
5. Click the status dropdown
6. Change to "Publish"
7. **Expected Result:**
   - Advisory status changes to "Published"
   - Advisory moves to "Published" filter

### Test 3: Public Visibility
1. Logout or view citizen app
2. Check advisories/alerts feed
3. **Expected Result:** Published advisory appears

## Troubleshooting

### Issue: Still seeing "No advisories found"

**Check 1: Database Migration**
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'advisories';
-- Should show multiple policies including "Admin read advisories"
```

**Check 2: User Metadata**
```sql
-- Check if user has proper role and department
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'assigned_department' as department
FROM auth.users
WHERE id = auth.uid();
```

**Check 3: Browser Console**
- Open Developer Tools (F12)
- Go to Console tab
- Look for errors when submitting
- Check Network tab for Supabase API errors

**Check 4: Supabase Logs**
- Go to Supabase Dashboard
- Navigate to Logs → Postgres Logs
- Look for permission denied errors

### Issue: "Failed to submit advisory" error

**Possible causes:**
1. **RLS Policy not updated** - Run the fix SQL
2. **Missing department_id** - Ensure admin has assigned_department in user metadata
3. **Invalid user session** - Logout and login again
4. **Database connection** - Check Supabase project is active

### Issue: Superadmin can't see admin's pending advisories

**Fix:**
```sql
-- Superadmin should see ALL advisories
DROP POLICY IF EXISTS "Superadmin read advisories" ON advisories;
CREATE POLICY "Superadmin read advisories" ON advisories FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin');
```

## Additional Improvements

### Optional: Add Toast Notifications
Replace `alert()` with a toast library like `react-hot-toast`:

```bash
npm install react-hot-toast
```

```jsx
import toast from 'react-hot-toast';

// Replace alert() with:
toast.success('Advisory submitted for approval!');
toast.error('Failed to submit advisory');
```

### Optional: Add Loading State
Show loading spinner while fetching:
```jsx
{loading && <div className="loading-spinner">Loading advisories...</div>}
```

## Files Modified
- ✅ `src/screens/AdminDashboard.jsx` - Added error handling and user feedback
- ✅ `supabase_phase3_fix.sql` - Fixed RLS policies

## Verification Checklist
- [ ] Run `supabase_phase3_fix.sql` migration
- [ ] Rebuild: `npm run build` ✅ (verified passing)
- [ ] Deploy updated code to hosting
- [ ] Test admin submission
- [ ] Test superadmin approval
- [ ] Verify public visibility

## Support
If issues persist:
1. Check browser console for errors
2. Check Supabase logs
3. Verify user has correct role in auth.users metadata
4. Ensure advisories table has RLS enabled: `ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;`
