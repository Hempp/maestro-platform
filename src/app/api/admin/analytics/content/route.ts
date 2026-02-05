/**
 * CONTENT HEALTH ANALYTICS API
 * Returns content performance metrics, health scores, and gap analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Types
interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'interactive' | 'text' | 'project';
  tier: 'student' | 'employee' | 'owner';
  course: string;
  module: string;
  completionRate: number;
  avgTimeSpent: number;
  dropOffRate: number;
  struggleScore: number;
  engagementScore: number;
  totalAttempts: number;
  lastUpdated: string;
  createdAt: string;
  status: 'healthy' | 'warning' | 'critical';
  flaggedForReview: boolean;
}

interface ContentGap {
  topic: string;
  strugglePercentage: number;
  affectedLearners: number;
  suggestedAction: string;
}

interface EngagementByType {
  type: string;
  avgEngagement: number;
  avgCompletion: number;
  count: number;
}

// Mock data generator for realistic content health data
function generateMockContentData(): ContentItem[] {
  const contentTypes: Array<'video' | 'interactive' | 'text' | 'project'> = ['video', 'interactive', 'text', 'project'];
  const tiers: Array<'student' | 'employee' | 'owner'> = ['student', 'employee', 'owner'];

  const courses = [
    { name: 'AI Fundamentals', modules: ['Introduction to AI', 'Machine Learning Basics', 'Neural Networks', 'AI Ethics'] },
    { name: 'Prompt Engineering', modules: ['Basics of Prompting', 'Advanced Techniques', 'Chain of Thought', 'Best Practices'] },
    { name: 'Workflow Automation', modules: ['Getting Started', 'Integration Patterns', 'Error Handling', 'Optimization'] },
    { name: 'Data Analysis with AI', modules: ['Data Preparation', 'AI-Powered Analysis', 'Visualization', 'Reporting'] },
    { name: 'AI for Business', modules: ['Use Case Discovery', 'ROI Analysis', 'Implementation Strategy', 'Change Management'] },
  ];

  const contentTitles = [
    // Video content
    'Introduction to Large Language Models',
    'Understanding Token Limits',
    'Building Your First AI Workflow',
    'Advanced Prompt Techniques Demo',
    'Real-World AI Case Studies',
    'Setting Up API Integrations',
    'Debugging AI Responses',
    'Performance Optimization Tips',

    // Interactive content
    'Prompt Crafting Exercise',
    'API Connection Lab',
    'Workflow Builder Practice',
    'Error Handling Simulation',
    'Data Pipeline Challenge',
    'Integration Testing Workshop',

    // Text content
    'AI Ethics Guidelines',
    'Best Practices Documentation',
    'API Reference Guide',
    'Troubleshooting Common Issues',
    'Security Considerations',
    'Compliance Requirements',

    // Project content
    'Build a Customer Service Bot',
    'Create an Automated Report Generator',
    'Design a Content Moderation System',
    'Implement a Knowledge Base Search',
    'Deploy a Document Analyzer',
  ];

  const content: ContentItem[] = [];

  contentTitles.forEach((title, index) => {
    const type = contentTypes[index % 4];
    const tier = tiers[index % 3];
    const courseIndex = index % courses.length;
    const course = courses[courseIndex];
    const moduleIndex = index % course.modules.length;

    // Generate realistic performance metrics
    // Some content will be healthy, some will have issues
    const isProblematic = index % 5 === 0 || index % 7 === 0;
    const isHighPerformer = index % 4 === 0 && !isProblematic;

    let completionRate: number;
    let dropOffRate: number;
    let struggleScore: number;
    let engagementScore: number;

    if (isProblematic) {
      completionRate = Math.floor(Math.random() * 30) + 35; // 35-65%
      dropOffRate = Math.floor(Math.random() * 25) + 30; // 30-55%
      struggleScore = Math.floor(Math.random() * 30) + 60; // 60-90
      engagementScore = Math.floor(Math.random() * 25) + 30; // 30-55%
    } else if (isHighPerformer) {
      completionRate = Math.floor(Math.random() * 15) + 85; // 85-100%
      dropOffRate = Math.floor(Math.random() * 10) + 5; // 5-15%
      struggleScore = Math.floor(Math.random() * 20) + 10; // 10-30
      engagementScore = Math.floor(Math.random() * 15) + 80; // 80-95%
    } else {
      completionRate = Math.floor(Math.random() * 20) + 65; // 65-85%
      dropOffRate = Math.floor(Math.random() * 15) + 15; // 15-30%
      struggleScore = Math.floor(Math.random() * 25) + 30; // 30-55
      engagementScore = Math.floor(Math.random() * 20) + 55; // 55-75%
    }

    // Determine health status
    let status: 'healthy' | 'warning' | 'critical';
    if (struggleScore >= 70 || dropOffRate >= 40 || completionRate <= 40) {
      status = 'critical';
    } else if (struggleScore >= 50 || dropOffRate >= 25 || completionRate <= 60) {
      status = 'warning';
    } else {
      status = 'healthy';
    }

    // Generate dates
    const now = new Date();
    const createdDaysAgo = Math.floor(Math.random() * 365) + 30; // 30-395 days ago
    const updatedDaysAgo = Math.floor(Math.random() * Math.min(createdDaysAgo, 180)); // Up to 180 days ago or creation date

    const createdAt = new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString();
    const lastUpdated = new Date(now.getTime() - updatedDaysAgo * 24 * 60 * 60 * 1000).toISOString();

    content.push({
      id: `aku-${String(index + 1).padStart(4, '0')}`,
      title,
      type,
      tier,
      course: course.name,
      module: course.modules[moduleIndex],
      completionRate,
      avgTimeSpent: type === 'video' ? Math.floor(Math.random() * 15) + 8 :
                    type === 'project' ? Math.floor(Math.random() * 45) + 30 :
                    type === 'interactive' ? Math.floor(Math.random() * 20) + 15 :
                    Math.floor(Math.random() * 10) + 5,
      dropOffRate,
      struggleScore,
      engagementScore,
      totalAttempts: Math.floor(Math.random() * 500) + 50,
      lastUpdated,
      createdAt,
      status,
      flaggedForReview: status === 'critical' || (status === 'warning' && Math.random() > 0.5),
    });
  });

  return content;
}

function generateMockGaps(): ContentGap[] {
  return [
    {
      topic: 'API Rate Limiting',
      strugglePercentage: 78,
      affectedLearners: 234,
      suggestedAction: 'Add practical examples and error handling guide',
    },
    {
      topic: 'Token Optimization',
      strugglePercentage: 65,
      affectedLearners: 189,
      suggestedAction: 'Create interactive token counter exercise',
    },
    {
      topic: 'Prompt Chaining',
      strugglePercentage: 58,
      affectedLearners: 156,
      suggestedAction: 'Add step-by-step video walkthrough',
    },
    {
      topic: 'Error Debugging',
      strugglePercentage: 52,
      affectedLearners: 142,
      suggestedAction: 'Build troubleshooting decision tree',
    },
    {
      topic: 'Context Window Management',
      strugglePercentage: 48,
      affectedLearners: 128,
      suggestedAction: 'Create visual diagram of context flow',
    },
    {
      topic: 'Model Selection',
      strugglePercentage: 42,
      affectedLearners: 98,
      suggestedAction: 'Add comparison table with use cases',
    },
  ];
}

function calculateEngagementByType(content: ContentItem[]): EngagementByType[] {
  const types = ['video', 'interactive', 'text', 'project'];

  return types.map(type => {
    const filtered = content.filter(c => c.type === type);
    const count = filtered.length;

    if (count === 0) {
      return { type, avgEngagement: 0, avgCompletion: 0, count: 0 };
    }

    const avgEngagement = Math.round(
      filtered.reduce((sum, c) => sum + c.engagementScore, 0) / count
    );
    const avgCompletion = Math.round(
      filtered.reduce((sum, c) => sum + c.completionRate, 0) / count
    );

    return { type, avgEngagement, avgCompletion, count };
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check admin/teacher role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'teacher'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const tierFilter = searchParams.get('tier') || 'all';
    const sortField = searchParams.get('sortField') || 'struggleScore';
    const sortDirection = searchParams.get('sortDirection') || 'desc';

    // Generate mock data
    // In production, this would fetch from the database
    let content = generateMockContentData();

    // Apply filters
    if (typeFilter !== 'all') {
      content = content.filter(c => c.type === typeFilter);
    }
    if (statusFilter !== 'all') {
      content = content.filter(c => c.status === statusFilter);
    }
    if (tierFilter !== 'all') {
      content = content.filter(c => c.tier === tierFilter);
    }

    // Apply sorting
    const sortMultiplier = sortDirection === 'asc' ? 1 : -1;
    content.sort((a, b) => {
      const aVal = a[sortField as keyof ContentItem];
      const bVal = b[sortField as keyof ContentItem];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * sortMultiplier;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * sortMultiplier;
      }
      return 0;
    });

    // Calculate stats
    const allContent = generateMockContentData(); // Use unfiltered for stats
    const stats = {
      totalAkus: allContent.length,
      avgCompletionRate: Math.round(
        allContent.reduce((sum, c) => sum + c.completionRate, 0) / allContent.length
      ),
      contentWithIssues: allContent.filter(c => c.status !== 'healthy').length,
      totalLearners: 1247, // Mock total learner count
    };

    // Generate gap analysis
    const gaps = generateMockGaps();

    // Calculate engagement by type
    const engagementByType = calculateEngagementByType(allContent);

    return NextResponse.json({
      stats,
      content,
      gaps,
      engagementByType,
    });
  } catch (error) {
    console.error('Content health API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content health data' },
      { status: 500 }
    );
  }
}

// POST endpoint for updating content status (flag for review, archive, etc.)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check admin/teacher role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'teacher'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action, contentId } = body;

    if (!action || !contentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In production, this would update the database
    // For now, we return a success response
    switch (action) {
      case 'flag':
        // Flag content for review
        return NextResponse.json({
          success: true,
          message: `Content ${contentId} flagged for review`
        });

      case 'archive':
        // Archive content
        return NextResponse.json({
          success: true,
          message: `Content ${contentId} archived`
        });

      case 'unflag':
        // Remove flag from content
        return NextResponse.json({
          success: true,
          message: `Flag removed from content ${contentId}`
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Content health API error:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}
