/**
 * ADMIN SESSIONS API
 * CRUD operations for live sessions with Google Meet/Zoom
 * Supports tiered access (student/employee/owner) with seat purchases
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
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';

    let query = (supabase as any)
      .from('live_sessions')
      .select(`
        *,
        course:live_courses (
          id,
          title,
          teacher_id,
          tier
        ),
        enrollments:session_enrollments (
          id,
          student_id,
          attended,
          joined_at,
          student:users!student_id (
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .order('scheduled_at', { ascending: true });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (upcoming) {
      query = query
        .gte('scheduled_at', new Date().toISOString())
        .in('status', ['scheduled', 'live']);
    }

    // Teachers only see sessions for their courses
    if (role === 'teacher') {
      const { data: teacherCourses } = await (supabase as any)
        .from('live_courses')
        .select('id')
        .eq('teacher_id', user.id);

      const courseIds = teacherCourses?.map((c: any) => c.id) || [];
      if (courseIds.length > 0) {
        query = query.in('course_id', courseIds);
      } else {
        return NextResponse.json({ sessions: [] });
      }
    }

    const { data: sessions, error } = await query;

    if (error) {
      // Handle missing table gracefully
      if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
        return NextResponse.json({ sessions: [] });
      }
      throw error;
    }

    // Add attendance count
    const sessionsWithCounts = (sessions || []).map((session: any) => ({
      ...session,
      enrollmentCount: session.enrollments?.length || 0,
      attendedCount: session.enrollments?.filter((e: { attended: boolean }) => e.attended).length || 0,
    }));

    return NextResponse.json({ sessions: sessionsWithCounts });
  } catch (error) {
    console.error('Admin sessions GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { authorized, user, role } = await checkAdminRole(supabase);

    if (!authorized || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      courseId,
      title,
      description,
      scheduledAt,
      durationMinutes,
      googleMeetLink,
      zoomLink,
      platform,
      targetTier,
      seatPrice,
      maxSeats,
      earlyBirdPrice,
      earlyBirdDeadline,
    } = body;

    if (!courseId || !title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Course ID, title, and scheduled time are required' },
        { status: 400 }
      );
    }

    // Check course ownership (unless admin)
    if (role === 'teacher') {
      const { data: course } = await (supabase as any)
        .from('live_courses')
        .select('teacher_id')
        .eq('id', courseId)
        .single();

      if (course?.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Not your course' }, { status: 403 });
      }
    }

    const { data: session, error } = await (supabase as any)
      .from('live_sessions')
      .insert({
        course_id: courseId,
        title,
        description,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes || 60,
        google_meet_link: googleMeetLink,
        zoom_link: zoomLink,
        platform: platform || 'google_meet',
        target_tier: targetTier || 'student',
        seat_price: seatPrice || 0,
        max_seats: maxSeats || 100,
        early_bird_price: earlyBirdPrice,
        early_bird_deadline: earlyBirdDeadline,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Admin sessions POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
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
    const { sessionId, updates } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Check ownership via course (unless admin)
    if (role === 'teacher') {
      const { data: session } = await (supabase as any)
        .from('live_sessions')
        .select('course:live_courses(teacher_id)')
        .eq('id', sessionId)
        .single();

      const teacherId = (session?.course as { teacher_id: string } | null)?.teacher_id;
      if (teacherId !== user.id) {
        return NextResponse.json({ error: 'Not your session' }, { status: 403 });
      }
    }

    const allowedUpdates: Record<string, unknown> = {};
    if (updates.title) allowedUpdates.title = updates.title;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;
    if (updates.scheduledAt) allowedUpdates.scheduled_at = updates.scheduledAt;
    if (updates.durationMinutes) allowedUpdates.duration_minutes = updates.durationMinutes;
    if (updates.googleMeetLink !== undefined) allowedUpdates.google_meet_link = updates.googleMeetLink;
    if (updates.zoomLink !== undefined) allowedUpdates.zoom_link = updates.zoomLink;
    if (updates.platform) allowedUpdates.platform = updates.platform;
    if (updates.targetTier) allowedUpdates.target_tier = updates.targetTier;
    if (updates.seatPrice !== undefined) allowedUpdates.seat_price = updates.seatPrice;
    if (updates.maxSeats !== undefined) allowedUpdates.max_seats = updates.maxSeats;
    if (updates.earlyBirdPrice !== undefined) allowedUpdates.early_bird_price = updates.earlyBirdPrice;
    if (updates.earlyBirdDeadline !== undefined) allowedUpdates.early_bird_deadline = updates.earlyBirdDeadline;
    if (updates.status) allowedUpdates.status = updates.status;
    if (updates.recordingUrl !== undefined) allowedUpdates.recording_url = updates.recordingUrl;
    if (updates.notes !== undefined) allowedUpdates.notes = updates.notes;

    const { data: session, error } = await (supabase as any)
      .from('live_sessions')
      .update(allowedUpdates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Admin sessions PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
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
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Check ownership via course (unless admin)
    if (role === 'teacher') {
      const { data: session } = await (supabase as any)
        .from('live_sessions')
        .select('course:live_courses(teacher_id)')
        .eq('id', sessionId)
        .single();

      const teacherId = (session?.course as { teacher_id: string } | null)?.teacher_id;
      if (teacherId !== user.id) {
        return NextResponse.json({ error: 'Not your session' }, { status: 403 });
      }
    }

    const { error } = await (supabase as any)
      .from('live_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin sessions DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
