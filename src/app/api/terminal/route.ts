/**
 * TERMINAL HISTORY API
 * Save and retrieve terminal command history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ history: [] });
    }

    const { data: history, error } = await supabase
      .from('terminal_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch terminal history:', error);
      return NextResponse.json({ history: [] });
    }

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error('Terminal history error:', error);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { command, output, status, executionTime } = await request.json();

    if (!command) {
      return NextResponse.json(
        { success: false, error: 'No command provided' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Still return success for non-authenticated users
      return NextResponse.json({ success: true, saved: false });
    }

    const { error } = await supabase.from('terminal_history').insert({
      user_id: user.id,
      command,
      output: output || '',
      status: status || 'success',
      execution_time: executionTime || 0,
    });

    if (error) {
      console.error('Failed to save terminal history:', error);
      return NextResponse.json({ success: true, saved: false });
    }

    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error('Terminal save error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save' },
      { status: 500 }
    );
  }
}
