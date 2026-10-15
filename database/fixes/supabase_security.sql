-- Security Hardening for CLIMA

-- Enable MFA (Multi-Factor Authentication) support
-- Note: MFA is managed through Supabase Auth settings in dashboard
-- This SQL sets up additional security tables and policies

-- Rate Limiting Table (track login attempts)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT FALSE,
    attempt_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(user_email);
CREATE INDEX idx_login_attempts_time ON login_attempts(attempt_time);

-- Session Tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Email Verification Tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Events Log
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- login_failed, login_success, password_changed, mfa_enabled, suspicious_activity
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    severity TEXT DEFAULT 'info', -- info, warning, critical
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_time ON security_events(created_at);
CREATE INDEX idx_security_events_user ON security_events(user_id);

-- Enable RLS
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins read login_attempts" ON login_attempts;
CREATE POLICY "Admins read login_attempts" ON login_attempts FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Users manage own sessions" ON user_sessions;
CREATE POLICY "Users manage own sessions" ON user_sessions FOR ALL USING (
    auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users manage own verification" ON email_verification_tokens;
CREATE POLICY "Users manage own verification" ON email_verification_tokens FOR ALL USING (
    auth.uid() = user_id
);

DROP POLICY IF EXISTS "Admins read security_events" ON security_events;
CREATE POLICY "Admins read security_events" ON security_events FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

-- Function: Check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
    user_email_param TEXT,
    max_attempts INT DEFAULT 5,
    window_minutes INT DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INT;
BEGIN
    SELECT COUNT(*) INTO attempt_count
    FROM login_attempts
    WHERE 
        user_email = user_email_param
        AND success = FALSE
        AND attempt_time > NOW() - (window_minutes || ' minutes')::INTERVAL;

    RETURN attempt_count < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log security event
CREATE OR REPLACE FUNCTION log_security_event(
    event_type_param TEXT,
    user_id_param UUID,
    user_email_param TEXT,
    ip_address_param TEXT,
    user_agent_param TEXT,
    severity_param TEXT DEFAULT 'info',
    details_param JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (
        event_type,
        user_id,
        user_email,
        ip_address,
        user_agent,
        severity,
        details
    ) VALUES (
        event_type_param,
        user_id_param,
        user_email_param,
        ip_address_param,
        user_agent_param,
        severity_param,
        details_param
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean up expired verification tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM email_verification_tokens
    WHERE expires_at < NOW() AND verified = FALSE;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Detect suspicious login activity
CREATE OR REPLACE FUNCTION detect_suspicious_login(
    user_id_param UUID,
    new_ip TEXT,
    new_user_agent TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    recent_ips TEXT[];
    different_location BOOLEAN := FALSE;
BEGIN
    -- Get recent IP addresses for this user
    SELECT ARRAY_AGG(DISTINCT ip_address) INTO recent_ips
    FROM user_sessions
    WHERE 
        user_id = user_id_param
        AND last_activity > NOW() - INTERVAL '7 days'
    LIMIT 5;

    -- If new IP is not in recent IPs, flag as suspicious
    IF recent_ips IS NOT NULL AND NOT (new_ip = ANY(recent_ips)) THEN
        different_location := TRUE;

        -- Log security event
        PERFORM log_security_event(
            'suspicious_activity',
            user_id_param,
            NULL,
            new_ip,
            new_user_agent,
            'warning',
            jsonb_build_object(
                'reason', 'login_from_new_location',
                'previous_ips', recent_ips
            )
        );
    END IF;

    RETURN different_location;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-cleanup old login attempts (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM login_attempts
    WHERE attempt_time < NOW() - INTERVAL '30 days';
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_login_attempts_trigger ON login_attempts;
CREATE TRIGGER cleanup_login_attempts_trigger
AFTER INSERT ON login_attempts
EXECUTE FUNCTION cleanup_old_login_attempts();

-- Scheduled job to clean up expired sessions (run daily via cron or scheduled task)
-- Example cron: SELECT cleanup_expired_sessions();
-- Example cron: SELECT cleanup_expired_tokens();

-- Password Policy (enforce via application logic)
COMMENT ON TABLE security_events IS 'Logs all security-related events for audit trail';
COMMENT ON FUNCTION check_rate_limit IS 'Checks if user has exceeded login attempt rate limit';
COMMENT ON FUNCTION detect_suspicious_login IS 'Detects logins from unusual locations';

-- Additional security recommendations:
-- 1. Enable Supabase Auth MFA in dashboard settings
-- 2. Configure email verification required in Supabase Auth settings
-- 3. Set password strength requirements in Supabase Auth settings
-- 4. Enable CAPTCHA for signup/login in Supabase Auth settings
-- 5. Configure session timeout in Supabase Auth settings
-- 6. Enable audit logging in Supabase dashboard
-- 7. Set up alerts for suspicious activities
-- 8. Implement HTTPS only in production
-- 9. Use secure cookie settings in client
-- 10. Implement Content Security Policy headers

-- Row Level Security Audit
-- Verify all tables have RLS enabled:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = FALSE;

-- Should return empty if all tables have RLS enabled
