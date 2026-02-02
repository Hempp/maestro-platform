-- ═══════════════════════════════════════════════════════════════════════════
-- PHAZUR DATABASE SCHEMA
-- Safe migration that handles existing structures
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS (CREATE IF NOT EXISTS pattern)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE tier_type AS ENUM ('student', 'employee', 'owner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE aku_status AS ENUM ('not_started', 'in_progress', 'completed', 'verified');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE session_type AS ENUM ('onboarding', 'learning', 'support');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sandbox_status AS ENUM ('idle', 'running', 'success', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE terminal_status AS ENUM ('success', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS TABLE
-- Extended profile for authenticated users
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  tier tier_type,
  wallet_address TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- LEARNER PROFILES
-- Detailed learning state and interaction patterns
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS learner_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tier tier_type NOT NULL,
  current_path TEXT DEFAULT 'foundation',
  interaction_dna JSONB DEFAULT '{}',
  struggle_score INTEGER DEFAULT 50 CHECK (struggle_score >= 0 AND struggle_score <= 100),
  total_learning_time INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

DROP TRIGGER IF EXISTS update_learner_profiles_updated_at ON learner_profiles;
CREATE TRIGGER update_learner_profiles_updated_at
  BEFORE UPDATE ON learner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- AKU PROGRESS
-- Track progress through Atomic Knowledge Units
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aku_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  aku_id TEXT NOT NULL,
  status aku_status DEFAULT 'not_started',
  hints_used INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  struggle_score INTEGER DEFAULT 50,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  workflow_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, aku_id)
);

CREATE INDEX IF NOT EXISTS idx_aku_progress_user_id ON aku_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_aku_progress_aku_id ON aku_progress(aku_id);
CREATE INDEX IF NOT EXISTS idx_aku_progress_status ON aku_progress(status);

DROP TRIGGER IF EXISTS update_aku_progress_updated_at ON aku_progress;
CREATE TRIGGER update_aku_progress_updated_at
  BEFORE UPDATE ON aku_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- CHAT SESSIONS
-- Conversation history with the AI tutor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_type session_type NOT NULL,
  messages JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_type ON chat_sessions(session_type);

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- CERTIFICATES
-- Blockchain-verified credentials (SBTs)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  certificate_type tier_type NOT NULL,
  token_id TEXT,
  contract_address TEXT,
  transaction_hash TEXT,
  ipfs_hash TEXT,
  metadata JSONB DEFAULT '{}',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  UNIQUE(user_id, certificate_type)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);

-- Conditionally create token_id index only if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'certificates' AND column_name = 'token_id') THEN
    CREATE INDEX IF NOT EXISTS idx_certificates_token_id ON certificates(token_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SANDBOX SESSIONS
-- Code execution history
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sandbox_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  aku_id TEXT,
  code TEXT NOT NULL,
  output JSONB,
  status sandbox_status DEFAULT 'idle',
  execution_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sandbox_sessions_user_id ON sandbox_sessions(user_id);

DROP TRIGGER IF EXISTS update_sandbox_sessions_updated_at ON sandbox_sessions;
CREATE TRIGGER update_sandbox_sessions_updated_at
  BEFORE UPDATE ON sandbox_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- TERMINAL HISTORY
-- Command execution logs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS terminal_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  command TEXT NOT NULL,
  output TEXT,
  status terminal_status DEFAULT 'success',
  execution_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terminal_history_user_id ON terminal_history(user_id);
CREATE INDEX IF NOT EXISTS idx_terminal_history_created_at ON terminal_history(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE aku_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_history ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Learner profiles policies
DROP POLICY IF EXISTS "Users can view own learner profile" ON learner_profiles;
CREATE POLICY "Users can view own learner profile" ON learner_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own learner profile" ON learner_profiles;
CREATE POLICY "Users can update own learner profile" ON learner_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own learner profile" ON learner_profiles;
CREATE POLICY "Users can insert own learner profile" ON learner_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AKU Progress policies
DROP POLICY IF EXISTS "Users can view own AKU progress" ON aku_progress;
CREATE POLICY "Users can view own AKU progress" ON aku_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own AKU progress" ON aku_progress;
CREATE POLICY "Users can manage own AKU progress" ON aku_progress
  FOR ALL USING (auth.uid() = user_id);

-- Chat sessions policies
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own chat sessions" ON chat_sessions;
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Certificates policies (public read for verification)
DROP POLICY IF EXISTS "Anyone can view certificates" ON certificates;
CREATE POLICY "Anyone can view certificates" ON certificates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only system can manage certificates" ON certificates;
CREATE POLICY "Only system can manage certificates" ON certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sandbox sessions policies
DROP POLICY IF EXISTS "Users can manage own sandbox sessions" ON sandbox_sessions;
CREATE POLICY "Users can manage own sandbox sessions" ON sandbox_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Terminal history policies
DROP POLICY IF EXISTS "Users can manage own terminal history" ON terminal_history;
CREATE POLICY "Users can manage own terminal history" ON terminal_history
  FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update streak on activity
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_activity DATE;
  v_today DATE;
BEGIN
  SELECT last_activity_at::date INTO v_last_activity
  FROM learner_profiles WHERE user_id = p_user_id;

  v_today := CURRENT_DATE;

  IF v_last_activity IS NULL OR v_last_activity < v_today - INTERVAL '1 day' THEN
    UPDATE learner_profiles
    SET current_streak = 1, last_activity_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF v_last_activity = v_today - INTERVAL '1 day' THEN
    UPDATE learner_profiles
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE learner_profiles SET last_activity_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- REALTIME (Enable for live features)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable realtime for chat_sessions (for live collaboration features)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
