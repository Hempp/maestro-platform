-- Add reviewed_by column to certification_submissions
ALTER TABLE certification_submissions
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_cert_submissions_reviewer ON certification_submissions(reviewed_by);
