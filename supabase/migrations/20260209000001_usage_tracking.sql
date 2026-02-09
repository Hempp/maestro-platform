-- ============================================================================
-- USAGE TRACKING TABLE
-- Tracks feature usage for subscription limits
-- ============================================================================

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Usage period (monthly billing cycle)
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Feature usage counters
  tutor_sessions INTEGER DEFAULT 0,
  agent_executions INTEGER DEFAULT 0,
  skill_uses INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One record per user per period
  CONSTRAINT unique_user_period UNIQUE (user_id, period_start)
);

-- Create indexes
CREATE INDEX idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- Enable RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage usage (for API updates)
CREATE POLICY "Service role full access"
  ON usage_tracking
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create current period usage record
CREATE OR REPLACE FUNCTION get_or_create_usage(p_user_id UUID)
RETURNS usage_tracking AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_record usage_tracking;
BEGIN
  -- Calculate current period (monthly, aligned to subscription start if exists)
  SELECT
    COALESCE(
      (SELECT DATE(current_period_start) FROM subscriptions
       WHERE user_id = p_user_id AND status = 'active' LIMIT 1),
      DATE_TRUNC('month', CURRENT_DATE)::DATE
    ),
    COALESCE(
      (SELECT DATE(current_period_end) FROM subscriptions
       WHERE user_id = p_user_id AND status = 'active' LIMIT 1),
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE
    )
  INTO v_period_start, v_period_end;

  -- Try to get existing record
  SELECT * INTO v_record
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND period_start = v_period_start;

  -- Create if not exists
  IF v_record IS NULL THEN
    INSERT INTO usage_tracking (user_id, period_start, period_end)
    VALUES (p_user_id, v_period_start, v_period_end)
    RETURNING * INTO v_record;
  END IF;

  RETURN v_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment tutor sessions
CREATE OR REPLACE FUNCTION increment_tutor_sessions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_usage usage_tracking;
BEGIN
  v_usage := get_or_create_usage(p_user_id);

  UPDATE usage_tracking
  SET
    tutor_sessions = tutor_sessions + 1,
    updated_at = now()
  WHERE id = v_usage.id
  RETURNING tutor_sessions INTO v_usage.tutor_sessions;

  RETURN v_usage.tutor_sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment agent executions
CREATE OR REPLACE FUNCTION increment_agent_executions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_usage usage_tracking;
BEGIN
  v_usage := get_or_create_usage(p_user_id);

  UPDATE usage_tracking
  SET
    agent_executions = agent_executions + 1,
    updated_at = now()
  WHERE id = v_usage.id
  RETURNING agent_executions INTO v_usage.agent_executions;

  RETURN v_usage.agent_executions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment skill uses
CREATE OR REPLACE FUNCTION increment_skill_uses(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_usage usage_tracking;
BEGIN
  v_usage := get_or_create_usage(p_user_id);

  UPDATE usage_tracking
  SET
    skill_uses = skill_uses + 1,
    updated_at = now()
  WHERE id = v_usage.id
  RETURNING skill_uses INTO v_usage.skill_uses;

  RETURN v_usage.skill_uses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id UUID)
RETURNS TABLE(
  tutor_sessions INTEGER,
  agent_executions INTEGER,
  skill_uses INTEGER,
  period_start DATE,
  period_end DATE
) AS $$
DECLARE
  v_usage usage_tracking;
BEGIN
  v_usage := get_or_create_usage(p_user_id);

  RETURN QUERY
  SELECT
    v_usage.tutor_sessions,
    v_usage.agent_executions,
    v_usage.skill_uses,
    v_usage.period_start,
    v_usage.period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE usage_tracking IS 'Tracks monthly feature usage for subscription limits';
