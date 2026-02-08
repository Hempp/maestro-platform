-- ═══════════════════════════════════════════════════════════════════════════
-- RETENTION EMAILS TRACKING
-- Tracks which retention emails have been sent to users
-- ═══════════════════════════════════════════════════════════════════════════

-- Create enum for retention email types
DO $$ BEGIN
  CREATE TYPE retention_email_type AS ENUM ('day_1', 'day_3', 'day_7');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RETENTION EMAILS TABLE
-- Tracks sent retention emails to prevent duplicates
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS retention_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  email_type retention_email_type NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  resend_id TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  UNIQUE(user_id, email_type)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_retention_emails_user_id ON retention_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_retention_emails_email_type ON retention_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_retention_emails_sent_at ON retention_emails(sent_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE retention_emails ENABLE ROW LEVEL SECURITY;

-- Users can view their own retention email records
DROP POLICY IF EXISTS "Users can view own retention emails" ON retention_emails;
CREATE POLICY "Users can view own retention emails" ON retention_emails
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (cron job runs with service role)
DROP POLICY IF EXISTS "Service role can manage retention emails" ON retention_emails;
CREATE POLICY "Service role can manage retention emails" ON retention_emails
  FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTION
-- Get users eligible for retention emails
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_retention_email_candidates(
  p_email_type retention_email_type,
  p_days_since_signup INTEGER,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ,
  has_activity BOOLEAN,
  modules_completed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email,
    u.full_name,
    u.created_at,
    COALESCE(lp.last_activity_at > u.created_at + INTERVAL '1 hour', FALSE) as has_activity,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM aku_progress ap
      WHERE ap.user_id = u.id AND ap.status IN ('completed', 'verified')
    ), 0) as modules_completed
  FROM users u
  LEFT JOIN learner_profiles lp ON lp.user_id = u.id
  LEFT JOIN user_settings us ON us.user_id = u.id
  WHERE
    -- User signed up on the target day
    u.created_at >= NOW() - (p_days_since_signup || ' days')::INTERVAL - INTERVAL '1 hour'
    AND u.created_at < NOW() - (p_days_since_signup || ' days')::INTERVAL + INTERVAL '23 hours'
    -- Haven't received this email yet
    AND NOT EXISTS (
      SELECT 1 FROM retention_emails re
      WHERE re.user_id = u.id AND re.email_type = p_email_type
    )
    -- User hasn't disabled learning reminders (respect preferences)
    AND COALESCE(us.learning_reminders, TRUE) = TRUE
    AND COALESCE(us.email_notifications, TRUE) = TRUE
  ORDER BY u.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
