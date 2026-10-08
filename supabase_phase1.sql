-- PHASE 1: Database Expansion & Security

-- ==========================================
-- 1. AUDIT LOGS SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    actor_id UUID, -- Can be null if action done by system/guest
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to handle the automatic audit logging
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, actor_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD)::JSONB, auth.uid());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, actor_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, auth.uid());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_data, actor_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW)::JSONB, auth.uid());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS reports_audit ON reports;
CREATE TRIGGER reports_audit
AFTER INSERT OR UPDATE OR DELETE ON reports
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS departments_audit ON departments;
CREATE TRIGGER departments_audit
AFTER INSERT OR UPDATE OR DELETE ON departments
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

DROP TRIGGER IF EXISTS categories_audit ON categories;
CREATE TRIGGER categories_audit
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ==========================================
-- 2. ENHANCED ROW LEVEL SECURITY (AGENCY MANAGEMENT)
-- ==========================================
-- Ensure RLS is enabled on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Departments: Anyone can read, only superadmins can modify
DROP POLICY IF EXISTS "Public read departments" ON departments;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Superadmin modify departments" ON departments;
CREATE POLICY "Superadmin modify departments" ON departments FOR ALL 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin');

-- Categories: Anyone can read, only superadmins can modify
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Superadmin modify categories" ON categories;
CREATE POLICY "Superadmin modify categories" ON categories FOR ALL 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin');

-- Reports: Enhance existing policies for strict agency segregation
-- Superadmins can see/edit everything.
-- Agency Admins can only update reports assigned to their department.
DROP POLICY IF EXISTS "Agency admin update reports" ON reports;
CREATE POLICY "Agency admin update reports" ON reports FOR UPDATE
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'superadmin') OR
    (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') AND 
        (auth.jwt() -> 'user_metadata' ->> 'assigned_department' = (SELECT name FROM departments WHERE id = department_id))
    ) OR
    (auth.uid() = user_id)
);

-- Audit Logs: Only superadmins can read, no one can update/delete
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Superadmin read audit logs" ON audit_logs;
CREATE POLICY "Superadmin read audit logs" ON audit_logs FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin');

-- Allow insert by the trigger (handled automatically by SECURITY DEFINER on the function, but good to be explicit if accessed via API)
DROP POLICY IF EXISTS "System insert audit logs" ON audit_logs;
CREATE POLICY "System insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- ==========================================
-- 3. NOTIFICATION SERVICE PREPARATION
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id), -- Nullable if global
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system', -- 'alert', 'system', 'report_update'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications or global notifications (user_id IS NULL)
DROP POLICY IF EXISTS "Read notifications" ON notifications;
CREATE POLICY "Read notifications" ON notifications FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Only admins/system can insert notifications (via Edge Function)
DROP POLICY IF EXISTS "Insert notifications" ON notifications;
CREATE POLICY "Insert notifications" ON notifications FOR INSERT
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'superadmin'));
