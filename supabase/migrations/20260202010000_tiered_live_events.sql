-- TIERED LIVE EVENTS
-- Add support for tier-based access and seat purchases

-- Add new columns to live_sessions
ALTER TABLE live_sessions
ADD COLUMN IF NOT EXISTS target_tier TEXT DEFAULT 'student' CHECK (target_tier IN ('student', 'employee', 'owner')),
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'google_meet' CHECK (platform IN ('google_meet', 'zoom')),
ADD COLUMN IF NOT EXISTS zoom_link TEXT,
ADD COLUMN IF NOT EXISTS seat_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS early_bird_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS early_bird_deadline TIMESTAMPTZ;

-- Seat purchases table for users buying access to higher-tier events
CREATE TABLE IF NOT EXISTS seat_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded', 'failed')),
  payment_intent_id TEXT, -- Stripe payment intent
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Update session_enrollments to track if access was purchased or free
ALTER TABLE session_enrollments
ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'free' CHECK (access_type IN ('free', 'purchased', 'tier_included')),
ADD COLUMN IF NOT EXISTS purchase_id UUID REFERENCES seat_purchases(id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seat_purchases_session ON seat_purchases(session_id);
CREATE INDEX IF NOT EXISTS idx_seat_purchases_user ON seat_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_target_tier ON live_sessions(target_tier);

-- RLS policies for seat_purchases
ALTER TABLE seat_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases" ON seat_purchases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own purchases" ON seat_purchases
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all purchases" ON seat_purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Function to check if user has access to a session
CREATE OR REPLACE FUNCTION user_has_session_access(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_tier TEXT;
  v_session_tier TEXT;
  v_has_purchase BOOLEAN;
BEGIN
  -- Get user's tier
  SELECT tier INTO v_user_tier FROM users WHERE id = p_user_id;

  -- Get session's target tier
  SELECT target_tier INTO v_session_tier FROM live_sessions WHERE id = p_session_id;

  -- Check tier hierarchy: owner > employee > student
  IF v_user_tier = 'owner' THEN
    RETURN TRUE; -- Owners can access everything
  ELSIF v_user_tier = 'employee' AND v_session_tier IN ('student', 'employee') THEN
    RETURN TRUE; -- Employees can access student and employee events
  ELSIF v_user_tier = 'student' AND v_session_tier = 'student' THEN
    RETURN TRUE; -- Students can only access student events
  END IF;

  -- Check if user purchased a seat
  SELECT EXISTS(
    SELECT 1 FROM seat_purchases
    WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND payment_status = 'completed'
  ) INTO v_has_purchase;

  RETURN v_has_purchase;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE seat_purchases IS 'Tracks seat purchases for users accessing higher-tier events';
COMMENT ON COLUMN live_sessions.target_tier IS 'Which tier this event is primarily for (student/employee/owner)';
COMMENT ON COLUMN live_sessions.platform IS 'Video conferencing platform (google_meet/zoom)';
COMMENT ON COLUMN live_sessions.seat_price IS 'Price for users to purchase access if not in target tier';
