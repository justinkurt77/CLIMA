-- PHASE 5: Hospital Module

CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    lat FLOAT,
    lng FLOAT,
    total_beds INT DEFAULT 0,
    available_beds INT DEFAULT 0,
    heat_stroke_cases INT DEFAULT 0,
    heat_exhaustion_cases INT DEFAULT 0,
    dehydration_cases INT DEFAULT 0,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Public can read hospitals
DROP POLICY IF EXISTS "Public read hospitals" ON hospitals;
CREATE POLICY "Public read hospitals" ON hospitals FOR SELECT USING (true);

-- Superadmins and authorized admins can modify hospitals
DROP POLICY IF EXISTS "Admin modify hospitals" ON hospitals;
CREATE POLICY "Admin modify hospitals" ON hospitals FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    )
);

-- Add Audit Trigger for Hospitals
DROP TRIGGER IF EXISTS hospitals_audit ON hospitals;
CREATE TRIGGER hospitals_audit
AFTER INSERT OR UPDATE OR DELETE ON hospitals
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
