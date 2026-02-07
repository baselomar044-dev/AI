-- ============================================
-- 🗄️ TRY-IT! DATABASE SCHEMA
-- ============================================
-- Complete schema for cost tracking, analytics,
-- and smart routing data persistence
-- ============================================

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. API PROVIDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS api_providers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    base_url VARCHAR(500),
    auth_type VARCHAR(50) DEFAULT 'bearer', -- bearer, api_key, oauth2
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default providers
INSERT INTO api_providers (id, name, display_name, base_url, auth_type) VALUES
    ('groq', 'Groq', 'Groq', 'https://api.groq.com', 'bearer'),
    ('gemini', 'Google Gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com', 'api_key'),
    ('openrouter', 'OpenRouter', 'OpenRouter', 'https://openrouter.ai', 'bearer'),
    ('mistral', 'Mistral AI', 'Mistral AI', 'https://api.mistral.ai', 'bearer'),
    ('cohere', 'Cohere', 'Cohere', 'https://api.cohere.ai', 'bearer'),
    ('replicate', 'Replicate', 'Replicate', 'https://api.replicate.com', 'token'),
    ('elevenlabs', 'ElevenLabs', 'ElevenLabs', 'https://api.elevenlabs.io', 'api_key'),
    ('e2b', 'E2B', 'E2B Sandbox', 'https://api.e2b.dev', 'api_key'),
    ('firecrawl', 'Firecrawl', 'Firecrawl', 'https://api.firecrawl.dev', 'bearer'),
    ('tavily', 'Tavily', 'Tavily Search', 'https://api.tavily.com', 'api_key'),
    ('resend', 'Resend', 'Resend Email', 'https://api.resend.com', 'bearer')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. API MODELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS api_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id VARCHAR(50) REFERENCES api_providers(id) ON DELETE CASCADE,
    model_name VARCHAR(200) NOT NULL,
    display_name VARCHAR(200),
    category VARCHAR(50) NOT NULL, -- chat, vision, image_gen, audio_tts, audio_stt, code_exec, search, scrape, email
    
    -- Pricing (per 1K tokens or per request)
    input_price_per_1k DECIMAL(12, 8) DEFAULT 0,
    output_price_per_1k DECIMAL(12, 8) DEFAULT 0,
    price_per_request DECIMAL(12, 8) DEFAULT 0,
    price_per_minute DECIMAL(12, 8) DEFAULT 0,
    price_per_character DECIMAL(12, 8) DEFAULT 0,
    price_per_image DECIMAL(12, 8) DEFAULT 0,
    
    -- Free tier
    free_quota INTEGER DEFAULT 0,
    free_quota_unit VARCHAR(50), -- requests, tokens, minutes, characters
    
    -- Capabilities
    max_tokens INTEGER DEFAULT 4096,
    context_window INTEGER DEFAULT 8192,
    supports_streaming BOOLEAN DEFAULT false,
    supports_arabic BOOLEAN DEFAULT false,
    supports_vision BOOLEAN DEFAULT false,
    
    -- Quality scores (1-10)
    quality_score INTEGER DEFAULT 5,
    speed_score INTEGER DEFAULT 5,
    cost_score INTEGER DEFAULT 5,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider_id, model_name)
);

-- Create index for faster lookups
CREATE INDEX idx_api_models_provider ON api_models(provider_id);
CREATE INDEX idx_api_models_category ON api_models(category);

-- ============================================
-- 3. USAGE RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Request info
    provider_id VARCHAR(50) REFERENCES api_providers(id),
    model_name VARCHAR(200) NOT NULL,
    task_category VARCHAR(50) NOT NULL,
    task_type VARCHAR(50),
    
    -- User/Session tracking
    user_id VARCHAR(100),
    session_id VARCHAR(100),
    
    -- Token usage
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    
    -- Other metrics
    request_count INTEGER DEFAULT 1,
    audio_minutes DECIMAL(10, 4) DEFAULT 0,
    characters_count INTEGER DEFAULT 0,
    images_count INTEGER DEFAULT 0,
    
    -- Cost
    calculated_cost DECIMAL(12, 8) NOT NULL DEFAULT 0,
    
    -- Performance
    latency_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Metadata
    request_metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_usage_records_provider ON usage_records(provider_id);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at);
CREATE INDEX idx_usage_records_user ON usage_records(user_id);
CREATE INDEX idx_usage_records_category ON usage_records(task_category);
CREATE INDEX idx_usage_records_success ON usage_records(success);

-- Composite index for time-based analytics
CREATE INDEX idx_usage_records_time_provider ON usage_records(created_at, provider_id);

-- ============================================
-- 4. BUDGET CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS budget_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) DEFAULT 'default',
    
    daily_limit DECIMAL(10, 2) DEFAULT 10.00,
    monthly_limit DECIMAL(10, 2) DEFAULT 100.00,
    alert_threshold DECIMAL(3, 2) DEFAULT 0.80, -- 0-1
    
    -- Per-provider limits (JSONB)
    provider_limits JSONB DEFAULT '{}',
    
    -- Per-category limits (JSONB)
    category_limits JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Insert default budget
INSERT INTO budget_config (user_id, daily_limit, monthly_limit, alert_threshold)
VALUES ('default', 10.00, 100.00, 0.80)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 5. COST ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cost_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) DEFAULT 'default',
    
    alert_type VARCHAR(50) NOT NULL, -- budget_warning, budget_exceeded, rate_limit, high_cost_request
    message TEXT NOT NULL,
    
    threshold DECIMAL(3, 2),
    current_value DECIMAL(12, 8),
    
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for unacknowledged alerts
CREATE INDEX idx_cost_alerts_unacknowledged ON cost_alerts(user_id, acknowledged) WHERE acknowledged = false;

-- ============================================
-- 6. PROVIDER HEALTH TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS provider_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id VARCHAR(50) REFERENCES api_providers(id),
    model_name VARCHAR(200),
    
    failure_count INTEGER DEFAULT 0,
    last_failure TIMESTAMP WITH TIME ZONE,
    last_success TIMESTAMP WITH TIME ZONE,
    
    avg_latency_ms INTEGER DEFAULT 0,
    latency_samples JSONB DEFAULT '[]', -- Last 100 latencies
    
    is_healthy BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider_id, model_name)
);

-- ============================================
-- 7. ROUTING DECISIONS TABLE (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS routing_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    input_hash VARCHAR(64), -- Hash of input for caching
    task_type VARCHAR(50),
    
    selected_provider VARCHAR(50),
    selected_model VARCHAR(200),
    
    priority VARCHAR(20), -- quality, cost, speed, balanced
    confidence DECIMAL(3, 2),
    
    fallbacks JSONB DEFAULT '[]',
    scores JSONB, -- { quality, speed, cost, combined }
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for routing analytics
CREATE INDEX idx_routing_decisions_provider ON routing_decisions(selected_provider);
CREATE INDEX idx_routing_decisions_task ON routing_decisions(task_type);

-- ============================================
-- 8. DAILY AGGREGATES TABLE (for fast queries)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    user_id VARCHAR(100) DEFAULT 'default',
    
    -- Totals
    total_cost DECIMAL(12, 8) DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- By provider (JSONB)
    by_provider JSONB DEFAULT '{}',
    
    -- By category (JSONB)
    by_category JSONB DEFAULT '{}',
    
    -- By model (JSONB)
    by_model JSONB DEFAULT '{}',
    
    -- Performance
    avg_latency_ms INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(date, user_id)
);

-- Create index for date range queries
CREATE INDEX idx_daily_aggregates_date ON daily_aggregates(date);

-- ============================================
-- 9. API KEYS TABLE (encrypted storage)
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) DEFAULT 'default',
    provider_id VARCHAR(50) REFERENCES api_providers(id),
    
    -- Encrypted key (use application-level encryption)
    encrypted_key TEXT NOT NULL,
    key_prefix VARCHAR(10), -- First few chars for identification
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    last_verified TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    name VARCHAR(100), -- User-friendly name
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, provider_id)
);

-- ============================================
-- 10. VIEWS FOR ANALYTICS
-- ============================================

-- View: Current day summary
CREATE OR REPLACE VIEW v_daily_summary AS
SELECT 
    provider_id,
    task_category,
    COUNT(*) as request_count,
    SUM(calculated_cost) as total_cost,
    SUM(total_tokens) as total_tokens,
    AVG(latency_ms) as avg_latency,
    SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as success_rate
FROM usage_records
WHERE created_at >= CURRENT_DATE
GROUP BY provider_id, task_category;

-- View: Provider performance
CREATE OR REPLACE VIEW v_provider_performance AS
SELECT 
    provider_id,
    COUNT(*) as total_requests,
    SUM(calculated_cost) as total_cost,
    AVG(latency_ms) as avg_latency,
    SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) as success_rate,
    MAX(created_at) as last_used
FROM usage_records
GROUP BY provider_id;

-- View: Cost trends (last 30 days)
CREATE OR REPLACE VIEW v_cost_trends AS
SELECT 
    DATE(created_at) as date,
    provider_id,
    SUM(calculated_cost) as daily_cost,
    COUNT(*) as daily_requests
FROM usage_records
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), provider_id
ORDER BY date DESC;

-- ============================================
-- 11. FUNCTIONS
-- ============================================

-- Function: Calculate cost for a request
CREATE OR REPLACE FUNCTION calculate_request_cost(
    p_provider_id VARCHAR(50),
    p_model_name VARCHAR(200),
    p_input_tokens INTEGER DEFAULT 0,
    p_output_tokens INTEGER DEFAULT 0,
    p_request_count INTEGER DEFAULT 1,
    p_audio_minutes DECIMAL DEFAULT 0,
    p_characters INTEGER DEFAULT 0,
    p_images INTEGER DEFAULT 0
) RETURNS DECIMAL(12, 8) AS $$
DECLARE
    v_cost DECIMAL(12, 8) := 0;
    v_model api_models%ROWTYPE;
BEGIN
    SELECT * INTO v_model 
    FROM api_models 
    WHERE provider_id = p_provider_id AND model_name = p_model_name;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Token-based
    v_cost := v_cost + (p_input_tokens / 1000.0) * COALESCE(v_model.input_price_per_1k, 0);
    v_cost := v_cost + (p_output_tokens / 1000.0) * COALESCE(v_model.output_price_per_1k, 0);
    
    -- Request-based
    v_cost := v_cost + p_request_count * COALESCE(v_model.price_per_request, 0);
    
    -- Audio
    v_cost := v_cost + p_audio_minutes * COALESCE(v_model.price_per_minute, 0);
    
    -- Characters (TTS)
    v_cost := v_cost + p_characters * COALESCE(v_model.price_per_character, 0);
    
    -- Images
    v_cost := v_cost + p_images * COALESCE(v_model.price_per_image, 0);
    
    RETURN v_cost;
END;
$$ LANGUAGE plpgsql;

-- Function: Update daily aggregates
CREATE OR REPLACE FUNCTION update_daily_aggregate() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_aggregates (date, user_id, total_cost, total_requests, total_tokens)
    VALUES (
        DATE(NEW.created_at),
        COALESCE(NEW.user_id, 'default'),
        NEW.calculated_cost,
        1,
        COALESCE(NEW.input_tokens, 0) + COALESCE(NEW.output_tokens, 0)
    )
    ON CONFLICT (date, user_id) DO UPDATE SET
        total_cost = daily_aggregates.total_cost + EXCLUDED.total_cost,
        total_requests = daily_aggregates.total_requests + 1,
        total_tokens = daily_aggregates.total_tokens + EXCLUDED.total_tokens,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update daily aggregates
CREATE TRIGGER tr_update_daily_aggregate
    AFTER INSERT ON usage_records
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_aggregate();

-- Function: Check budget and create alerts
CREATE OR REPLACE FUNCTION check_budget_alerts() RETURNS TRIGGER AS $$
DECLARE
    v_config budget_config%ROWTYPE;
    v_daily_cost DECIMAL(12, 8);
    v_monthly_cost DECIMAL(12, 8);
BEGIN
    -- Get budget config
    SELECT * INTO v_config 
    FROM budget_config 
    WHERE user_id = COALESCE(NEW.user_id, 'default');
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Calculate daily cost
    SELECT COALESCE(SUM(calculated_cost), 0) INTO v_daily_cost
    FROM usage_records
    WHERE user_id = COALESCE(NEW.user_id, 'default')
    AND created_at >= CURRENT_DATE;
    
    -- Calculate monthly cost
    SELECT COALESCE(SUM(calculated_cost), 0) INTO v_monthly_cost
    FROM usage_records
    WHERE user_id = COALESCE(NEW.user_id, 'default')
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Check daily budget
    IF v_daily_cost >= v_config.daily_limit THEN
        INSERT INTO cost_alerts (user_id, alert_type, message, threshold, current_value)
        VALUES (
            COALESCE(NEW.user_id, 'default'),
            'budget_exceeded',
            'Daily budget exceeded: $' || v_daily_cost::TEXT,
            1.0,
            v_daily_cost / v_config.daily_limit
        );
    ELSIF v_daily_cost >= v_config.daily_limit * v_config.alert_threshold THEN
        INSERT INTO cost_alerts (user_id, alert_type, message, threshold, current_value)
        VALUES (
            COALESCE(NEW.user_id, 'default'),
            'budget_warning',
            'Daily budget warning: $' || v_daily_cost::TEXT || ' / $' || v_config.daily_limit::TEXT,
            v_config.alert_threshold,
            v_daily_cost / v_config.daily_limit
        );
    END IF;
    
    -- Check monthly budget
    IF v_monthly_cost >= v_config.monthly_limit THEN
        INSERT INTO cost_alerts (user_id, alert_type, message, threshold, current_value)
        VALUES (
            COALESCE(NEW.user_id, 'default'),
            'budget_exceeded',
            'Monthly budget exceeded: $' || v_monthly_cost::TEXT,
            1.0,
            v_monthly_cost / v_config.monthly_limit
        );
    ELSIF v_monthly_cost >= v_config.monthly_limit * v_config.alert_threshold THEN
        INSERT INTO cost_alerts (user_id, alert_type, message, threshold, current_value)
        VALUES (
            COALESCE(NEW.user_id, 'default'),
            'budget_warning',
            'Monthly budget warning: $' || v_monthly_cost::TEXT || ' / $' || v_config.monthly_limit::TEXT,
            v_config.alert_threshold,
            v_monthly_cost / v_config.monthly_limit
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check budget on new usage
CREATE TRIGGER tr_check_budget
    AFTER INSERT ON usage_records
    FOR EACH ROW
    EXECUTE FUNCTION check_budget_alerts();

-- ============================================
-- 12. CLEANUP JOBS (run periodically)
-- ============================================

-- Function: Clean old data (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Delete old usage records
    DELETE FROM usage_records 
    WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    -- Delete old acknowledged alerts
    DELETE FROM cost_alerts 
    WHERE acknowledged = true 
    AND created_at < CURRENT_DATE - INTERVAL '30 days';
    
    -- Delete old routing decisions
    DELETE FROM routing_decisions 
    WHERE created_at < CURRENT_DATE - INTERVAL '7 days';
    
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS (adjust as needed)
-- ============================================
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;
