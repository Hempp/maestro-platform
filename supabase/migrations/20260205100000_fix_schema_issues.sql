-- Migration: Fix schema issues
-- 1. Add tier column to users table
-- 2. Add 'learner' and 'teacher' to user_role enum
-- 3. Create live_courses table
-- 4. Create live_sessions table
-- 5. Create/update course_enrollments

-- ============================================
-- 1. Add tier column to users table
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier tier_type DEFAULT 'student';

-- ============================================
-- 2. Add missing values to user_role enum
-- ============================================
DO $$
BEGIN
  -- Add 'learner' if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'learner' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'learner';
  END IF;
END $$;

DO $$
BEGIN
  -- Add 'teacher' if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'teacher' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
    ALTER TYPE user_role ADD VALUE 'teacher';
  END IF;
END $$;

-- ============================================
-- 3. Create live_courses table
-- ============================================
CREATE TABLE IF NOT EXISTS live_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tier tier_type DEFAULT 'student',
  max_students INTEGER DEFAULT 30,
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  requirements TEXT[],
  what_you_will_learn TEXT[],
  total_sessions INTEGER DEFAULT 0,
  total_enrolled INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for live_courses
CREATE INDEX IF NOT EXISTS idx_live_courses_teacher ON live_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_courses_tier ON live_courses(tier);
CREATE INDEX IF NOT EXISTS idx_live_courses_active ON live_courses(is_active);

-- ============================================
-- 4. Create live_sessions table
-- ============================================
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES live_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  recording_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  max_attendees INTEGER DEFAULT 100,
  current_attendees INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for live_sessions
CREATE INDEX IF NOT EXISTS idx_live_sessions_course ON live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled ON live_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);

-- ============================================
-- 5. Create course_enrollments table
-- ============================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES live_courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  progress_percent INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, student_id)
);

-- Index for course_enrollments
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);

-- ============================================
-- 6. Enable RLS on new tables
-- ============================================
ALTER TABLE live_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies for live_courses
DROP POLICY IF EXISTS live_courses_select ON live_courses;
CREATE POLICY live_courses_select ON live_courses FOR SELECT USING (
  is_active = TRUE OR
  auth.uid() = teacher_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS live_courses_insert ON live_courses;
CREATE POLICY live_courses_insert ON live_courses FOR INSERT WITH CHECK (
  auth.uid() = teacher_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS live_courses_update ON live_courses;
CREATE POLICY live_courses_update ON live_courses FOR UPDATE USING (
  auth.uid() = teacher_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS live_courses_delete ON live_courses;
CREATE POLICY live_courses_delete ON live_courses FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for live_sessions
DROP POLICY IF EXISTS live_sessions_select ON live_sessions;
CREATE POLICY live_sessions_select ON live_sessions FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS live_sessions_modify ON live_sessions;
CREATE POLICY live_sessions_modify ON live_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM live_courses WHERE id = course_id AND teacher_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for course_enrollments
DROP POLICY IF EXISTS course_enrollments_select ON course_enrollments;
CREATE POLICY course_enrollments_select ON course_enrollments FOR SELECT USING (
  auth.uid() = student_id OR
  EXISTS (SELECT 1 FROM live_courses WHERE id = course_id AND teacher_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS course_enrollments_insert ON course_enrollments;
CREATE POLICY course_enrollments_insert ON course_enrollments FOR INSERT WITH CHECK (
  auth.uid() = student_id
);

DROP POLICY IF EXISTS course_enrollments_update ON course_enrollments;
CREATE POLICY course_enrollments_update ON course_enrollments FOR UPDATE USING (
  auth.uid() = student_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 7. Add trigger to update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_live_courses_updated_at ON live_courses;
CREATE TRIGGER update_live_courses_updated_at
  BEFORE UPDATE ON live_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
