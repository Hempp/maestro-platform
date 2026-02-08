-- =====================================================
-- CERTIFICATION PAYMENT FLOW SCHEMA
-- Adds tables for tracking payment and SBT minting
-- =====================================================

-- Add payment metadata columns to certification_submissions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certification_submissions' AND column_name = 'stripe_payment_id'
  ) THEN
    ALTER TABLE certification_submissions
    ADD COLUMN stripe_payment_id TEXT,
    ADD COLUMN stripe_session_id TEXT,
    ADD COLUMN amount_paid INTEGER,
    ADD COLUMN currency TEXT DEFAULT 'usd',
    ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add SBT tracking columns to certificates if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'sbt_token_id'
  ) THEN
    ALTER TABLE certificates
    ADD COLUMN sbt_token_id TEXT,
    ADD COLUMN sbt_transaction_hash TEXT,
    ADD COLUMN sbt_minted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Pending SBT mints tracking table
-- Used when user doesn't have wallet connected or minting fails
CREATE TABLE IF NOT EXISTS pending_mints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id TEXT NOT NULL,
  path TEXT NOT NULL CHECK (path IN ('student', 'employee', 'owner')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_wallet', 'minting', 'minted', 'failed')),
  wallet_address TEXT,
  token_id TEXT,
  transaction_hash TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  minted_at TIMESTAMPTZ,
  UNIQUE(user_id, path)
);

-- Enable RLS
ALTER TABLE pending_mints ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending mints
CREATE POLICY "Users view own pending mints" ON pending_mints
  FOR SELECT USING (auth.uid() = user_id);

-- Add wallet_address to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN wallet_address TEXT;
  END IF;
END $$;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pending_mints_user_status ON pending_mints(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_mints_status ON pending_mints(status) WHERE status != 'minted';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user can submit certification
CREATE OR REPLACE FUNCTION can_submit_certification(p_user_id UUID, p_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  approved_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO approved_count
  FROM user_milestones
  WHERE user_id = p_user_id
    AND path = p_path
    AND status = 'approved';

  RETURN approved_count >= 9;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get certification status
CREATE OR REPLACE FUNCTION get_certification_status(p_user_id UUID, p_path TEXT)
RETURNS TABLE (
  submission_status TEXT,
  is_paid BOOLEAN,
  sbt_status TEXT,
  certificate_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.status as submission_status,
    (cs.paid_at IS NOT NULL) as is_paid,
    COALESCE(pm.status, 'none') as sbt_status,
    c.id as certificate_id
  FROM certification_submissions cs
  LEFT JOIN pending_mints pm ON pm.user_id = cs.user_id AND pm.path = cs.path
  LEFT JOIN certificates c ON c.user_id = cs.user_id AND c.certificate_type = cs.path
  WHERE cs.user_id = p_user_id AND cs.path = p_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE pending_mints IS '
Tracks SBT minting status for certifications.
Used when:
- User has no wallet connected (pending_wallet)
- Minting is in progress (minting)
- Minting failed and needs retry (failed)
- Successfully minted (minted)
';

COMMENT ON COLUMN pending_mints.retry_count IS 'Number of times minting has been attempted';
COMMENT ON COLUMN pending_mints.error IS 'Last error message if minting failed';
