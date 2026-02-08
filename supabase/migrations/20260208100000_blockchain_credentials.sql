-- =====================================================
-- BLOCKCHAIN CREDENTIALS SCHEMA
-- Supports SBT minting, pending mints, and claimable credentials
-- =====================================================

-- Pending SBT mints (for users without wallets or failed mints)
CREATE TABLE IF NOT EXISTS pending_mints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
  path TEXT NOT NULL CHECK (path IN ('student', 'employee', 'owner')),
  status TEXT DEFAULT 'pending_wallet' CHECK (status IN (
    'pending_wallet',     -- User hasn't connected wallet yet
    'queued',             -- Ready to mint, in queue
    'minting',            -- Mint transaction submitted
    'completed',          -- Successfully minted
    'failed',             -- Minting failed
    'cancelled'           -- Cancelled by user/admin
  )),
  wallet_address TEXT,    -- Wallet to mint to (when connected)
  transaction_hash TEXT,  -- Minting transaction hash
  token_id TEXT,          -- Resulting SBT token ID
  error TEXT,             -- Error message if failed
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, certificate_id)
);

-- Claimable credentials (for users to claim later with wallet)
CREATE TABLE IF NOT EXISTS claimable_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
  claim_code TEXT NOT NULL UNIQUE, -- Format: PHZ-XXXXXXXX
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Waiting to be claimed
    'claimed',    -- Claimed and minted
    'expired',    -- Expired (not claimed in time)
    'cancelled'   -- Cancelled by user/admin
  )),
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  claimed_wallet TEXT,    -- Wallet that claimed it
  token_id TEXT,          -- Resulting SBT token ID
  transaction_hash TEXT,  -- Minting transaction hash
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add SBT-related columns to certificates table if not present
DO $$
BEGIN
  -- Add token_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'token_id'
  ) THEN
    ALTER TABLE certificates ADD COLUMN token_id TEXT;
  END IF;

  -- Add contract_address if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'contract_address'
  ) THEN
    ALTER TABLE certificates ADD COLUMN contract_address TEXT;
  END IF;

  -- Add transaction_hash if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'transaction_hash'
  ) THEN
    ALTER TABLE certificates ADD COLUMN transaction_hash TEXT;
  END IF;

  -- Add ipfs_hash if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'ipfs_hash'
  ) THEN
    ALTER TABLE certificates ADD COLUMN ipfs_hash TEXT;
  END IF;

  -- Add sbt_minted_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'sbt_minted_at'
  ) THEN
    ALTER TABLE certificates ADD COLUMN sbt_minted_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add wallet_address to users table if table exists and column doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE users ADD COLUMN wallet_address TEXT;
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE pending_mints ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimable_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending mints
DROP POLICY IF EXISTS "Users view own pending mints" ON pending_mints;
CREATE POLICY "Users view own pending mints" ON pending_mints
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own claimable credentials
DROP POLICY IF EXISTS "Users view own claimable credentials" ON claimable_credentials;
CREATE POLICY "Users view own claimable credentials" ON claimable_credentials
  FOR SELECT USING (auth.uid() = user_id);

-- Allow claiming by claim code (public access for claim verification)
DROP POLICY IF EXISTS "Public claim code lookup" ON claimable_credentials;
CREATE POLICY "Public claim code lookup" ON claimable_credentials
  FOR SELECT USING (
    status = 'pending' AND expires_at > NOW()
  );

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pending_mints_user_id ON pending_mints(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_mints_status ON pending_mints(status);
CREATE INDEX IF NOT EXISTS idx_pending_mints_queued ON pending_mints(status) WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_claimable_credentials_claim_code ON claimable_credentials(claim_code);
CREATE INDEX IF NOT EXISTS idx_claimable_credentials_user_id ON claimable_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_claimable_credentials_pending ON claimable_credentials(status, expires_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_certificates_token_id ON certificates(token_id);
-- Create index only if both table and column exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'certificates' AND column_name = 'certificate_type') THEN
    CREATE INDEX IF NOT EXISTS idx_certificates_user_type ON certificates(user_id, certificate_type);
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to process pending mints (called by cron job)
CREATE OR REPLACE FUNCTION process_pending_mints()
RETURNS TABLE (
  mint_id UUID,
  user_id UUID,
  wallet_address TEXT,
  path TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id as mint_id,
    pm.user_id,
    pm.wallet_address,
    pm.path
  FROM pending_mints pm
  WHERE pm.status = 'queued'
    AND pm.wallet_address IS NOT NULL
    AND (pm.last_retry_at IS NULL OR pm.last_retry_at < NOW() - INTERVAL '5 minutes')
    AND pm.retry_count < 5
  ORDER BY pm.created_at
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old claimable credentials
CREATE OR REPLACE FUNCTION expire_claimable_credentials()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE claimable_credentials
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim a credential
CREATE OR REPLACE FUNCTION claim_credential(
  p_claim_code TEXT,
  p_wallet_address TEXT
) RETURNS TABLE (
  success BOOLEAN,
  certificate_id UUID,
  error_message TEXT
) AS $$
DECLARE
  v_credential RECORD;
BEGIN
  -- Find the claimable credential
  SELECT * INTO v_credential
  FROM claimable_credentials
  WHERE claim_code = p_claim_code
    AND status = 'pending'
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Claim code not found or expired'::TEXT;
    RETURN;
  END IF;

  -- Update the credential as claimed
  UPDATE claimable_credentials
  SET
    status = 'claimed',
    claimed_at = NOW(),
    claimed_wallet = p_wallet_address,
    updated_at = NOW()
  WHERE id = v_credential.id;

  -- Create a pending mint for this claim
  INSERT INTO pending_mints (
    user_id,
    certificate_id,
    path,
    status,
    wallet_address,
    created_at
  )
  SELECT
    v_credential.user_id,
    v_credential.certificate_id,
    c.certificate_type,
    'queued',
    p_wallet_address,
    NOW()
  FROM certificates c
  WHERE c.id = v_credential.certificate_id
  ON CONFLICT (user_id, certificate_id) DO UPDATE SET
    status = 'queued',
    wallet_address = p_wallet_address,
    updated_at = NOW();

  RETURN QUERY SELECT TRUE, v_credential.certificate_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at on pending_mints
CREATE OR REPLACE FUNCTION update_pending_mints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pending_mints_updated_at ON pending_mints;
CREATE TRIGGER update_pending_mints_updated_at
  BEFORE UPDATE ON pending_mints
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_mints_updated_at();

-- Update updated_at on claimable_credentials
DROP TRIGGER IF EXISTS update_claimable_credentials_updated_at ON claimable_credentials;
CREATE TRIGGER update_claimable_credentials_updated_at
  BEFORE UPDATE ON claimable_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_mints_updated_at();
