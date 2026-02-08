-- Add certificate_type column to certificates table for certification path tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'certificate_type'
  ) THEN
    ALTER TABLE certificates ADD COLUMN certificate_type TEXT CHECK (certificate_type IN ('student', 'employee', 'owner'));
  END IF;
END $$;

-- Add index for lookups by type
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);
