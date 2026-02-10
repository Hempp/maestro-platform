/**
 * USAGE TRACKING API
 * GET: Returns current usage for the authenticated user
 * POST: Increments usage for a specific feature
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/security';

type FeatureType = 'tutor' | 'agent' | 'skill';

const FEATURE_FUNCTIONS: Record<FeatureType, string> = {
  tutor: 'increment_tutor_sessions',
  agent: 'increment_agent_executions',
  skill: 'increment_skill_uses',
};

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, supabase, error };
}

export async function GET(request: NextRequest) {
  // Rate limit read operations more generously
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.read);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser();

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

export async function POST(request: NextRequest) {
  // Rate limit API mutations
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feature } = await request.json() as { feature: FeatureType };

    if (!feature || !FEATURE_FUNCTIONS[feature]) {
      return NextResponse.json(
        { error: 'Invalid feature. Must be one of: tutor, agent, skill' },
        { status: 400 }
      );
    }

    const { data, error } = await (supabase as any).rpc(FEATURE_FUNCTIONS[feature], {
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
