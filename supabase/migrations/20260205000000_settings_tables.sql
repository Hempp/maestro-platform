-- ═══════════════════════════════════════════════════════════════════════════
-- SETTINGS TABLES MIGRATION
-- User preferences and platform-wide configuration
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE learning_pace AS ENUM ('relaxed', 'standard', 'intensive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE theme_preference AS ENUM ('dark', 'light', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE profile_visibility AS ENUM ('public', 'private', 'connections');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE font_size_preference AS ENUM ('small', 'medium', 'large');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- USER SETTINGS TABLE
-- Individual user preferences and configuration
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Profile
  display_name TEXT,
  bio TEXT,

  -- Notifications
  email_notifications BOOLEAN DEFAULT TRUE,
  learning_reminders BOOLEAN DEFAULT TRUE,
  community_activity BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,

  -- Learning Preferences
  learning_pace learning_pace DEFAULT 'standard',
  daily_goal_minutes INTEGER DEFAULT 30 CHECK (daily_goal_minutes >= 10 AND daily_goal_minutes <= 120),
  show_progress_on_profile BOOLEAN DEFAULT TRUE,

  -- Appearance
  theme theme_preference DEFAULT 'dark',

  -- Privacy & Security
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  profile_visibility profile_visibility DEFAULT 'public',
  show_activity_status BOOLEAN DEFAULT TRUE,
  allow_data_collection BOOLEAN DEFAULT TRUE,

  -- Accessibility
  reduced_motion BOOLEAN DEFAULT FALSE,
  high_contrast BOOLEAN DEFAULT FALSE,
  font_size font_size_preference DEFAULT 'medium',
  screen_reader_optimized BOOLEAN DEFAULT FALSE,

  -- Wallet (denormalized for quick access)
  wallet_connected BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- PLATFORM SETTINGS TABLE
-- Global platform configuration (admin-only)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL, -- 'platform', 'user_defaults', 'course', 'email', 'security', 'integration', 'branding', 'ai'
  description TEXT,
  is_secret BOOLEAN DEFAULT FALSE, -- For API keys, etc.
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by type
CREATE INDEX IF NOT EXISTS idx_platform_settings_type ON platform_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(setting_key);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- USER SESSIONS TABLE
-- Track active sessions for security management
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  device_info TEXT,
  ip_address INET,
  location TEXT,
  user_agent TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- WEBHOOKS TABLE
-- Platform webhook configurations
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'user.registered', 'course.completed', 'certificate.issued', etc.
  url TEXT NOT NULL,
  secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

-- User Settings: Users can only access their own settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_settings_select ON user_settings;
CREATE POLICY user_settings_select ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_settings_insert ON user_settings;
CREATE POLICY user_settings_insert ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_settings_update ON user_settings;
CREATE POLICY user_settings_update ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_settings_delete ON user_settings;
CREATE POLICY user_settings_delete ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- User Sessions: Users can only see their own sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_sessions_select ON user_sessions;
CREATE POLICY user_sessions_select ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_sessions_delete ON user_sessions;
CREATE POLICY user_sessions_delete ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Platform Settings: Read by all authenticated, write by admins only
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_settings_select ON platform_settings;
CREATE POLICY platform_settings_select ON platform_settings
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (is_secret = FALSE OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ))
  );

-- Webhooks: Admins only
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhooks_all ON webhooks;
CREATE POLICY webhooks_all ON webhooks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- DEFAULT PLATFORM SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO platform_settings (setting_key, setting_value, setting_type, description) VALUES
  ('platform_name', '"Phazur"', 'platform', 'Platform display name'),
  ('support_email', '"support@phazur.io"', 'platform', 'Support contact email'),
  ('default_timezone', '"America/New_York"', 'platform', 'Default timezone for the platform'),
  ('maintenance_mode', 'false', 'platform', 'Enable/disable maintenance mode'),

  ('default_role', '"learner"', 'user_defaults', 'Default role for new users'),
  ('auto_approve_signups', 'true', 'user_defaults', 'Auto-approve new registrations'),
  ('require_email_verification', 'true', 'user_defaults', 'Require email verification'),
  ('session_timeout_minutes', '60', 'user_defaults', 'Session timeout in minutes'),

  ('allow_self_enrollment', 'true', 'course', 'Allow users to self-enroll in courses'),
  ('require_prerequisites', 'false', 'course', 'Enforce prerequisite completion'),
  ('default_visibility', '"public"', 'course', 'Default course visibility'),
  ('auto_generate_certificates', 'true', 'course', 'Auto-issue certificates on completion'),

  ('notify_on_new_user', 'true', 'email', 'Send notification on new user registration'),
  ('notify_on_course_completion', 'true', 'email', 'Send notification on course completion'),
  ('notify_on_support', 'true', 'email', 'Send notification on support tickets'),

  ('require_2fa', 'false', 'security', 'Require 2FA for all users'),
  ('min_password_length', '8', 'security', 'Minimum password length'),
  ('require_special_chars', 'true', 'security', 'Require special characters in passwords'),
  ('api_rate_limit', '100', 'security', 'API rate limit per minute'),

  ('blockchain_enabled', 'false', 'integration', 'Enable blockchain/SBT features'),
  ('analytics_enabled', 'true', 'integration', 'Enable analytics'),
  ('payment_gateway_configured', 'false', 'integration', 'Payment gateway status'),

  ('primary_color', '"#06b6d4"', 'branding', 'Primary brand color'),
  ('secondary_color', '"#a855f7"', 'branding', 'Secondary brand color'),

  ('ai_model', '"gpt-4-turbo"', 'ai', 'Default AI model'),
  ('ai_monthly_token_limit', '1000000', 'ai', 'Monthly AI token budget')
ON CONFLICT (setting_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: Auto-create user settings on user creation
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id, display_name)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_settings ON users;
CREATE TRIGGER on_user_created_settings
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings_on_signup();
