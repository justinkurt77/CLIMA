-- PHASE 4: Facebook Integration Module

-- Facebook Configuration Table
CREATE TABLE IF NOT EXISTS facebook_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id TEXT NOT NULL,
    page_access_token TEXT NOT NULL,
    app_id TEXT NOT NULL,
    app_secret TEXT NOT NULL,
    verify_token TEXT NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facebook Posts/Comments Table
CREATE TABLE IF NOT EXISTS facebook_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fb_post_id TEXT UNIQUE NOT NULL,
    fb_comment_id TEXT,
    author_id TEXT,
    author_name TEXT,
    message TEXT,
    post_type TEXT, -- 'post', 'comment', 'mention'
    images TEXT[], -- Array of image URLs
    detected_keywords TEXT[], -- Keywords that triggered the alert
    detected_category TEXT, -- Auto-detected incident category
    sentiment_score FLOAT, -- -1 to 1 sentiment analysis
    lat FLOAT,
    lng FLOAT,
    location_text TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, converted
    moderation_reason TEXT,
    moderated_by UUID REFERENCES auth.users(id),
    moderated_at TIMESTAMPTZ,
    converted_to_report_id UUID,
    fb_created_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keyword Detection Configuration
CREATE TABLE IF NOT EXISTS facebook_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL,
    category TEXT NOT NULL, -- Maps to incident categories
    priority INT DEFAULT 1, -- 1=high, 2=medium, 3=low
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default keywords
INSERT INTO facebook_keywords (keyword, category, priority) VALUES
    ('flood', 'Natural Disaster', 1),
    ('flooding', 'Natural Disaster', 1),
    ('baha', 'Natural Disaster', 1),
    ('fire', 'Fire', 1),
    ('sunog', 'Fire', 1),
    ('apoy', 'Fire', 1),
    ('accident', 'Traffic', 2),
    ('aksidente', 'Traffic', 2),
    ('traffic', 'Traffic', 2),
    ('brownout', 'Utilities', 2),
    ('power outage', 'Utilities', 2),
    ('walang kuryente', 'Utilities', 2),
    ('no water', 'Utilities', 2),
    ('walang tubig', 'Utilities', 2),
    ('emergency', 'Emergency', 1),
    ('help', 'Emergency', 1),
    ('tulong', 'Emergency', 1),
    ('garbage', 'Sanitation', 3),
    ('basura', 'Sanitation', 3),
    ('pothole', 'Infrastructure', 2),
    ('butas', 'Infrastructure', 2),
    ('street light', 'Utilities', 3),
    ('ilaw', 'Utilities', 3)
ON CONFLICT DO NOTHING;

-- Facebook Auto-Publish Queue
CREATE TABLE IF NOT EXISTS facebook_autopublish (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisory_id UUID REFERENCES advisories(id) ON DELETE CASCADE,
    fb_post_id TEXT, -- FB post ID after publishing
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- pending, published, failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE facebook_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_autopublish ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can read/manage all FB data
DROP POLICY IF EXISTS "Admins manage facebook_config" ON facebook_config;
CREATE POLICY "Admins manage facebook_config" ON facebook_config FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Admins manage facebook_posts" ON facebook_posts;
CREATE POLICY "Admins manage facebook_posts" ON facebook_posts FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Admins manage facebook_keywords" ON facebook_keywords;
CREATE POLICY "Admins manage facebook_keywords" ON facebook_keywords FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

DROP POLICY IF EXISTS "Admins manage facebook_autopublish" ON facebook_autopublish;
CREATE POLICY "Admins manage facebook_autopublish" ON facebook_autopublish FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('superadmin', 'admin')
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_facebook_config_updated_at ON facebook_config;
CREATE TRIGGER update_facebook_config_updated_at
BEFORE UPDATE ON facebook_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facebook_posts_updated_at ON facebook_posts;
CREATE TRIGGER update_facebook_posts_updated_at
BEFORE UPDATE ON facebook_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit Logs
DROP TRIGGER IF EXISTS facebook_posts_audit ON facebook_posts;
CREATE TRIGGER facebook_posts_audit
AFTER INSERT OR UPDATE OR DELETE ON facebook_posts
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Function: Auto-detect category from keywords
CREATE OR REPLACE FUNCTION detect_category_from_keywords(message_text TEXT)
RETURNS TABLE(category TEXT, keywords TEXT[]) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fk.category,
        ARRAY_AGG(DISTINCT fk.keyword ORDER BY fk.keyword) AS keywords
    FROM facebook_keywords fk
    WHERE 
        fk.is_active = TRUE
        AND LOWER(message_text) LIKE '%' || LOWER(fk.keyword) || '%'
    GROUP BY fk.category
    ORDER BY MIN(fk.priority) ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Webhook verification helper
CREATE OR REPLACE FUNCTION verify_facebook_webhook(
    verify_token_param TEXT,
    hub_mode TEXT,
    hub_verify_token TEXT,
    hub_challenge TEXT
)
RETURNS TEXT AS $$
DECLARE
    config_verify_token TEXT;
BEGIN
    -- Get the stored verify token
    SELECT verify_token INTO config_verify_token
    FROM facebook_config
    WHERE is_active = TRUE
    LIMIT 1;

    -- Verify the webhook
    IF hub_mode = 'subscribe' AND hub_verify_token = config_verify_token THEN
        RETURN hub_challenge;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE facebook_posts IS 'Stores Facebook posts and comments detected by keyword monitoring';
COMMENT ON TABLE facebook_keywords IS 'Keywords to monitor on Facebook for auto-detection';
COMMENT ON TABLE facebook_autopublish IS 'Queue for auto-publishing advisories to Facebook';
COMMENT ON FUNCTION detect_category_from_keywords IS 'Auto-detects incident category from message text based on keywords';
