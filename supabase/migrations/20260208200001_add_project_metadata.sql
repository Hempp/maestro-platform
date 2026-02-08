-- Add project metadata columns to certification_submissions
ALTER TABLE certification_submissions
ADD COLUMN IF NOT EXISTS project_title TEXT,
ADD COLUMN IF NOT EXISTS project_description TEXT,
ADD COLUMN IF NOT EXISTS github_repo_url TEXT,
ADD COLUMN IF NOT EXISTS live_demo_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS logs_url TEXT,
ADD COLUMN IF NOT EXISTS roi_document_url TEXT;
