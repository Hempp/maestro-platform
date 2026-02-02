-- ═══════════════════════════════════════════════════════════════════════════
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Safe migration that handles existing structures
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- CERTIFICATES TABLE - Add missing columns
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Add token_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'certificates' AND column_name = 'token_id') THEN
    ALTER TABLE certificates ADD COLUMN token_id TEXT;
  END IF;

  -- Add contract_address column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'certificates' AND column_name = 'contract_address') THEN
    ALTER TABLE certificates ADD COLUMN contract_address TEXT;
  END IF;

  -- Add transaction_hash column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'certificates' AND column_name = 'transaction_hash') THEN
    ALTER TABLE certificates ADD COLUMN transaction_hash TEXT;
  END IF;

  -- Add ipfs_hash column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'certificates' AND column_name = 'ipfs_hash') THEN
    ALTER TABLE certificates ADD COLUMN ipfs_hash TEXT;
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'certificates' AND column_name = 'metadata') THEN
    ALTER TABLE certificates ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;

  -- Add verified_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'certificates' AND column_name = 'verified_at') THEN
    ALTER TABLE certificates ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create indexes now that columns exist
CREATE INDEX IF NOT EXISTS idx_certificates_token_id ON certificates(token_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- LEARNER_PROFILES TABLE - Ensure all columns exist
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'learner_profiles' AND column_name = 'interaction_dna') THEN
    ALTER TABLE learner_profiles ADD COLUMN interaction_dna JSONB DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'learner_profiles' AND column_name = 'struggle_score') THEN
    ALTER TABLE learner_profiles ADD COLUMN struggle_score INTEGER DEFAULT 50
      CHECK (struggle_score >= 0 AND struggle_score <= 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'learner_profiles' AND column_name = 'total_learning_time') THEN
    ALTER TABLE learner_profiles ADD COLUMN total_learning_time INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'learner_profiles' AND column_name = 'current_streak') THEN
    ALTER TABLE learner_profiles ADD COLUMN current_streak INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'learner_profiles' AND column_name = 'longest_streak') THEN
    ALTER TABLE learner_profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'learner_profiles' AND column_name = 'last_activity_at') THEN
    ALTER TABLE learner_profiles ADD COLUMN last_activity_at TIMESTAMPTZ;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- AKU_PROGRESS TABLE - Ensure all columns exist
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'aku_progress' AND column_name = 'workflow_snapshot') THEN
    ALTER TABLE aku_progress ADD COLUMN workflow_snapshot JSONB;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SANDBOX_SESSIONS TABLE - Ensure all columns exist
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'sandbox_sessions' AND column_name = 'aku_id') THEN
    ALTER TABLE sandbox_sessions ADD COLUMN aku_id TEXT;
  END IF;
END $$;
