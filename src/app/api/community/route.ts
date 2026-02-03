/**
 * COMMUNITY POSTS API
 * CRUD operations for community feed posts
 *
 * Note: This uses in-memory storage for demo. In production,
 * create a 'community_posts' table in Supabase.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string | null;
  authorVerified: boolean;
  content: string;
  badges: string[];
  likes: number;
  comments: number;
  likedBy: string[];
  createdAt: string;
}

// In-memory storage for demo (replace with Supabase table in production)
const posts: Post[] = [
  {
    id: 'seed-1',
    authorId: 'system',
    authorName: 'Phazur Team',
    authorHandle: '@phazur',
    authorAvatar: null,
    authorVerified: true,
    content: 'Welcome to the Phazur community! Share your AI projects, ask questions, and connect with fellow learners. What are you building today?',
    badges: ['Team'],
    likes: 24,
    comments: 8,
    likedBy: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
];

// GET: Fetch posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Sort by newest first
    const sortedPosts = [...posts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const paginatedPosts = sortedPosts.slice(offset, offset + limit);

    // Add whether current user liked each post
    const postsWithUserLikes = paginatedPosts.map((post) => ({
      ...post,
      likedByCurrentUser: user ? post.likedBy.includes(user.id) : false,
    }));

    return NextResponse.json({
      posts: postsWithUserLikes,
      total: posts.length,
      hasMore: offset + limit < posts.length,
    });
  } catch (error) {
    console.error('Community GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST: Create new post
export async function POST(request: NextRequest) {
  try {
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

    if (content.length > 500) {
      return NextResponse.json({ error: 'Content too long (max 500 chars)' }, { status: 400 });
    }

    // Get user profile for author info
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .single() as { data: { full_name: string | null; email: string | null; avatar_url: string | null } | null };

    // Get certificates for badges
    // Note: Using type assertion since Supabase types may be out of sync
    const { data: certificates } = await supabase
      .from('certificates')
      .select('certificate_type')
      .eq('user_id', user.id) as { data: { certificate_type: string }[] | null };

    const badges = (certificates || []).map((c) => {
      const certNames: Record<string, string> = {
        student: 'Certified AI Associate',
        employee: 'Workflow Efficiency Lead',
        owner: 'AI Operations Master',
      };
      return certNames[c.certificate_type] || c.certificate_type;
    });

    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      authorId: user.id,
      authorName: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
      authorHandle: `@${(profile?.full_name || user.email?.split('@')[0] || 'user').toLowerCase().replace(/\s+/g, '')}`,
      authorAvatar: profile?.avatar_url || null,
      authorVerified: badges.length > 0,
      content: content.trim(),
      badges,
      likes: 0,
      comments: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
    };

    posts.unshift(newPost);

    return NextResponse.json({
      post: { ...newPost, likedByCurrentUser: false },
      message: 'Post created',
    });
  } catch (error) {
    console.error('Community POST error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
