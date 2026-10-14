-- FIX for Advisory Visibility Issue
-- Admins couldn't see their submitted advisories after submission

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

-- Also update the modify policy to allow admins to edit their own pending submissions
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

-- Also fix insert policy to ensure admins can always insert
DROP POLICY IF EXISTS "Admin insert advisories" ON advisories;
CREATE POLICY "Admin insert advisories" ON advisories FOR INSERT
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin')
);

COMMENT ON POLICY "Admin read advisories" ON advisories IS 'Admins can read advisories from their department or those they authored';
