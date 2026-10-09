-- PHASE 9: Power Utility Module

CREATE TABLE IF NOT EXISTS power_feeders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    substation TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Energized', -- Energized, De-energized, Tripped/Fault
    lat FLOAT,
    lng FLOAT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS power_interruptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affected_areas TEXT NOT NULL,
    reason TEXT,
    start_time TIMESTAMPTZ,
    estimated_restoration TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Ongoing, Restored
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE power_feeders ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_interruptions ENABLE ROW LEVEL SECURITY;

-- Policies for power_feeders
DROP POLICY IF EXISTS "Public read power_feeders" ON power_feeders;
CREATE POLICY "Public read power_feeders" ON power_feeders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify power_feeders" ON power_feeders;
CREATE POLICY "Admin modify power_feeders" ON power_feeders FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    )
);

-- Policies for power_interruptions
DROP POLICY IF EXISTS "Public read power_interruptions" ON power_interruptions;
CREATE POLICY "Public read power_interruptions" ON power_interruptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify power_interruptions" ON power_interruptions;
CREATE POLICY "Admin modify power_interruptions" ON power_interruptions FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    )
);

-- Audit Triggers
DROP TRIGGER IF EXISTS power_feeders_audit ON power_feeders;
CREATE TRIGGER power_feeders_audit
AFTER INSERT OR UPDATE OR DELETE ON power_feeders
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS power_interruptions_audit ON power_interruptions;
CREATE TRIGGER power_interruptions_audit
AFTER INSERT OR UPDATE OR DELETE ON power_interruptions
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
