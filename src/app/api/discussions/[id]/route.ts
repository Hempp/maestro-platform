/**
 * SINGLE DISCUSSION API
 * Get, update view count, or reply to a discussion
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// In-memory discussion storage (shared reference would be needed in production)
// For now, this just handles view increments

const viewCounts = new Map<string, number>();

// GET: Get discussion and increment view count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Increment view count
    const currentViews = viewCounts.get(id) || 0;
    viewCounts.set(id, currentViews + 1);

    return NextResponse.json({
      viewed: true,
      viewCount: currentViews + 1,
    });
  } catch (error) {
    console.error('Discussion GET error:', error);
    return NextResponse.json({ error: 'Failed to get discussion' }, { status: 500 });
  }
}

// POST: Add reply to discussion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    const reply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      discussionId: id,
      authorId: user.id,
      authorName: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
      authorAvatar: profile?.avatar_url || null,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      reply,
      message: 'Reply added',
    });
  } catch (error) {
    console.error('Discussion reply error:', error);
    return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 });
  }
}
