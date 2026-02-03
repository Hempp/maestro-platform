/**
 * DISCUSSIONS API
 * Forum-style discussions with threads and replies
 *
 * Note: Uses in-memory storage for demo. In production,
 * create 'discussions' and 'discussion_replies' tables in Supabase.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Discussion {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  content: string;
  category: 'general' | 'help' | 'showcase' | 'resources';
  tags: string[];
  pinned: boolean;
  replies: number;
  views: number;
  lastReplyAt: string | null;
  lastReplyBy: string | null;
  createdAt: string;
}

// In-memory storage
const discussions: Discussion[] = [
  {
    id: 'seed-1',
    authorId: 'system',
    authorName: 'Phazur Team',
    authorAvatar: null,
    title: 'Welcome to Discussions! Introduce yourself here',
    content: 'Tell the community about yourself, what you\'re learning, and what you hope to build with AI.',
    category: 'general',
    tags: ['Welcome', 'Introductions'],
    pinned: true,
    replies: 12,
    views: 245,
    lastReplyAt: new Date(Date.now() - 3600000).toISOString(),
    lastReplyBy: 'Community Member',
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
  },
  {
    id: 'seed-2',
    authorId: 'system',
    authorName: 'Phazur Team',
    authorAvatar: null,
    title: 'Best practices for prompt engineering?',
    content: 'What techniques have worked best for you when crafting prompts? Share your tips!',
    category: 'help',
    tags: ['AI', 'Tips'],
    pinned: true,
    replies: 23,
    views: 156,
    lastReplyAt: new Date(Date.now() - 600000).toISOString(),
    lastReplyBy: 'Alex Chen',
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
];

// Category counts
const getCategoryCounts = () => ({
  general: discussions.filter((d) => d.category === 'general').length,
  help: discussions.filter((d) => d.category === 'help').length,
  showcase: discussions.filter((d) => d.category === 'showcase').length,
  resources: discussions.filter((d) => d.category === 'resources').length,
});

// GET: Fetch discussions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filtered = [...discussions];

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter((d) => d.category === category);
    }

    // Search in title and content
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.content.toLowerCase().includes(searchLower) ||
          d.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    // Sort: pinned first, then by last activity
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aTime = a.lastReplyAt || a.createdAt;
      const bTime = b.lastReplyAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      discussions: paginated,
      categories: getCategoryCounts(),
      total: filtered.length,
      hasMore: offset + limit < filtered.length,
    });
  } catch (error) {
    console.error('Discussions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 });
  }
}

// POST: Create new discussion
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, tags } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    const newDiscussion: Discussion = {
      id: `disc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      authorId: user.id,
      authorName: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
      authorAvatar: profile?.avatar_url || null,
      title: title.trim(),
      content: content.trim(),
      category: category || 'general',
      tags: tags || [],
      pinned: false,
      replies: 0,
      views: 0,
      lastReplyAt: null,
      lastReplyBy: null,
      createdAt: new Date().toISOString(),
    };

    discussions.unshift(newDiscussion);

    return NextResponse.json({ discussion: newDiscussion, message: 'Discussion created' });
  } catch (error) {
    console.error('Discussions POST error:', error);
    return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 });
  }
}
