-- PHASE 8: Water Utility Module

CREATE TABLE IF NOT EXISTS water_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    facility_type VARCHAR(50) DEFAULT 'Pumping Station', -- Pumping Station, Reservoir, Treatment Plant
    location TEXT NOT NULL,
    lat FLOAT,
    lng FLOAT,
    status VARCHAR(50) DEFAULT 'Operational', -- Operational, Maintenance, Offline
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS water_interruptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affected_areas TEXT NOT NULL,
    reason TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Ongoing, Resolved
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tanker_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanker_plate TEXT NOT NULL,
    driver_name TEXT,
    destination TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'En Route', -- En Route, Dispensing, Returned
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE water_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_interruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tanker_dispatches ENABLE ROW LEVEL SECURITY;

-- Policies for water_facilities
DROP POLICY IF EXISTS "Public read water_facilities" ON water_facilities;
CREATE POLICY "Public read water_facilities" ON water_facilities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify water_facilities" ON water_facilities;
CREATE POLICY "Admin modify water_facilities" ON water_facilities FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    )
);

-- Policies for water_interruptions
DROP POLICY IF EXISTS "Public read water_interruptions" ON water_interruptions;
CREATE POLICY "Public read water_interruptions" ON water_interruptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify water_interruptions" ON water_interruptions;
CREATE POLICY "Admin modify water_interruptions" ON water_interruptions FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    )
);

-- Policies for tanker_dispatches
DROP POLICY IF EXISTS "Public read tanker_dispatches" ON tanker_dispatches;
CREATE POLICY "Public read tanker_dispatches" ON tanker_dispatches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify tanker_dispatches" ON tanker_dispatches;
CREATE POLICY "Admin modify tanker_dispatches" ON tanker_dispatches FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    )
);

-- Audit Triggers
DROP TRIGGER IF EXISTS water_facilities_audit ON water_facilities;
CREATE TRIGGER water_facilities_audit
AFTER INSERT OR UPDATE OR DELETE ON water_facilities
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS water_interruptions_audit ON water_interruptions;
CREATE TRIGGER water_interruptions_audit
AFTER INSERT OR UPDATE OR DELETE ON water_interruptions
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS tanker_dispatches_audit ON tanker_dispatches;
CREATE TRIGGER tanker_dispatches_audit
AFTER INSERT OR UPDATE OR DELETE ON tanker_dispatches
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
