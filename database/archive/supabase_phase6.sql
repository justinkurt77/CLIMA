-- PHASE 6: CDRRMO Operations

CREATE TABLE IF NOT EXISTS evacuation_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    lat FLOAT,
    lng FLOAT,
    max_capacity INT DEFAULT 0,
    current_occupants INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Standby', -- Standby, Active, Full, Closed
    manager_name TEXT,
    contact_number TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relief_goods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Food', -- Food, Water, Medicine, Non-Food
    quantity INT DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pcs',
    center_id UUID REFERENCES evacuation_centers(id) ON DELETE CASCADE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    responder_team TEXT NOT NULL,
    vehicle_details TEXT,
    status VARCHAR(50) DEFAULT 'En Route', -- En Route, On Scene, Resolved, Cancelled
    notes TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    dispatched_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE evacuation_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE relief_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;

-- Evacuation Centers Policies
DROP POLICY IF EXISTS "Public read evacuation_centers" ON evacuation_centers;
CREATE POLICY "Public read evacuation_centers" ON evacuation_centers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify evacuation_centers" ON evacuation_centers;
CREATE POLICY "Admin modify evacuation_centers" ON evacuation_centers FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    )
);

-- Relief Goods Policies
DROP POLICY IF EXISTS "Admin modify relief_goods" ON relief_goods;
CREATE POLICY "Admin modify relief_goods" ON relief_goods FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);
DROP POLICY IF EXISTS "Public read relief_goods" ON relief_goods;
CREATE POLICY "Public read relief_goods" ON relief_goods FOR SELECT USING (true);

-- Dispatches Policies
DROP POLICY IF EXISTS "Public read dispatches" ON dispatches;
CREATE POLICY "Public read dispatches" ON dispatches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify dispatches" ON dispatches;
CREATE POLICY "Admin modify dispatches" ON dispatches FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    )
);

-- Audit Triggers
DROP TRIGGER IF EXISTS evacuation_centers_audit ON evacuation_centers;
CREATE TRIGGER evacuation_centers_audit
AFTER INSERT OR UPDATE OR DELETE ON evacuation_centers
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS dispatches_audit ON dispatches;
CREATE TRIGGER dispatches_audit
AFTER INSERT OR UPDATE OR DELETE ON dispatches
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS relief_goods_audit ON relief_goods;
CREATE TRIGGER relief_goods_audit
AFTER INSERT OR UPDATE OR DELETE ON relief_goods
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
