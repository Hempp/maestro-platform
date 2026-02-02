/**
 * PUBLIC SESSIONS API
 * Get available live sessions for learners (with tier-based access)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get user tier if authenticated
    let userTier = 'student';
    if (user) {
      const { data: userData } = await (supabase as any)
        .from('users')
        .select('tier')
        .eq('id', user.id)
        .single();
      userTier = (userData?.tier as string) || 'student';
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'scheduled';
    const includeAll = searchParams.get('includeAll') === 'true';

    // Get sessions
    let query = (supabase as any)
      .from('live_sessions')
      .select(`
        id,
        title,
        description,
        scheduled_at,
        duration_minutes,
        platform,
        target_tier,
        seat_price,
        max_seats,
        status,
        course:live_courses (
          id,
          title,
          description
        )
      `)
      .order('scheduled_at', { ascending: true });

    if (!includeAll) {
      query = query.eq('status', status);
      if (status === 'scheduled') {
        query = query.gte('scheduled_at', new Date().toISOString());
      }
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    // Get enrollment counts and user's purchase status
    const sessionsWithAccess = await Promise.all(
      (sessions || []).map(async (session: any) => {
        // Get enrollment count
        const { count: enrollmentCount } = await (supabase as any)
          .from('session_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);

        // Check user's access
        let hasAccess = false;
        let hasPurchased = false;
        let isEnrolled = false;

        if (user) {
          // Check tier-based access
          if (userTier === 'owner') {
            hasAccess = true;
          } else if (userTier === 'employee' && ['student', 'employee'].includes(session.target_tier)) {
            hasAccess = true;
          } else if (userTier === 'student' && session.target_tier === 'student') {
            hasAccess = true;
          }

          // Check if purchased
          if (!hasAccess) {
            const { data: purchase } = await (supabase as any)
              .from('seat_purchases')
              .select('id')
              .eq('session_id', session.id)
              .eq('user_id', user.id)
              .eq('payment_status', 'completed')
              .single();

            if (purchase) {
              hasPurchased = true;
              hasAccess = true;
            }
          }

          // Check if enrolled
          const { data: enrollment } = await (supabase as any)
            .from('session_enrollments')
            .select('id')
            .eq('session_id', session.id)
            .eq('student_id', user.id)
            .single();

          isEnrolled = !!enrollment;
        }

        return {
          ...session,
          enrollmentCount: enrollmentCount || 0,
          seatsAvailable: (session.max_seats || 100) - (enrollmentCount || 0),
          userAccess: {
            hasAccess,
            hasPurchased,
            isEnrolled,
            requiresPurchase: !hasAccess && session.target_tier !== 'student',
            price: hasAccess ? 0 : session.seat_price,
          },
        };
      })
    );

    return NextResponse.json({
      sessions: sessionsWithAccess,
      userTier,
    });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST: Enroll in a session (free access only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get user tier
    const { data: userData } = await (supabase as any)
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    const userTier = (userData?.tier as string) || 'student';

    // Get session
    const { data: session, error: sessionError } = await (supabase as any)
      .from('live_sessions')
      .select('id, target_tier, max_seats')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check tier access
    let hasAccess = false;
    if (userTier === 'owner') {
      hasAccess = true;
    } else if (userTier === 'employee' && ['student', 'employee'].includes(session.target_tier)) {
      hasAccess = true;
    } else if (userTier === 'student' && session.target_tier === 'student') {
      hasAccess = true;
    }

    // Check if purchased
    if (!hasAccess) {
      const { data: purchase } = await (supabase as any)
        .from('seat_purchases')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .single();

      if (purchase) hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'You need to purchase a seat to enroll' }, { status: 403 });
    }

    // Check seat availability
    const { count: enrollmentCount } = await (supabase as any)
      .from('session_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if ((enrollmentCount || 0) >= (session.max_seats || 100)) {
      return NextResponse.json({ error: 'No seats available' }, { status: 400 });
    }

    // Check if already enrolled
    const { data: existing } = await (supabase as any)
      .from('session_enrollments')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
    }

    // Enroll
    const { data: enrollment, error } = await (supabase as any)
      .from('session_enrollments')
      .insert({
        session_id: sessionId,
        student_id: user.id,
        access_type: 'tier_included',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Enroll error:', error);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}
