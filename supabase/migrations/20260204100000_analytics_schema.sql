-- ═══════════════════════════════════════════════════════════════════════════
-- PHAZUR ANALYTICS SCHEMA
-- Comprehensive analytics tracking for the learning platform
-- Tables: user_events, daily_user_metrics, cohort_metrics, content_metrics,
--         revenue_metrics, churn_risk_scores
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUMS FOR ANALYTICS
-- ─────────────────────────────────────────────────────────────────────────────

-- Event types enum for categorizing user interactions
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'page_view',
    'feature_use',
    'content_start',
    'content_complete',
    'content_pause',
    'content_resume',
    'session_join',
    'session_leave',
    'ai_interaction',
    'code_execute',
    'code_submit',
    'quiz_start',
    'quiz_complete',
    'certificate_earned',
    'streak_achieved',
    'level_up',
    'subscription_change',
    'login',
    'logout',
    'error'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Content types enum
DO $$ BEGIN
  CREATE TYPE content_type AS ENUM (
    'aku',
    'video',
    'article',
    'quiz',
    'exercise',
    'live_session',
    'sandbox',
    'project'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Subscription tier enum for revenue tracking
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'free',
    'student',
    'employee',
    'owner',
    'enterprise'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. USER_EVENTS TABLE
-- Track all user interactions for behavioral analytics
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core event data
  event_type event_type NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event metadata (flexible JSONB for event-specific data)
  -- Examples: {page: '/learn/aku-1', referrer: '/dashboard'}
  --          {content_id: 'aku-123', progress: 0.75, time_spent: 120}
  --          {session_id: 'uuid', meeting_type: 'live'}
  metadata JSONB DEFAULT '{}',

  -- Context
  session_id TEXT, -- Browser session identifier
  ip_hash TEXT,    -- Hashed IP for geographic analysis (privacy-preserving)
  user_agent TEXT, -- Browser/device info

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comments for documentation
COMMENT ON TABLE user_events IS 'Tracks all user interactions and behaviors on the platform for analytics purposes';
COMMENT ON COLUMN user_events.event_type IS 'Categorized event type (page_view, content_start, session_join, etc.)';
COMMENT ON COLUMN user_events.metadata IS 'Flexible JSONB for event-specific data like page path, content_id, progress, etc.';
COMMENT ON COLUMN user_events.session_id IS 'Browser session identifier for session-based analysis';
COMMENT ON COLUMN user_events.ip_hash IS 'Hashed IP address for geographic analysis while preserving privacy';

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_user_type_date ON user_events(user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_session ON user_events(session_id);

-- GIN index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_user_events_metadata ON user_events USING GIN (metadata);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DAILY_USER_METRICS TABLE
-- Aggregated daily metrics per user for trend analysis
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_user_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identification
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,

  -- Engagement metrics
  active_minutes INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,

  -- Learning metrics
  contents_started INTEGER DEFAULT 0,
  contents_completed INTEGER DEFAULT 0,
  akus_completed INTEGER DEFAULT 0,
  quizzes_attempted INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,

  -- Live session metrics
  sessions_attended INTEGER DEFAULT 0,
  session_minutes INTEGER DEFAULT 0,

  -- AI interaction metrics
  ai_interactions INTEGER DEFAULT 0,
  ai_questions_asked INTEGER DEFAULT 0,

  -- Code sandbox metrics
  code_executions INTEGER DEFAULT 0,
  code_submissions INTEGER DEFAULT 0,

  -- Performance indicators
  struggle_score_avg NUMERIC(5,2) DEFAULT 50.00,
  streak_maintained BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one row per user per day
  UNIQUE(user_id, date)
);

-- Comments for documentation
COMMENT ON TABLE daily_user_metrics IS 'Aggregated daily metrics per user for trend analysis and reporting';
COMMENT ON COLUMN daily_user_metrics.active_minutes IS 'Total active minutes on platform for the day';
COMMENT ON COLUMN daily_user_metrics.struggle_score_avg IS 'Average struggle score across all activities for the day (0-100)';
COMMENT ON COLUMN daily_user_metrics.ai_interactions IS 'Number of AI tutor interactions for the day';

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_daily_user_metrics_user_id ON daily_user_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_user_metrics_date ON daily_user_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_user_metrics_user_date ON daily_user_metrics(user_id, date DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_daily_user_metrics_updated_at ON daily_user_metrics;
CREATE TRIGGER update_daily_user_metrics_updated_at
  BEFORE UPDATE ON daily_user_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COHORT_METRICS TABLE
-- Track user cohorts for retention analysis
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cohort_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Cohort identification
  cohort_date DATE NOT NULL,              -- Start of cohort period (week/month start)
  cohort_type TEXT NOT NULL DEFAULT 'weekly' CHECK (cohort_type IN ('daily', 'weekly', 'monthly')),

  -- Cohort composition
  user_count INTEGER DEFAULT 0,
  tier_breakdown JSONB DEFAULT '{}',      -- {free: 100, student: 50, employee: 20}

  -- Retention metrics (number of users still active)
  retained_day_1 INTEGER DEFAULT 0,
  retained_day_3 INTEGER DEFAULT 0,
  retained_day_7 INTEGER DEFAULT 0,
  retained_day_14 INTEGER DEFAULT 0,
  retained_day_30 INTEGER DEFAULT 0,
  retained_day_60 INTEGER DEFAULT 0,
  retained_day_90 INTEGER DEFAULT 0,

  -- Retention percentages (computed for convenience)
  retention_pct_day_1 NUMERIC(5,2),
  retention_pct_day_7 NUMERIC(5,2),
  retention_pct_day_30 NUMERIC(5,2),

  -- Conversion metrics
  converted_to_paid INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2),

  -- Engagement averages for cohort
  avg_sessions_week_1 NUMERIC(5,2),
  avg_contents_completed_week_1 NUMERIC(5,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one row per cohort date/type combination
  UNIQUE(cohort_date, cohort_type)
);

-- Comments for documentation
COMMENT ON TABLE cohort_metrics IS 'Aggregated retention and conversion metrics by user signup cohort';
COMMENT ON COLUMN cohort_metrics.cohort_date IS 'Start date of the cohort period (beginning of week or month)';
COMMENT ON COLUMN cohort_metrics.tier_breakdown IS 'JSON breakdown of users by subscription tier at signup';
COMMENT ON COLUMN cohort_metrics.retained_day_7 IS 'Number of cohort users active 7 days after signup';

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_date ON cohort_metrics(cohort_date DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_type ON cohort_metrics(cohort_type);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_date_type ON cohort_metrics(cohort_date DESC, cohort_type);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_cohort_metrics_updated_at ON cohort_metrics;
CREATE TRIGGER update_cohort_metrics_updated_at
  BEFORE UPDATE ON cohort_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CONTENT_METRICS TABLE
-- Track content performance and engagement
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Content identification
  content_id TEXT NOT NULL,
  content_type content_type NOT NULL,
  content_title TEXT,                     -- Cached for convenience

  -- View metrics
  views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,

  -- Completion metrics
  starts INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2),           -- Computed: completions/starts * 100

  -- Time metrics
  total_time_spent INTEGER DEFAULT 0,     -- Total seconds across all users
  avg_time_spent INTEGER DEFAULT 0,       -- Average seconds per view
  median_time_spent INTEGER DEFAULT 0,

  -- Quality metrics
  avg_struggle_score NUMERIC(5,2),        -- Average struggle score (higher = more difficult)
  drop_off_count INTEGER DEFAULT 0,       -- Users who started but didn't complete
  drop_off_points JSONB DEFAULT '[]',     -- [{position: 0.25, count: 50}, {position: 0.5, count: 30}]

  -- Feedback metrics
  rating_count INTEGER DEFAULT 0,
  rating_avg NUMERIC(3,2),                -- 1-5 scale

  -- Tier breakdown
  views_by_tier JSONB DEFAULT '{}',       -- {free: 100, student: 200, employee: 50}
  completions_by_tier JSONB DEFAULT '{}',

  -- Time period (for time-series analysis)
  period_start DATE,                      -- NULL for all-time metrics
  period_end DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique content per period
  UNIQUE(content_id, content_type, period_start)
);

-- Comments for documentation
COMMENT ON TABLE content_metrics IS 'Aggregated performance metrics for learning content (AKUs, videos, quizzes, etc.)';
COMMENT ON COLUMN content_metrics.drop_off_points IS 'JSON array of positions where users commonly drop off';
COMMENT ON COLUMN content_metrics.avg_struggle_score IS 'Average struggle score indicating content difficulty (0-100)';
COMMENT ON COLUMN content_metrics.views_by_tier IS 'JSON breakdown of views by subscription tier';

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_content_metrics_content_id ON content_metrics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_metrics_type ON content_metrics(content_type);
CREATE INDEX IF NOT EXISTS idx_content_metrics_period ON content_metrics(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_content_metrics_completion_rate ON content_metrics(completion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_content_metrics_struggle ON content_metrics(avg_struggle_score DESC);

-- GIN indexes for JSONB
CREATE INDEX IF NOT EXISTS idx_content_metrics_drop_off ON content_metrics USING GIN (drop_off_points);
CREATE INDEX IF NOT EXISTS idx_content_metrics_views_tier ON content_metrics USING GIN (views_by_tier);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_content_metrics_updated_at ON content_metrics;
CREATE TRIGGER update_content_metrics_updated_at
  BEFORE UPDATE ON content_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. REVENUE_METRICS TABLE
-- Daily revenue tracking for financial analytics
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS revenue_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Time period
  date DATE NOT NULL,
  tier subscription_tier NOT NULL,

  -- Revenue metrics
  mrr NUMERIC(12,2) DEFAULT 0.00,         -- Monthly Recurring Revenue for this tier
  arr NUMERIC(14,2) DEFAULT 0.00,         -- Annual Recurring Revenue (MRR * 12)

  -- Subscription movements
  active_subscriptions INTEGER DEFAULT 0,
  new_subscriptions INTEGER DEFAULT 0,
  churned INTEGER DEFAULT 0,
  upgrades INTEGER DEFAULT 0,             -- Moved to this tier from lower
  downgrades INTEGER DEFAULT 0,           -- Moved to this tier from higher
  reactivations INTEGER DEFAULT 0,        -- Previously churned, now active

  -- Revenue breakdowns
  new_revenue NUMERIC(12,2) DEFAULT 0.00,
  expansion_revenue NUMERIC(12,2) DEFAULT 0.00,   -- Upgrades
  contraction_revenue NUMERIC(12,2) DEFAULT 0.00, -- Downgrades
  churned_revenue NUMERIC(12,2) DEFAULT 0.00,

  -- Calculated metrics
  net_revenue_change NUMERIC(12,2) DEFAULT 0.00,
  churn_rate NUMERIC(5,2),                -- Percentage
  growth_rate NUMERIC(5,2),               -- Month-over-month

  -- Customer metrics
  arpu NUMERIC(10,2),                     -- Average Revenue Per User
  ltv_estimate NUMERIC(12,2),             -- Lifetime Value estimate

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One row per date per tier
  UNIQUE(date, tier)
);

-- Comments for documentation
COMMENT ON TABLE revenue_metrics IS 'Daily revenue and subscription metrics by tier for financial reporting';
COMMENT ON COLUMN revenue_metrics.mrr IS 'Monthly Recurring Revenue for this tier on this date';
COMMENT ON COLUMN revenue_metrics.churned IS 'Number of subscriptions that churned (cancelled or downgraded) on this date';
COMMENT ON COLUMN revenue_metrics.expansion_revenue IS 'Revenue gained from users upgrading to this tier';
COMMENT ON COLUMN revenue_metrics.arpu IS 'Average Revenue Per User for this tier';

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_revenue_metrics_date ON revenue_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_metrics_tier ON revenue_metrics(tier);
CREATE INDEX IF NOT EXISTS idx_revenue_metrics_date_tier ON revenue_metrics(date DESC, tier);
CREATE INDEX IF NOT EXISTS idx_revenue_metrics_mrr ON revenue_metrics(mrr DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_revenue_metrics_updated_at ON revenue_metrics;
CREATE TRIGGER update_revenue_metrics_updated_at
  BEFORE UPDATE ON revenue_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CHURN_RISK_SCORES TABLE
-- ML-ready churn prediction scores
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS churn_risk_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User identification
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Risk score (0-100, higher = more likely to churn)
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  risk_level TEXT GENERATED ALWAYS AS (
    CASE
      WHEN score >= 80 THEN 'critical'
      WHEN score >= 60 THEN 'high'
      WHEN score >= 40 THEN 'medium'
      WHEN score >= 20 THEN 'low'
      ELSE 'minimal'
    END
  ) STORED,

  -- Contributing factors (ML feature importance)
  -- Example: {
  --   "days_since_last_activity": {"value": 14, "weight": 0.35},
  --   "content_completion_trend": {"value": -0.2, "weight": 0.25},
  --   "session_attendance_rate": {"value": 0.3, "weight": 0.15},
  --   "struggle_score_trend": {"value": 0.1, "weight": 0.15},
  --   "support_tickets": {"value": 2, "weight": 0.10}
  -- }
  factors JSONB DEFAULT '{}',

  -- Model metadata
  model_version TEXT,
  confidence NUMERIC(5,4),                -- 0.0000 to 1.0000

  -- Recommended actions
  recommended_actions JSONB DEFAULT '[]', -- [{action: 'send_re-engagement_email', priority: 1}]

  -- Status tracking
  intervention_sent BOOLEAN DEFAULT FALSE,
  intervention_type TEXT,
  intervention_sent_at TIMESTAMPTZ,
  outcome TEXT,                           -- 'retained', 'churned', 'upgraded', etc.

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,                 -- When score should be recalculated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE churn_risk_scores IS 'ML-generated churn risk scores with contributing factors for proactive retention';
COMMENT ON COLUMN churn_risk_scores.score IS 'Churn risk score from 0-100 (higher = more likely to churn)';
COMMENT ON COLUMN churn_risk_scores.factors IS 'JSON object containing contributing factors with values and weights';
COMMENT ON COLUMN churn_risk_scores.risk_level IS 'Computed risk level: minimal, low, medium, high, critical';
COMMENT ON COLUMN churn_risk_scores.recommended_actions IS 'JSON array of recommended retention interventions';

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_churn_risk_user_id ON churn_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_score ON churn_risk_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_churn_risk_calculated ON churn_risk_scores(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_churn_risk_level ON churn_risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_churn_risk_intervention ON churn_risk_scores(intervention_sent, risk_level);

-- GIN index for factors queries
CREATE INDEX IF NOT EXISTS idx_churn_risk_factors ON churn_risk_scores USING GIN (factors);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_churn_risk_scores_updated_at ON churn_risk_scores;
CREATE TRIGGER update_churn_risk_scores_updated_at
  BEFORE UPDATE ON churn_risk_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all analytics tables
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_risk_scores ENABLE ROW LEVEL SECURITY;

-- USER_EVENTS policies
-- Admins with analytics permission can read all events
CREATE POLICY "Analytics admins can view all user events" ON user_events
  FOR SELECT USING (has_permission('view_analytics'));

-- Users can view their own events
CREATE POLICY "Users can view their own events" ON user_events
  FOR SELECT USING (auth.uid() = user_id);

-- System/service role can insert events
CREATE POLICY "Service role can insert events" ON user_events
  FOR INSERT WITH CHECK (true);

-- DAILY_USER_METRICS policies
-- Admins with analytics permission can read all metrics
CREATE POLICY "Analytics admins can view all daily metrics" ON daily_user_metrics
  FOR SELECT USING (has_permission('view_analytics'));

-- Users can view their own metrics
CREATE POLICY "Users can view their own daily metrics" ON daily_user_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- System can manage daily metrics
CREATE POLICY "Service role can manage daily metrics" ON daily_user_metrics
  FOR ALL USING (true);

-- COHORT_METRICS policies (admin-only read, system write)
CREATE POLICY "Analytics admins can view cohort metrics" ON cohort_metrics
  FOR SELECT USING (has_permission('view_analytics'));

CREATE POLICY "Service role can manage cohort metrics" ON cohort_metrics
  FOR ALL USING (true);

-- CONTENT_METRICS policies (admin-only read, system write)
CREATE POLICY "Analytics admins can view content metrics" ON content_metrics
  FOR SELECT USING (has_permission('view_analytics'));

CREATE POLICY "Service role can manage content metrics" ON content_metrics
  FOR ALL USING (true);

-- REVENUE_METRICS policies (admin-only, more restricted)
CREATE POLICY "Super admins can view revenue metrics" ON revenue_metrics
  FOR SELECT USING (
    has_permission('view_analytics') AND (
      is_super_admin() OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND admin_tier IN ('super_admin', 'analytics_admin'))
    )
  );

CREATE POLICY "Service role can manage revenue metrics" ON revenue_metrics
  FOR ALL USING (true);

-- CHURN_RISK_SCORES policies
CREATE POLICY "Analytics admins can view churn scores" ON churn_risk_scores
  FOR SELECT USING (has_permission('view_analytics'));

CREATE POLICY "Service role can manage churn scores" ON churn_risk_scores
  FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. HELPER FUNCTIONS FOR COMMON QUERIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Function to record a user event
CREATE OR REPLACE FUNCTION record_user_event(
  p_event_type event_type,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO user_events (event_type, user_id, metadata, session_id)
  VALUES (p_event_type, COALESCE(p_user_id, auth.uid()), p_metadata, p_session_id)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_user_event IS 'Helper function to record a user event with automatic user_id from auth context';

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_events BIGINT,
  active_days BIGINT,
  total_active_minutes BIGINT,
  contents_started BIGINT,
  contents_completed BIGINT,
  sessions_attended BIGINT,
  ai_interactions BIGINT,
  avg_struggle_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_events,
    COUNT(DISTINCT date)::BIGINT AS active_days,
    COALESCE(SUM(dum.active_minutes), 0)::BIGINT AS total_active_minutes,
    COALESCE(SUM(dum.contents_started), 0)::BIGINT AS contents_started,
    COALESCE(SUM(dum.contents_completed), 0)::BIGINT AS contents_completed,
    COALESCE(SUM(dum.sessions_attended), 0)::BIGINT AS sessions_attended,
    COALESCE(SUM(dum.ai_interactions), 0)::BIGINT AS ai_interactions,
    ROUND(AVG(dum.struggle_score_avg), 2) AS avg_struggle_score
  FROM daily_user_metrics dum
  WHERE dum.user_id = p_user_id
    AND dum.date >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_activity_summary IS 'Returns activity summary for a user over the specified number of days';

-- Function to get content performance
CREATE OR REPLACE FUNCTION get_content_performance(
  p_content_type content_type DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  content_id TEXT,
  content_type content_type,
  content_title TEXT,
  views INTEGER,
  completions INTEGER,
  completion_rate NUMERIC,
  avg_time_spent INTEGER,
  avg_struggle_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.content_id,
    cm.content_type,
    cm.content_title,
    cm.views,
    cm.completions,
    cm.completion_rate,
    cm.avg_time_spent,
    cm.avg_struggle_score
  FROM content_metrics cm
  WHERE cm.period_start IS NULL  -- All-time metrics
    AND (p_content_type IS NULL OR cm.content_type = p_content_type)
  ORDER BY cm.views DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_content_performance IS 'Returns top performing content by views with completion rates and engagement metrics';

-- Function to get cohort retention
CREATE OR REPLACE FUNCTION get_cohort_retention(
  p_cohort_type TEXT DEFAULT 'weekly',
  p_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  cohort_date DATE,
  user_count INTEGER,
  day_1_pct NUMERIC,
  day_7_pct NUMERIC,
  day_30_pct NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.cohort_date,
    cm.user_count,
    cm.retention_pct_day_1 AS day_1_pct,
    cm.retention_pct_day_7 AS day_7_pct,
    cm.retention_pct_day_30 AS day_30_pct,
    cm.conversion_rate
  FROM cohort_metrics cm
  WHERE cm.cohort_type = p_cohort_type
  ORDER BY cm.cohort_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_cohort_retention IS 'Returns cohort retention data for the specified period type (daily, weekly, monthly)';

-- Function to get revenue summary
CREATE OR REPLACE FUNCTION get_revenue_summary(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  tier subscription_tier,
  total_mrr NUMERIC,
  total_subscriptions BIGINT,
  new_subscriptions BIGINT,
  churned BIGINT,
  net_growth BIGINT,
  avg_churn_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rm.tier,
    SUM(rm.mrr)::NUMERIC AS total_mrr,
    SUM(rm.active_subscriptions)::BIGINT AS total_subscriptions,
    SUM(rm.new_subscriptions)::BIGINT AS new_subscriptions,
    SUM(rm.churned)::BIGINT AS churned,
    (SUM(rm.new_subscriptions) - SUM(rm.churned))::BIGINT AS net_growth,
    ROUND(AVG(rm.churn_rate), 2) AS avg_churn_rate
  FROM revenue_metrics rm
  WHERE (p_start_date IS NULL OR rm.date >= p_start_date)
    AND (p_end_date IS NULL OR rm.date <= p_end_date)
  GROUP BY rm.tier
  ORDER BY total_mrr DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_revenue_summary IS 'Returns revenue summary by tier for the specified date range';

-- Function to get high-risk churn users
CREATE OR REPLACE FUNCTION get_high_churn_risk_users(
  p_min_score INTEGER DEFAULT 60,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  score INTEGER,
  risk_level TEXT,
  top_factors JSONB,
  days_since_activity INTEGER,
  intervention_sent BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    crs.user_id,
    u.email,
    u.full_name,
    crs.score,
    crs.risk_level,
    crs.factors AS top_factors,
    EXTRACT(DAY FROM NOW() - lp.last_activity_at)::INTEGER AS days_since_activity,
    crs.intervention_sent
  FROM churn_risk_scores crs
  JOIN users u ON u.id = crs.user_id
  LEFT JOIN learner_profiles lp ON lp.user_id = crs.user_id
  WHERE crs.score >= p_min_score
    AND crs.calculated_at = (
      SELECT MAX(calculated_at)
      FROM churn_risk_scores
      WHERE user_id = crs.user_id
    )
  ORDER BY crs.score DESC, crs.calculated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_high_churn_risk_users IS 'Returns users with high churn risk scores for retention outreach';

-- Function to upsert daily user metrics
CREATE OR REPLACE FUNCTION upsert_daily_user_metrics(
  p_user_id UUID,
  p_date DATE,
  p_active_minutes INTEGER DEFAULT 0,
  p_page_views INTEGER DEFAULT 0,
  p_contents_started INTEGER DEFAULT 0,
  p_contents_completed INTEGER DEFAULT 0,
  p_sessions_attended INTEGER DEFAULT 0,
  p_ai_interactions INTEGER DEFAULT 0,
  p_struggle_score_avg NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO daily_user_metrics (
    user_id, date, active_minutes, page_views, contents_started,
    contents_completed, sessions_attended, ai_interactions, struggle_score_avg
  )
  VALUES (
    p_user_id, p_date, p_active_minutes, p_page_views, p_contents_started,
    p_contents_completed, p_sessions_attended, p_ai_interactions,
    COALESCE(p_struggle_score_avg, 50.00)
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    active_minutes = daily_user_metrics.active_minutes + EXCLUDED.active_minutes,
    page_views = daily_user_metrics.page_views + EXCLUDED.page_views,
    contents_started = daily_user_metrics.contents_started + EXCLUDED.contents_started,
    contents_completed = daily_user_metrics.contents_completed + EXCLUDED.contents_completed,
    sessions_attended = daily_user_metrics.sessions_attended + EXCLUDED.sessions_attended,
    ai_interactions = daily_user_metrics.ai_interactions + EXCLUDED.ai_interactions,
    struggle_score_avg = CASE
      WHEN EXCLUDED.struggle_score_avg IS NOT NULL
      THEN (daily_user_metrics.struggle_score_avg + EXCLUDED.struggle_score_avg) / 2
      ELSE daily_user_metrics.struggle_score_avg
    END,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION upsert_daily_user_metrics IS 'Upsert daily user metrics, incrementing values if row exists';

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. ANALYTICS VIEWS FOR DASHBOARDS
-- ─────────────────────────────────────────────────────────────────────────────

-- Real-time user activity view
CREATE OR REPLACE VIEW v_user_activity_today AS
SELECT
  ue.user_id,
  u.email,
  u.full_name,
  COUNT(*) AS event_count,
  COUNT(DISTINCT ue.event_type) AS unique_event_types,
  MIN(ue.created_at) AS first_activity,
  MAX(ue.created_at) AS last_activity,
  ARRAY_AGG(DISTINCT ue.event_type) AS event_types
FROM user_events ue
JOIN users u ON u.id = ue.user_id
WHERE ue.created_at >= CURRENT_DATE
GROUP BY ue.user_id, u.email, u.full_name
ORDER BY last_activity DESC;

COMMENT ON VIEW v_user_activity_today IS 'Real-time view of user activity for the current day';

-- Platform health dashboard view
CREATE OR REPLACE VIEW v_platform_health AS
SELECT
  CURRENT_DATE AS report_date,
  (SELECT COUNT(DISTINCT user_id) FROM user_events WHERE created_at >= CURRENT_DATE) AS dau,
  (SELECT COUNT(DISTINCT user_id) FROM user_events WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS wau,
  (SELECT COUNT(DISTINCT user_id) FROM user_events WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS mau,
  (SELECT COUNT(*) FROM user_events WHERE created_at >= CURRENT_DATE) AS events_today,
  (SELECT COUNT(*) FROM user_events WHERE event_type = 'content_complete' AND created_at >= CURRENT_DATE) AS completions_today,
  (SELECT AVG(score)::INTEGER FROM churn_risk_scores WHERE calculated_at >= CURRENT_DATE - INTERVAL '1 day') AS avg_churn_risk,
  (SELECT COUNT(*) FROM churn_risk_scores WHERE score >= 60 AND calculated_at >= CURRENT_DATE - INTERVAL '1 day') AS high_risk_users;

COMMENT ON VIEW v_platform_health IS 'High-level platform health metrics for executive dashboard';

-- Content performance summary view
CREATE OR REPLACE VIEW v_content_performance_summary AS
SELECT
  content_type,
  COUNT(*) AS content_count,
  SUM(views) AS total_views,
  SUM(completions) AS total_completions,
  ROUND(AVG(completion_rate), 2) AS avg_completion_rate,
  ROUND(AVG(avg_time_spent) / 60.0, 1) AS avg_minutes_spent,
  ROUND(AVG(avg_struggle_score), 1) AS avg_struggle_score
FROM content_metrics
WHERE period_start IS NULL  -- All-time metrics
GROUP BY content_type
ORDER BY total_views DESC;

COMMENT ON VIEW v_content_performance_summary IS 'Aggregated content performance by content type';

-- Grant access to views
GRANT SELECT ON v_user_activity_today TO authenticated;
GRANT SELECT ON v_platform_health TO authenticated;
GRANT SELECT ON v_content_performance_summary TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. GRANT PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Grant usage on new types
GRANT USAGE ON TYPE event_type TO authenticated;
GRANT USAGE ON TYPE event_type TO service_role;
GRANT USAGE ON TYPE content_type TO authenticated;
GRANT USAGE ON TYPE content_type TO service_role;
GRANT USAGE ON TYPE subscription_tier TO authenticated;
GRANT USAGE ON TYPE subscription_tier TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- Analytics schema ready for:
-- - Event tracking and user behavior analysis
-- - Daily metric aggregation for trend analysis
-- - Cohort retention and conversion tracking
-- - Content performance optimization
-- - Revenue and subscription analytics
-- - ML-based churn prediction and intervention
-- ═══════════════════════════════════════════════════════════════════════════
