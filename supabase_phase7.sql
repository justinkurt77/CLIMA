-- PHASE 7: BFP Operations (Fire Management)

CREATE TABLE IF NOT EXISTS fire_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    lat FLOAT,
    lng FLOAT,
    fire_trucks INT DEFAULT 0,
    active_personnel INT DEFAULT 0,
    contact_number TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fire_hydrants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) DEFAULT 'Operational', -- Operational, Needs Repair, Out of Service
    location TEXT NOT NULL,
    lat FLOAT,
    lng FLOAT,
    pressure_level VARCHAR(20) DEFAULT 'Normal', -- Low, Normal, High
    last_inspected TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fire_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_hydrants ENABLE ROW LEVEL SECURITY;

-- Fire Stations Policies
DROP POLICY IF EXISTS "Public read fire_stations" ON fire_stations;
CREATE POLICY "Public read fire_stations" ON fire_stations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify fire_stations" ON fire_stations;
CREATE POLICY "Admin modify fire_stations" ON fire_stations FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    )
);

-- Fire Hydrants Policies
DROP POLICY IF EXISTS "Public read fire_hydrants" ON fire_hydrants;
CREATE POLICY "Public read fire_hydrants" ON fire_hydrants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify fire_hydrants" ON fire_hydrants;
CREATE POLICY "Admin modify fire_hydrants" ON fire_hydrants FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

-- Audit Triggers
DROP TRIGGER IF EXISTS fire_stations_audit ON fire_stations;
CREATE TRIGGER fire_stations_audit
AFTER INSERT OR UPDATE OR DELETE ON fire_stations
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS fire_hydrants_audit ON fire_hydrants;
CREATE TRIGGER fire_hydrants_audit
AFTER INSERT OR UPDATE OR DELETE ON fire_hydrants
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
