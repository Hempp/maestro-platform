-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- Manages user subscription plans for recurring billing
-- ============================================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',

  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_session_id TEXT,
  stripe_price_id TEXT,

  -- Billing details
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',

  -- Period tracking
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'cancelled', 'past_due', 'trialing', 'incomplete')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly')),
  CONSTRAINT valid_plan CHECK (plan_id IN ('starter', 'professional', 'enterprise', 'team_starter', 'team_growth', 'team_enterprise'))
);

-- Create indexes for common queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- Add stripe_customer_id to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
    CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions (via checkout)
CREATE POLICY "Users can create own subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions (cancel, etc)
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access"
  ON subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- SUBSCRIPTION HISTORY TABLE
-- Track all subscription changes for auditing
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  previous_plan TEXT,
  new_plan TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_event_type CHECK (event_type IN (
    'created', 'activated', 'upgraded', 'downgraded',
    'cancelled', 'reactivated', 'expired', 'payment_failed'
  ))
);

-- Index for history lookups
CREATE INDEX idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_created ON subscription_history(created_at DESC);

-- Enable RLS
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view own subscription history"
  ON subscription_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS subscription_updated_at ON subscriptions;
CREATE TRIGGER subscription_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO subscription_history (subscription_id, user_id, event_type, new_status, new_plan)
    VALUES (NEW.id, NEW.user_id, 'created', NEW.status, NEW.plan_id);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO subscription_history (
        subscription_id, user_id, event_type,
        previous_status, new_status, previous_plan, new_plan
      )
      VALUES (
        NEW.id, NEW.user_id,
        CASE
          WHEN NEW.status = 'active' AND OLD.status = 'pending' THEN 'activated'
          WHEN NEW.status = 'cancelled' THEN 'cancelled'
          WHEN NEW.status = 'active' AND OLD.status = 'cancelled' THEN 'reactivated'
          WHEN NEW.status = 'past_due' THEN 'payment_failed'
          ELSE 'updated'
        END,
        OLD.status, NEW.status, OLD.plan_id, NEW.plan_id
      );
    -- Log plan changes
    ELSIF OLD.plan_id != NEW.plan_id THEN
      INSERT INTO subscription_history (
        subscription_id, user_id, event_type,
        previous_status, new_status, previous_plan, new_plan
      )
      VALUES (
        NEW.id, NEW.user_id,
        CASE
          WHEN NEW.amount > OLD.amount THEN 'upgraded'
          ELSE 'downgraded'
        END,
        OLD.status, NEW.status, OLD.plan_id, NEW.plan_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for logging changes
DROP TRIGGER IF EXISTS subscription_change_log ON subscriptions;
CREATE TRIGGER subscription_change_log
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Active subscriptions summary
CREATE OR REPLACE VIEW subscription_summary AS
SELECT
  plan_id,
  billing_cycle,
  COUNT(*) as subscriber_count,
  SUM(amount) as total_mrr_cents,
  SUM(amount) / 100.0 as total_mrr_dollars
FROM subscriptions
WHERE status = 'active'
GROUP BY plan_id, billing_cycle;

-- Monthly recurring revenue
CREATE OR REPLACE VIEW mrr_by_plan AS
SELECT
  plan_id,
  COUNT(*) as subscribers,
  SUM(CASE
    WHEN billing_cycle = 'monthly' THEN amount
    WHEN billing_cycle = 'yearly' THEN amount / 12
    ELSE 0
  END) / 100.0 as mrr_dollars
FROM subscriptions
WHERE status = 'active'
GROUP BY plan_id
ORDER BY mrr_dollars DESC;

COMMENT ON TABLE subscriptions IS 'Stores user subscription information for recurring billing';
COMMENT ON TABLE subscription_history IS 'Audit log of all subscription changes';
