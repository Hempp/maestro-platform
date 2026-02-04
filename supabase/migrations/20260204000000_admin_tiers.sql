-- ═══════════════════════════════════════════════════════════════════════════
-- ADMIN TIERS AND PERMISSIONS SYSTEM
-- Granular permission control for admin/teacher roles
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CREATE ADMIN_TIER ENUM
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE admin_tier AS ENUM (
    'super_admin',    -- Full platform access
    'content_admin',  -- Manage courses, sessions, curriculum
    'analytics_admin', -- View analytics only
    'support_admin',  -- Manage students, support tickets
    'teacher'         -- Manage own courses/sessions only
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ADD ADMIN_TIER COLUMN TO USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

-- Add admin_tier column (nullable - only set for admin/teacher roles)
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_tier admin_tier;

-- Create index for admin_tier lookups
CREATE INDEX IF NOT EXISTS idx_users_admin_tier ON users(admin_tier);

-- Add comment explaining the column
COMMENT ON COLUMN users.admin_tier IS 'Admin tier for granular permissions. Only set for users with role=admin or role=teacher';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREATE PERMISSIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT, -- For grouping permissions in UI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for permission name lookups
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Enable RLS on permissions table
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Permissions are public read (needed for permission checks)
CREATE POLICY "Permissions are publicly readable" ON permissions
  FOR SELECT USING (true);

-- Only super_admins can modify permissions
CREATE POLICY "Only super_admins can manage permissions" ON permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND admin_tier = 'super_admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CREATE ADMIN_TIER_PERMISSIONS JUNCTION TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_tier_permissions (
  tier admin_tier NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tier, permission_id)
);

-- Create index for permission lookups by tier
CREATE INDEX IF NOT EXISTS idx_admin_tier_permissions_tier ON admin_tier_permissions(tier);
CREATE INDEX IF NOT EXISTS idx_admin_tier_permissions_permission ON admin_tier_permissions(permission_id);

-- Enable RLS on admin_tier_permissions table
ALTER TABLE admin_tier_permissions ENABLE ROW LEVEL SECURITY;

-- Admin tier permissions are public read (needed for permission checks)
CREATE POLICY "Admin tier permissions are publicly readable" ON admin_tier_permissions
  FOR SELECT USING (true);

-- Only super_admins can modify tier permissions
CREATE POLICY "Only super_admins can manage tier permissions" ON admin_tier_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND admin_tier = 'super_admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO permissions (name, description, category) VALUES
  -- User management permissions
  ('manage_users', 'Create, update, and delete user accounts', 'users'),
  ('view_users', 'View user profiles and information', 'users'),

  -- Course management permissions
  ('manage_courses', 'Create, update, and delete courses', 'courses'),
  ('view_courses', 'View all courses including inactive ones', 'courses'),

  -- Session management permissions
  ('manage_sessions', 'Create, update, and delete live sessions', 'sessions'),
  ('view_sessions', 'View all session details and recordings', 'sessions'),

  -- Analytics permissions
  ('view_analytics', 'Access platform analytics and reports', 'analytics'),

  -- Curriculum permissions
  ('manage_curriculum', 'Manage learning paths, AKUs, and educational content', 'curriculum'),

  -- Support permissions
  ('manage_support', 'Handle support tickets and student issues', 'support'),

  -- Admin management (super_admin only)
  ('manage_admins', 'Promote users to admin roles and manage admin tiers', 'admin')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SEED TIER_PERMISSIONS MAPPINGS
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper function to insert tier permissions by name
CREATE OR REPLACE FUNCTION seed_tier_permission(p_tier admin_tier, p_permission_name TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_tier_permissions (tier, permission_id)
  SELECT p_tier, id FROM permissions WHERE name = p_permission_name
  ON CONFLICT (tier, permission_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- SUPER_ADMIN: ALL permissions
SELECT seed_tier_permission('super_admin', 'manage_users');
SELECT seed_tier_permission('super_admin', 'view_users');
SELECT seed_tier_permission('super_admin', 'manage_courses');
SELECT seed_tier_permission('super_admin', 'view_courses');
SELECT seed_tier_permission('super_admin', 'manage_sessions');
SELECT seed_tier_permission('super_admin', 'view_sessions');
SELECT seed_tier_permission('super_admin', 'view_analytics');
SELECT seed_tier_permission('super_admin', 'manage_curriculum');
SELECT seed_tier_permission('super_admin', 'manage_support');
SELECT seed_tier_permission('super_admin', 'manage_admins');

-- CONTENT_ADMIN: Manage courses, sessions, curriculum, view analytics
SELECT seed_tier_permission('content_admin', 'manage_courses');
SELECT seed_tier_permission('content_admin', 'view_courses');
SELECT seed_tier_permission('content_admin', 'manage_sessions');
SELECT seed_tier_permission('content_admin', 'view_sessions');
SELECT seed_tier_permission('content_admin', 'manage_curriculum');
SELECT seed_tier_permission('content_admin', 'view_analytics');

-- ANALYTICS_ADMIN: View analytics, users, courses
SELECT seed_tier_permission('analytics_admin', 'view_analytics');
SELECT seed_tier_permission('analytics_admin', 'view_users');
SELECT seed_tier_permission('analytics_admin', 'view_courses');

-- SUPPORT_ADMIN: View users, manage support, view analytics
SELECT seed_tier_permission('support_admin', 'view_users');
SELECT seed_tier_permission('support_admin', 'manage_support');
SELECT seed_tier_permission('support_admin', 'view_analytics');

-- TEACHER: View courses, manage sessions (own only - enforced by RLS)
SELECT seed_tier_permission('teacher', 'view_courses');
SELECT seed_tier_permission('teacher', 'manage_sessions');

-- Clean up helper function
DROP FUNCTION IF EXISTS seed_tier_permission;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CREATE HAS_PERMISSION FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

-- Main permission check function
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_tier admin_tier;
  v_has_permission BOOLEAN;
BEGIN
  -- Get the user's admin tier
  SELECT admin_tier INTO v_admin_tier
  FROM users
  WHERE id = p_user_id;

  -- If user has no admin tier, they have no admin permissions
  IF v_admin_tier IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if the user's tier has the requested permission
  SELECT EXISTS (
    SELECT 1
    FROM admin_tier_permissions atp
    JOIN permissions p ON p.id = atp.permission_id
    WHERE atp.tier = v_admin_tier
    AND p.name = p_permission_name
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Convenience function that uses auth.uid()
CREATE OR REPLACE FUNCTION has_permission(p_permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_permission(auth.uid(), p_permission_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (permission_name TEXT, permission_description TEXT, category TEXT) AS $$
DECLARE
  v_admin_tier admin_tier;
BEGIN
  -- Get the user's admin tier
  SELECT u.admin_tier INTO v_admin_tier
  FROM users u
  WHERE u.id = p_user_id;

  -- Return permissions for the user's tier
  RETURN QUERY
  SELECT p.name, p.description, p.category
  FROM admin_tier_permissions atp
  JOIN permissions p ON p.id = atp.permission_id
  WHERE atp.tier = v_admin_tier
  ORDER BY p.category, p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is super admin (convenience)
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = v_user_id
    AND admin_tier = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. UPDATE RLS POLICIES FOR ADMIN ROUTES
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop existing policies that need updating
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view profiles" ON users;
  DROP POLICY IF EXISTS "Teachers can manage their courses" ON live_courses;
  DROP POLICY IF EXISTS "Teachers can manage sessions for their courses" ON live_sessions;
  DROP POLICY IF EXISTS "Teachers can manage enrollments for their sessions" ON session_enrollments;
  DROP POLICY IF EXISTS "Teachers can manage course enrollments" ON course_enrollments;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Users table: Permission-based viewing
CREATE POLICY "Users can view profiles" ON users
  FOR SELECT USING (
    id = auth.uid() OR
    has_permission('view_users') OR
    has_permission('manage_users')
  );

-- Users table: Only manage_users permission can update others
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update profiles" ON users
  FOR UPDATE USING (
    id = auth.uid() OR
    has_permission('manage_users')
  );

-- Live courses: Permission-based management
CREATE POLICY "Admins can manage all courses" ON live_courses
  FOR ALL USING (
    has_permission('manage_courses')
  );

CREATE POLICY "Teachers can manage their own courses" ON live_courses
  FOR ALL USING (
    teacher_id = auth.uid() AND
    has_permission('manage_sessions')
  );

-- Live sessions: Permission-based management
CREATE POLICY "Admins can manage all sessions" ON live_sessions
  FOR ALL USING (
    has_permission('manage_sessions') AND
    has_permission('manage_courses')
  );

CREATE POLICY "Teachers can manage their own sessions" ON live_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM live_courses
      WHERE id = course_id
      AND teacher_id = auth.uid()
    ) AND
    has_permission('manage_sessions')
  );

-- Session enrollments: Permission-based management
CREATE POLICY "Admins can manage all session enrollments" ON session_enrollments
  FOR ALL USING (
    has_permission('manage_users') OR
    has_permission('manage_support')
  );

CREATE POLICY "Teachers can manage their session enrollments" ON session_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls
      JOIN live_courses lc ON ls.course_id = lc.id
      WHERE ls.id = session_enrollments.session_id
      AND lc.teacher_id = auth.uid()
    )
  );

-- Course enrollments: Permission-based management
CREATE POLICY "Admins can manage all course enrollments" ON course_enrollments
  FOR ALL USING (
    has_permission('manage_users') OR
    has_permission('manage_support')
  );

CREATE POLICY "Teachers can manage their course enrollments" ON course_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM live_courses
      WHERE id = course_id
      AND teacher_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ADDITIONAL HELPER VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- View to see all tier permissions (useful for admin UI)
CREATE OR REPLACE VIEW v_tier_permissions AS
SELECT
  atp.tier,
  p.name AS permission_name,
  p.description AS permission_description,
  p.category
FROM admin_tier_permissions atp
JOIN permissions p ON p.id = atp.permission_id
ORDER BY atp.tier, p.category, p.name;

-- View to see admin users with their permissions count
CREATE OR REPLACE VIEW v_admin_users AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.admin_tier,
  u.role,
  (SELECT COUNT(*) FROM admin_tier_permissions WHERE tier = u.admin_tier) AS permission_count,
  u.created_at
FROM users u
WHERE u.admin_tier IS NOT NULL
ORDER BY
  CASE u.admin_tier
    WHEN 'super_admin' THEN 1
    WHEN 'content_admin' THEN 2
    WHEN 'analytics_admin' THEN 3
    WHEN 'support_admin' THEN 4
    WHEN 'teacher' THEN 5
  END;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. GRANT NECESSARY PERMISSIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Grant usage on types
GRANT USAGE ON TYPE admin_tier TO authenticated;
GRANT USAGE ON TYPE admin_tier TO service_role;

-- Grant select on views
GRANT SELECT ON v_tier_permissions TO authenticated;
GRANT SELECT ON v_admin_users TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════
