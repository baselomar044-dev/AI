-- ============================================
-- 🗄️ TRY-IT! DATABASE SCHEMA
-- Supabase PostgreSQL
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==================== USERS ====================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'github'
  provider_id VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(50) DEFAULT 'darkBlue',
  refresh_token_hash VARCHAR(255), -- For token rotation & revocation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ -- Account lockout after failed attempts
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);

-- ==================== USER PERSONALITIES ====================

CREATE TABLE user_personalities (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Big Five traits (0-1)
  openness DECIMAL(3,2) DEFAULT 0.5,
  conscientiousness DECIMAL(3,2) DEFAULT 0.5,
  extraversion DECIMAL(3,2) DEFAULT 0.5,
  agreeableness DECIMAL(3,2) DEFAULT 0.5,
  neuroticism DECIMAL(3,2) DEFAULT 0.3,
  
  -- Communication style
  formality_level DECIMAL(3,2) DEFAULT 0.5,
  detail_preference DECIMAL(3,2) DEFAULT 0.5,
  humor_appreciation DECIMAL(3,2) DEFAULT 0.5,
  technical_level DECIMAL(3,2) DEFAULT 0.5,
  
  -- Language
  preferred_language VARCHAR(10) DEFAULT 'auto',
  dialect_preference VARCHAR(50),
  uses_emojis BOOLEAN DEFAULT TRUE,
  
  -- Interests
  topics TEXT[] DEFAULT '{}',
  expertise JSONB DEFAULT '{}',
  
  -- Behavioral patterns
  active_hours INTEGER[] DEFAULT '{}',
  average_message_length INTEGER DEFAULT 100,
  question_frequency DECIMAL(3,2) DEFAULT 0.5,
  
  -- Emotional
  current_mood VARCHAR(50) DEFAULT 'neutral',
  mood_history JSONB DEFAULT '[]',
  
  -- Relationship with AI
  trust_level DECIMAL(3,2) DEFAULT 0.5,
  dependency_level DECIMAL(3,2) DEFAULT 0.3,
  satisfaction_score DECIMAL(3,2) DEFAULT 0.7,
  
  interaction_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== CONVERSATIONS ====================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  agent_id VARCHAR(100) DEFAULT 'default',
  model VARCHAR(100),
  system_prompt TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- ==================== MESSAGES ====================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- model, tokens, latency, etc.
  attachments JSONB DEFAULT '[]', -- files, images
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For RAG
  embedding vector(768)
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_messages_embedding ON messages USING ivfflat (embedding vector_cosine_ops);

-- ==================== MEMORIES ====================

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'fact', 'preference', 'instruction', etc.
  content TEXT NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  importance DECIMAL(3,2) DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_importance ON memories(importance DESC);
CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops);

-- Memory search function
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  user_id_filter uuid
)
RETURNS SETOF memories
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM memories
  WHERE user_id = user_id_filter
    AND (expires_at IS NULL OR expires_at > NOW())
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY 1 - (embedding <=> query_embedding) DESC
  LIMIT match_count;
END;
$$;

-- ==================== INTEGRATIONS ====================

CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  integration_id VARCHAR(100) NOT NULL,
  credentials JSONB NOT NULL, -- encrypted
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, integration_id)
);

CREATE INDEX idx_integrations_user ON user_integrations(user_id);

-- ==================== AGENTS ====================

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  avatar_emoji VARCHAR(10),
  system_prompt TEXT NOT NULL,
  model VARCHAR(100),
  temperature DECIMAL(3,2) DEFAULT 0.7,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_public ON agents(is_public) WHERE is_public = TRUE;

-- ==================== TRIGGERS ====================

CREATE TABLE triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'schedule', 'webhook', 'email'
  config JSONB NOT NULL,
  action JSONB NOT NULL, -- what to do when triggered
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_triggers_user ON triggers(user_id);
CREATE INDEX idx_triggers_next_run ON triggers(next_run_at) WHERE is_active = TRUE;

-- ==================== FILES ====================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(255),
  size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_user ON files(user_id);

-- ==================== USAGE TRACKING ====================

CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  latency_ms INTEGER,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_user ON usage_logs(user_id);
CREATE INDEX idx_usage_created ON usage_logs(created_at);

-- Daily usage aggregation
CREATE TABLE daily_usage (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  provider VARCHAR(50) NOT NULL,
  request_count INTEGER DEFAULT 0,
  tokens_total BIGINT DEFAULT 0,
  cost_total DECIMAL(10,4) DEFAULT 0,
  PRIMARY KEY (user_id, date, provider)
);

-- ==================== COMPUTER USE SESSIONS ====================

CREATE TABLE computer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'starting',
  viewport_width INTEGER DEFAULT 1280,
  viewport_height INTEGER DEFAULT 720,
  current_url TEXT,
  last_screenshot TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_computer_sessions_user ON computer_sessions(user_id);

-- ==================== VOICE CALLS ====================

CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  duration_seconds INTEGER,
  transcript TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_voice_calls_user ON voice_calls(user_id);

-- ==================== ROW LEVEL SECURITY ====================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE computer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

-- Policies (users can only access their own data)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users own personalities" ON user_personalities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own conversations" ON conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own messages" ON messages FOR ALL USING (
  EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users own memories" ON memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own integrations" ON user_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own agents" ON agents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public agents viewable" ON agents FOR SELECT USING (is_public = TRUE);
CREATE POLICY "Users own triggers" ON triggers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own files" ON files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own usage" ON usage_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own daily usage" ON daily_usage FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own computer sessions" ON computer_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own voice calls" ON voice_calls FOR ALL USING (auth.uid() = user_id);

-- ==================== FUNCTIONS ====================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_personalities_updated_at BEFORE UPDATE ON user_personalities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_triggers_updated_at BEFORE UPDATE ON triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON user_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
