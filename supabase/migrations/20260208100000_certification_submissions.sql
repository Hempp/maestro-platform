-- ============================================================================
-- CERTIFICATION SUBMISSIONS TABLE
-- Stores final project submissions for certification review
-- ============================================================================

-- Create enum for submission status
DO $$ BEGIN
    CREATE TYPE certification_submission_status AS ENUM (
        'submitted',
        'under_review',
        'passed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the certification_submissions table
CREATE TABLE IF NOT EXISTS certification_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Submission path (matches tier_type)
    path TEXT NOT NULL CHECK (path IN ('student', 'employee', 'owner')),

    -- Status tracking
    status certification_submission_status NOT NULL DEFAULT 'submitted',

    -- Submission artifacts (URLs or file paths)
    architecture_url TEXT,
    video_url TEXT,
    logs_url TEXT,
    roi_document_url TEXT,
    documentation_url TEXT,

    -- Additional submission metadata
    project_title TEXT NOT NULL,
    project_description TEXT,
    github_repo_url TEXT,
    live_demo_url TEXT,

    -- Scoring rubric (out of 100)
    -- working_system (30), problem_fit (20), architecture (15),
    -- production_ready (15), roi (10), documentation (10)
    score_working_system INTEGER CHECK (score_working_system >= 0 AND score_working_system <= 30),
    score_problem_fit INTEGER CHECK (score_problem_fit >= 0 AND score_problem_fit <= 20),
    score_architecture INTEGER CHECK (score_architecture >= 0 AND score_architecture <= 15),
    score_production_ready INTEGER CHECK (score_production_ready >= 0 AND score_production_ready <= 15),
    score_roi INTEGER CHECK (score_roi >= 0 AND score_roi <= 10),
    score_documentation INTEGER CHECK (score_documentation >= 0 AND score_documentation <= 10),

    -- Calculated total score
    total_score INTEGER GENERATED ALWAYS AS (
        COALESCE(score_working_system, 0) +
        COALESCE(score_problem_fit, 0) +
        COALESCE(score_architecture, 0) +
        COALESCE(score_production_ready, 0) +
        COALESCE(score_roi, 0) +
        COALESCE(score_documentation, 0)
    ) STORED,

    -- Review information
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,

    -- Timestamps
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cert_submissions_user ON certification_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_cert_submissions_status ON certification_submissions(status);
CREATE INDEX IF NOT EXISTS idx_cert_submissions_path ON certification_submissions(path);
CREATE INDEX IF NOT EXISTS idx_cert_submissions_submitted_at ON certification_submissions(submitted_at DESC);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_cert_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cert_submission_updated_at ON certification_submissions;
CREATE TRIGGER trigger_cert_submission_updated_at
    BEFORE UPDATE ON certification_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_cert_submission_updated_at();

-- RLS Policies
ALTER TABLE certification_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON certification_submissions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users can insert own submissions" ON certification_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending submissions
CREATE POLICY "Users can update own pending submissions" ON certification_submissions
    FOR UPDATE USING (
        auth.uid() = user_id
        AND status = 'submitted'
    );

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions" ON certification_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Admins can update all submissions (for reviewing)
CREATE POLICY "Admins can update all submissions" ON certification_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Teachers can view and update submissions (for reviewing)
CREATE POLICY "Teachers can view submissions" ON certification_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'instructor'
        )
    );

CREATE POLICY "Teachers can update submissions" ON certification_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'instructor'
        )
    );

-- Add comment for documentation
COMMENT ON TABLE certification_submissions IS 'Stores final project submissions for certification review. Scoring rubric: working_system(30), problem_fit(20), architecture(15), production_ready(15), roi(10), documentation(10) = 100 total, pass at 70.';
