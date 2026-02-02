/**
 * ADMIN COURSES API
 * CRUD operations for live courses
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function checkAdminRole(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authorized: false, user: null, role: null };

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userData?.role as string | null | undefined;
  const authorized = role === 'admin' || role === 'teacher';
  return { authorized, user, role };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, user, role } = await checkAdminRole(supabase);

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = (supabase as any)
      .from('live_courses')
      .select(`
        *,
        teacher:users!teacher_id (
          id,
          full_name,
          email,
          avatar_url
        ),
        sessions:live_sessions (
          id,
          title,
          scheduled_at,
          status
        ),
        enrollments:course_enrollments (
          id,
          student_id
        )
      `)
      .order('created_at', { ascending: false });

    // Teachers only see their own courses, admins see all
    if (role === 'teacher') {
      query = query.eq('teacher_id', user.id);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: courses, error } = await query;

    if (error) throw error;

    // Add enrollment count
    const coursesWithCounts = (courses || []).map((course: any) => ({
      ...course,
      enrollmentCount: course.enrollments?.length || 0,
      upcomingSessions: course.sessions?.filter(
        (s: { status: string; scheduled_at: string }) =>
          s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
      ).length || 0,
    }));

    return NextResponse.json({ courses: coursesWithCounts });
  } catch (error) {
    console.error('Admin courses GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, user } = await checkAdminRole(supabase);

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, tier, maxStudents, schedule, thumbnailUrl } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: course, error } = await (supabase as any)
      .from('live_courses')
      .insert({
        title,
        description,
        teacher_id: user.id,
        tier: tier || null,
        max_students: maxStudents || 30,
        schedule: schedule || {},
        thumbnail_url: thumbnailUrl,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error('Admin courses POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, user, role } = await checkAdminRole(supabase);

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, updates } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    // Check ownership (unless admin)
    if (role === 'teacher') {
      const { data: course } = await (supabase as any)
        .from('live_courses')
        .select('teacher_id')
        .eq('id', courseId)
        .single();

      if ((course as any)?.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Not your course' }, { status: 403 });
      }
    }

    const allowedUpdates: Record<string, unknown> = {};
    if (updates.title) allowedUpdates.title = updates.title;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;
    if (updates.tier !== undefined) allowedUpdates.tier = updates.tier;
    if (updates.maxStudents) allowedUpdates.max_students = updates.maxStudents;
    if (updates.schedule) allowedUpdates.schedule = updates.schedule;
    if (updates.thumbnailUrl !== undefined) allowedUpdates.thumbnail_url = updates.thumbnailUrl;
    if (updates.isActive !== undefined) allowedUpdates.is_active = updates.isActive;

    const { data: course, error } = await (supabase as any)
      .from('live_courses')
      .update(allowedUpdates)
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Admin courses PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, user, role } = await checkAdminRole(supabase);

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    // Check ownership (unless admin)
    if (role === 'teacher') {
      const { data: course } = await (supabase as any)
        .from('live_courses')
        .select('teacher_id')
        .eq('id', courseId)
        .single();

      if ((course as any)?.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Not your course' }, { status: 403 });
      }
    }

    const { error } = await (supabase as any)
      .from('live_courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin courses DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
