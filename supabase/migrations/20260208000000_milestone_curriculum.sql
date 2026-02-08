-- =====================================================
-- MILESTONE-BASED CURRICULUM SCHEMA
-- Supports chatbot-guided project milestones
-- =====================================================

-- User milestone progress
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL CHECK (path IN ('student', 'employee', 'owner')),
  milestone_number INTEGER NOT NULL CHECK (milestone_number BETWEEN 1 AND 10),
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'submitted', 'approved', 'needs_revision')),
  submission_content JSONB, -- Their submission data
  submission_files TEXT[], -- URLs to uploaded files
  feedback TEXT, -- AI/human feedback
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, path, milestone_number)
);

-- Tutor chat conversations
CREATE TABLE IF NOT EXISTS tutor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL CHECK (path IN ('student', 'employee', 'owner')),
  messages JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
  current_milestone INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, path)
);

-- Final certification submissions
CREATE TABLE IF NOT EXISTS certification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL CHECK (path IN ('student', 'employee', 'owner')),

  -- Submission artifacts
  architecture_url TEXT,
  demo_video_url TEXT,
  production_logs JSONB,
  roi_document TEXT,
  documentation_url TEXT,

  -- Scoring (matches rubric)
  score_working_system INTEGER CHECK (score_working_system BETWEEN 0 AND 30),
  score_problem_fit INTEGER CHECK (score_problem_fit BETWEEN 0 AND 20),
  score_architecture INTEGER CHECK (score_architecture BETWEEN 0 AND 15),
  score_production_ready INTEGER CHECK (score_production_ready BETWEEN 0 AND 15),
  score_roi INTEGER CHECK (score_roi BETWEEN 0 AND 10),
  score_documentation INTEGER CHECK (score_documentation BETWEEN 0 AND 10),
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(score_working_system, 0) +
    COALESCE(score_problem_fit, 0) +
    COALESCE(score_architecture, 0) +
    COALESCE(score_production_ready, 0) +
    COALESCE(score_roi, 0) +
    COALESCE(score_documentation, 0)
  ) STORED,

  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'passed', 'failed', 'needs_revision')),
  reviewer_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,

  UNIQUE(user_id, path)
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_submissions ENABLE ROW LEVEL SECURITY;

-- Users manage their own data
CREATE POLICY "Users manage own milestones" ON user_milestones
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own conversations" ON tutor_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own certifications" ON certification_submissions
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Initialize milestones for a user starting a path
CREATE OR REPLACE FUNCTION initialize_user_path(p_user_id UUID, p_path TEXT)
RETURNS void AS $$
BEGIN
  -- Create all 10 milestones, first one active
  INSERT INTO user_milestones (user_id, path, milestone_number, status)
  SELECT
    p_user_id,
    p_path,
    generate_series(1, 10),
    CASE WHEN generate_series(1, 10) = 1 THEN 'active' ELSE 'locked' END
  ON CONFLICT (user_id, path, milestone_number) DO NOTHING;

  -- Create conversation record
  INSERT INTO tutor_conversations (user_id, path, messages, current_milestone)
  VALUES (p_user_id, p_path, '[]'::jsonb, 1)
  ON CONFLICT (user_id, path) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve a milestone and unlock next
CREATE OR REPLACE FUNCTION approve_milestone(p_user_id UUID, p_path TEXT, p_milestone INTEGER, p_feedback TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Mark current as approved
  UPDATE user_milestones
  SET
    status = 'approved',
    feedback = COALESCE(p_feedback, feedback),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND path = p_path
    AND milestone_number = p_milestone;

  -- Unlock next milestone if exists
  UPDATE user_milestones
  SET
    status = 'active',
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND path = p_path
    AND milestone_number = p_milestone + 1
    AND status = 'locked';

  -- Update conversation's current milestone
  UPDATE tutor_conversations
  SET
    current_milestone = LEAST(p_milestone + 1, 10),
    updated_at = NOW()
  WHERE user_id = p_user_id AND path = p_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's path progress
CREATE OR REPLACE FUNCTION get_path_progress(p_user_id UUID, p_path TEXT)
RETURNS TABLE (
  total_milestones INTEGER,
  approved_milestones INTEGER,
  current_milestone INTEGER,
  completion_percentage NUMERIC,
  is_eligible_for_certification BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    10::INTEGER as total_milestones,
    COUNT(*) FILTER (WHERE status = 'approved')::INTEGER as approved_milestones,
    MIN(milestone_number) FILTER (WHERE status IN ('active', 'submitted'))::INTEGER as current_milestone,
    ROUND((COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / 10) * 100, 1) as completion_percentage,
    (COUNT(*) FILTER (WHERE status = 'approved') >= 9)::BOOLEAN as is_eligible_for_certification
  FROM user_milestones
  WHERE user_id = p_user_id AND path = p_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MILESTONE DEFINITIONS (Reference Data)
-- =====================================================

-- This is stored in code, not DB, but here for reference:
COMMENT ON TABLE user_milestones IS '
Owner Path Milestones:
1. The Automation Audit - Identify what to automate
2. Process Mapping - Document target process
3. Architecture Design - Design multi-agent system
4. Stack Selection - Choose tools
5. First Agent - Build one working agent
6. Full System Integration - Connect all agents
7. Error Handling - Make it robust
8. Production Deployment - Get it running 24/7
9. Cost & Performance - Make it efficient
10. Certification Submission - Prove you built something real

Employee Path Milestones:
1. Time Audit - Find your time drains
2. Quick Win Selection - Pick first automation
3. Tool Discovery - Find the right no-code tools
4. First Automation - Build and test
5. Workflow Integration - Connect to your daily tools
6. Expansion - Add 2 more automations
7. Error Proofing - Handle edge cases
8. Documentation - Create runbook
9. ROI Calculation - Prove time saved
10. Certification Submission - Demo your automations

Student Path Milestones:
1. Concept Exploration - Understand AI capabilities
2. Project Selection - Choose portfolio project
3. Tool Setup - Configure development environment
4. Prototype - Build v0.1
5. Iteration - Improve based on feedback
6. Deployment - Ship to production
7. Documentation - README and demo
8. Polish - UI/UX improvements
9. Presentation Prep - Create walkthrough
10. Certification Submission - Submit portfolio piece
';
