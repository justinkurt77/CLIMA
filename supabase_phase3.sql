-- PHASE 3: Official Advisories

CREATE TABLE IF NOT EXISTS advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- Weather, Water, Power, Health
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'Draft', -- Draft, Pending, Published, Archived
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scheduled_for TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;

-- Public can read only published advisories (and scheduled_for is either null or past)
DROP POLICY IF EXISTS "Public read published advisories" ON advisories;
CREATE POLICY "Public read published advisories" ON advisories FOR SELECT
USING (status = 'Published' AND (scheduled_for IS NULL OR scheduled_for <= NOW()));

-- Superadmins can read all advisories
DROP POLICY IF EXISTS "Superadmin read advisories" ON advisories;
CREATE POLICY "Superadmin read advisories" ON advisories FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin');

-- Admins can read advisories for their department
DROP POLICY IF EXISTS "Admin read advisories" ON advisories;
CREATE POLICY "Admin read advisories" ON advisories FOR SELECT
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
    (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
);

-- Superadmins can modify all advisories
DROP POLICY IF EXISTS "Superadmin modify advisories" ON advisories;
CREATE POLICY "Superadmin modify advisories" ON advisories FOR ALL
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin');

-- Admins can modify advisories for their department
DROP POLICY IF EXISTS "Admin modify advisories" ON advisories;
CREATE POLICY "Admin modify advisories" ON advisories FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
    (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
);

-- Add Audit Trigger for Advisories
DROP TRIGGER IF EXISTS advisories_audit ON advisories;
CREATE TRIGGER advisories_audit
AFTER INSERT OR UPDATE OR DELETE ON advisories
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
