/**
 * MILESTONE APPROVAL API
 * Called by the tutor when a milestone is completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createServerSupabaseClient()) as any;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { path, milestoneNumber, feedback } = body as {
      path: 'owner' | 'employee' | 'student';
      milestoneNumber: number;
      feedback?: string;
    };

    if (!path || !milestoneNumber) {
      return NextResponse.json({ error: 'Path and milestone number are required' }, { status: 400 });
    }

    // Approve current milestone
    const { error: approveError } = await supabase
      .from('user_milestones')
      .update({
        status: 'approved',
        feedback: feedback || null,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('path', path)
      .eq('milestone_number', milestoneNumber);

    if (approveError) {
      console.error('Error approving milestone:', approveError);
      return NextResponse.json({ error: 'Failed to approve milestone' }, { status: 500 });
    }

    // Unlock next milestone
    await supabase
      .from('user_milestones')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('path', path)
      .eq('milestone_number', milestoneNumber + 1)
      .eq('status', 'locked');

    // Update conversation's current milestone
    await supabase
      .from('tutor_conversations')
      .update({
        current_milestone: Math.min(milestoneNumber + 1, 10),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('path', path);

    // Get updated progress
    const { data: milestones } = await supabase
      .from('user_milestones')
      .select('status')
      .eq('user_id', user.id)
      .eq('path', path);

    const approvedCount = milestones?.filter((m: { status: string }) => m.status === 'approved').length || 0;
    const progress = {
      total_milestones: 10,
      approved_milestones: approvedCount,
      completion_percentage: (approvedCount / 10) * 100,
    };

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Milestone approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
