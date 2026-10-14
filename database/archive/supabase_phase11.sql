-- PHASE 11: Inter-Agency Intelligence Module

-- Agency Dependencies Table
CREATE TABLE IF NOT EXISTS agency_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependent_facility_type TEXT NOT NULL, -- 'hospital', 'evacuation_center', 'fire_station'
    dependent_facility_id UUID NOT NULL,
    dependency_type TEXT NOT NULL, -- 'power', 'water', 'both'
    utility_facility_type TEXT NOT NULL, -- 'power_feeder', 'water_facility'
    utility_facility_id UUID NOT NULL,
    criticality TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conflict Alerts Table
CREATE TABLE IF NOT EXISTS conflict_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL, -- 'utility_outage_impact', 'concurrent_incidents', 'resource_conflict'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_agencies UUID[], -- Array of department IDs
    affected_facilities JSONB, -- { type, id, name }[]
    metadata JSONB, -- Additional context
    status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    auto_generated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inter-Agency Notifications Table
CREATE TABLE IF NOT EXISTS inter_agency_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_department_id UUID REFERENCES departments(id),
    to_department_id UUID REFERENCES departments(id),
    notification_type TEXT NOT NULL, -- 'alert', 'info', 'request', 'update'
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    related_alert_id UUID REFERENCES conflict_alerts(id),
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agency_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inter_agency_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins manage dependencies" ON agency_dependencies;
CREATE POLICY "Admins manage dependencies" ON agency_dependencies FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Admins read conflict_alerts" ON conflict_alerts;
CREATE POLICY "Admins read conflict_alerts" ON conflict_alerts FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Admins update conflict_alerts" ON conflict_alerts;
CREATE POLICY "Admins update conflict_alerts" ON conflict_alerts FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Admins read notifications" ON inter_agency_notifications;
CREATE POLICY "Admins read notifications" ON inter_agency_notifications FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Admins send notifications" ON inter_agency_notifications;
CREATE POLICY "Admins send notifications" ON inter_agency_notifications FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

-- Function: Check Power-to-Water Impact
CREATE OR REPLACE FUNCTION check_power_to_water_impact(power_feeder_id UUID)
RETURNS TABLE(
    facility_name TEXT,
    facility_type TEXT,
    impact_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(wf.name, 'Unknown Facility'),
        'Water Facility',
        'Power outage affecting ' || wf.facility_type || ' - potential water supply interruption'
    FROM water_facilities wf
    WHERE wf.power_source_id = power_feeder_id
    AND wf.status = 'operational';
END;
$$ LANGUAGE plpgsql;

-- Function: Check Hospital Utility Dependencies
CREATE OR REPLACE FUNCTION check_hospital_utility_dependencies(
    utility_type TEXT, -- 'power' or 'water'
    utility_id UUID
)
RETURNS TABLE(
    hospital_name TEXT,
    criticality TEXT,
    capacity_info TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.name,
        ad.criticality,
        'Beds: ' || h.available_beds || '/' || h.total_beds || 
        ', Active Cases: ' || (h.heat_stroke_cases + h.heat_exhaustion_cases + h.dehydration_cases)
    FROM hospitals h
    INNER JOIN agency_dependencies ad ON 
        ad.dependent_facility_id = h.id
        AND ad.dependent_facility_type = 'hospital'
        AND ad.utility_facility_id = utility_id
        AND (ad.dependency_type = utility_type OR ad.dependency_type = 'both')
    WHERE h.available_beds > 0 OR 
          (h.heat_stroke_cases + h.heat_exhaustion_cases + h.dehydration_cases) > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Detect Concurrent Incidents
CREATE OR REPLACE FUNCTION detect_concurrent_incidents(
    time_window_minutes INT DEFAULT 30,
    distance_km FLOAT DEFAULT 2.0
)
RETURNS TABLE(
    cluster_id INT,
    incident_count INT,
    categories TEXT[],
    center_lat FLOAT,
    center_lng FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_reports AS (
        SELECT 
            id,
            category,
            lat,
            lng,
            created_at
        FROM reports
        WHERE 
            created_at >= NOW() - (time_window_minutes || ' minutes')::INTERVAL
            AND status IN ('pending', 'inprogress')
            AND lat IS NOT NULL
            AND lng IS NOT NULL
    ),
    clustered AS (
        SELECT 
            r1.id,
            r1.category,
            r1.lat,
            r1.lng,
            COUNT(DISTINCT r2.id) as nearby_count,
            ARRAY_AGG(DISTINCT r2.category) as nearby_categories
        FROM recent_reports r1
        LEFT JOIN recent_reports r2 ON 
            r1.id != r2.id
            AND (
                6371 * acos(
                    cos(radians(r1.lat)) * cos(radians(r2.lat)) *
                    cos(radians(r2.lng) - radians(r1.lng)) +
                    sin(radians(r1.lat)) * sin(radians(r2.lat))
                )
            ) <= distance_km
        GROUP BY r1.id, r1.category, r1.lat, r1.lng
        HAVING COUNT(DISTINCT r2.id) >= 2
    )
    SELECT 
        ROW_NUMBER() OVER ()::INT as cluster_id,
        (nearby_count + 1)::INT as incident_count,
        nearby_categories,
        AVG(lat)::FLOAT as center_lat,
        AVG(lng)::FLOAT as center_lng
    FROM clustered
    GROUP BY nearby_count, nearby_categories;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate Utility Conflict Alert
CREATE OR REPLACE FUNCTION generate_utility_conflict_alert(
    utility_type TEXT,
    utility_id UUID,
    utility_name TEXT,
    outage_start TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
    affected_hospitals JSONB;
    affected_count INT;
BEGIN
    -- Get affected hospitals
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'type', 'hospital',
                'id', hospital_name,
                'criticality', criticality,
                'info', capacity_info
            )
        ),
        COUNT(*)
    INTO affected_hospitals, affected_count
    FROM check_hospital_utility_dependencies(utility_type, utility_id);

    -- Only create alert if facilities are affected
    IF affected_count > 0 THEN
        INSERT INTO conflict_alerts (
            alert_type,
            severity,
            title,
            description,
            affected_facilities,
            metadata,
            status
        ) VALUES (
            'utility_outage_impact',
            CASE 
                WHEN affected_count >= 3 THEN 'critical'
                WHEN affected_count >= 2 THEN 'high'
                ELSE 'medium'
            END,
            utility_type || ' Outage Affecting ' || affected_count || ' Facilities',
            'The ' || utility_name || ' ' || utility_type || ' outage is affecting ' || 
            affected_count || ' critical facilities including hospitals.',
            affected_hospitals,
            jsonb_build_object(
                'utility_type', utility_type,
                'utility_id', utility_id,
                'utility_name', utility_name,
                'outage_start', outage_start
            ),
            'active'
        )
        RETURNING id INTO alert_id;

        RETURN alert_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-detect power outage impact when power interruption is created
CREATE OR REPLACE FUNCTION trigger_power_outage_check()
RETURNS TRIGGER AS $$
DECLARE
    alert_id UUID;
BEGIN
    -- Only for new interruptions with status 'ongoing'
    IF TG_OP = 'INSERT' AND NEW.status = 'ongoing' THEN
        alert_id := generate_utility_conflict_alert(
            'power',
            NEW.feeder_id,
            NEW.feeder_name,
            NEW.interruption_start
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS power_outage_impact_alert ON power_interruptions;
CREATE TRIGGER power_outage_impact_alert
AFTER INSERT ON power_interruptions
FOR EACH ROW EXECUTE FUNCTION trigger_power_outage_check();

-- Trigger: Auto-detect water outage impact
CREATE OR REPLACE FUNCTION trigger_water_outage_check()
RETURNS TRIGGER AS $$
DECLARE
    alert_id UUID;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'ongoing' THEN
        alert_id := generate_utility_conflict_alert(
            'water',
            NEW.facility_id,
            (SELECT name FROM water_facilities WHERE id = NEW.facility_id),
            NEW.interruption_start
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS water_outage_impact_alert ON water_interruptions;
CREATE TRIGGER water_outage_impact_alert
AFTER INSERT ON water_interruptions
FOR EACH ROW EXECUTE FUNCTION trigger_water_outage_check();

-- Function: Generate Concurrent Incident Alerts
CREATE OR REPLACE FUNCTION generate_concurrent_incident_alerts()
RETURNS VOID AS $$
DECLARE
    cluster RECORD;
BEGIN
    FOR cluster IN 
        SELECT * FROM detect_concurrent_incidents(30, 2.0)
    LOOP
        INSERT INTO conflict_alerts (
            alert_type,
            severity,
            title,
            description,
            metadata,
            status
        ) VALUES (
            'concurrent_incidents',
            CASE 
                WHEN cluster.incident_count >= 5 THEN 'critical'
                WHEN cluster.incident_count >= 3 THEN 'high'
                ELSE 'medium'
            END,
            cluster.incident_count || ' Incidents in Same Area',
            cluster.incident_count || ' incidents reported within 2km radius: ' || 
            array_to_string(cluster.categories, ', '),
            jsonb_build_object(
                'cluster_id', cluster.cluster_id,
                'incident_count', cluster.incident_count,
                'categories', cluster.categories,
                'center_lat', cluster.center_lat,
                'center_lng', cluster.center_lng,
                'detection_time', NOW()
            ),
            'active'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Sample dependency data (customize based on actual facilities)
COMMENT ON TABLE agency_dependencies IS 'Defines which facilities depend on which utilities';
COMMENT ON TABLE conflict_alerts IS 'System-generated alerts for inter-agency coordination';
COMMENT ON TABLE inter_agency_notifications IS 'Messages between agencies for coordination';
COMMENT ON FUNCTION check_power_to_water_impact IS 'Identifies water facilities affected by power outage';
COMMENT ON FUNCTION check_hospital_utility_dependencies IS 'Identifies hospitals affected by utility outage';
COMMENT ON FUNCTION detect_concurrent_incidents IS 'Detects clusters of incidents happening simultaneously';
COMMENT ON FUNCTION generate_utility_conflict_alert IS 'Creates alert when utility outage affects critical facilities';
