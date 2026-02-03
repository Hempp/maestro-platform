/**
 * PROJECTS API
 * CRUD operations for user projects
 *
 * Note: Uses in-memory storage for demo. In production,
 * create a 'projects' table in Supabase.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed';
  progress: number;
  tech: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage keyed by user ID
const userProjects = new Map<string, Project[]>();

// GET: Fetch user's projects
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const projects = userProjects.get(user.id) || [];

    // Sort by updated date
    const sortedProjects = [...projects].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const stats = {
      total: projects.length,
      completed: projects.filter((p) => p.status === 'completed').length,
      inProgress: projects.filter((p) => p.status === 'in-progress').length,
      planning: projects.filter((p) => p.status === 'planning').length,
    };

    return NextResponse.json({ projects: sortedProjects, stats });
  } catch (error) {
    console.error('Projects GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST: Create new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, tech, repoUrl, liveUrl } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      title: title.trim(),
      description: description?.trim() || '',
      status: 'planning',
      progress: 0,
      tech: tech || [],
      repoUrl: repoUrl || null,
      liveUrl: liveUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!userProjects.has(user.id)) {
      userProjects.set(user.id, []);
    }
    userProjects.get(user.id)!.unshift(newProject);

    return NextResponse.json({ project: newProject, message: 'Project created' });
  } catch (error) {
    console.error('Projects POST error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// PATCH: Update project
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, status, progress, tech, repoUrl, liveUrl } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const projects = userProjects.get(user.id) || [];
    const projectIndex = projects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatedProject: Project = {
      ...projects[projectIndex],
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(status !== undefined && { status }),
      ...(progress !== undefined && { progress: Math.min(100, Math.max(0, progress)) }),
      ...(tech !== undefined && { tech }),
      ...(repoUrl !== undefined && { repoUrl }),
      ...(liveUrl !== undefined && { liveUrl }),
      updatedAt: new Date().toISOString(),
    };

    projects[projectIndex] = updatedProject;

    return NextResponse.json({ project: updatedProject, message: 'Project updated' });
  } catch (error) {
    console.error('Projects PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE: Delete project
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const projects = userProjects.get(user.id) || [];
    const projectIndex = projects.findIndex((p) => p.id === id);

    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    projects.splice(projectIndex, 1);

    return NextResponse.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Projects DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
