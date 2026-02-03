/**
 * COMMUNITY POST LIKE API
 * Toggle like on a post
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Reference to in-memory posts (shared with parent route)
// In production, this would be a database operation
interface Post {
  id: string;
  likes: number;
  likedBy: string[];
}

// Simple in-memory like tracking (for demo)
const postLikes = new Map<string, Set<string>>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get or create like set for this post
    if (!postLikes.has(postId)) {
      postLikes.set(postId, new Set());
    }

    const likes = postLikes.get(postId)!;
    const wasLiked = likes.has(user.id);

    if (wasLiked) {
      likes.delete(user.id);
    } else {
      likes.add(user.id);
    }

    return NextResponse.json({
      liked: !wasLiked,
      likeCount: likes.size,
    });
  } catch (error) {
    console.error('Like API error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
