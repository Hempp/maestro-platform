/**
 * USAGE TRACKING API
 * GET: Returns current usage for the authenticated user
 * POST: Increments usage for a specific feature
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current usage using the database function
    const { data, error } = await (supabase as any).rpc('get_current_usage', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error fetching usage:', error);
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }

    // Data comes as array from table-returning function
    const usage = data?.[0] || {
      tutor_sessions: 0,
      agent_executions: 0,
      skill_uses: 0,
      period_start: null,
      period_end: null,
    };

    return NextResponse.json({ usage });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

type FeatureType = 'tutor' | 'agent' | 'skill';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const feature = body.feature as FeatureType;

    if (!feature || !['tutor', 'agent', 'skill'].includes(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature. Must be one of: tutor, agent, skill' },
        { status: 400 }
      );
    }

    // Map feature to increment function
    const functionMap: Record<FeatureType, string> = {
      tutor: 'increment_tutor_sessions',
      agent: 'increment_agent_executions',
      skill: 'increment_skill_uses',
    };

    const { data, error } = await (supabase as any).rpc(functionMap[feature], {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error incrementing usage:', error);
      return NextResponse.json({ error: 'Failed to increment usage' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      newCount: data,
      feature,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
