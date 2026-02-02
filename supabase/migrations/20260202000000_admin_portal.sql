-- Admin Portal Migration
-- Adds admin/teacher roles and live course management

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'learner'
  CHECK (role IN ('learner', 'teacher', 'admin'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Live courses table
CREATE TABLE IF NOT EXISTS live_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier tier_type,
  thumbnail_url TEXT,
  max_students INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  schedule JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live sessions (individual meetings)
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES live_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  google_meet_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session enrollments (student attendance)
CREATE TABLE IF NOT EXISTS session_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(session_id, student_id)
);

-- Course enrollments (persistent course membership)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES live_courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  UNIQUE(course_id, student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_courses_teacher ON live_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_course ON live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled ON live_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_session ON session_enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_student ON session_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);

-- Enable RLS on new tables
ALTER TABLE live_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_courses
CREATE POLICY "Public can view active courses" ON live_courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Teachers can manage their courses" ON live_courses
  FOR ALL USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for live_sessions
CREATE POLICY "Public can view scheduled sessions" ON live_sessions
  FOR SELECT USING (
    status IN ('scheduled', 'live') OR
    EXISTS (SELECT 1 FROM session_enrollments WHERE session_id = live_sessions.id AND student_id = auth.uid())
  );

CREATE POLICY "Teachers can manage sessions for their courses" ON live_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM live_courses WHERE id = course_id AND teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for session_enrollments
CREATE POLICY "Users can view their own enrollments" ON session_enrollments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Users can enroll themselves" ON session_enrollments
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can manage enrollments for their sessions" ON session_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls
      JOIN live_courses lc ON ls.course_id = lc.id
      WHERE ls.id = session_enrollments.session_id AND lc.teacher_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for course_enrollments
CREATE POLICY "Users can view their own course enrollments" ON course_enrollments
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Users can enroll in courses" ON course_enrollments
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can manage course enrollments" ON course_enrollments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM live_courses WHERE id = course_id AND teacher_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin policy: Admins and teachers can view all users
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Users can view own profile" ON users;
  DROP POLICY IF EXISTS "Admins can view all users" ON users;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Users can view profiles" ON users
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_live_courses_updated_at ON live_courses;
CREATE TRIGGER update_live_courses_updated_at
  BEFORE UPDATE ON live_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_sessions_updated_at ON live_sessions;
CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
