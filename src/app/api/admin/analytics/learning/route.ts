/**
 * LEARNING EFFECTIVENESS ANALYTICS API (Firebase)
 * Returns comprehensive learning analytics with mock data
 * Supports filtering by learning path and date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CompletionMetrics {
  overallCompletionRate: number;
  avgTimeToComplete: number;
  totalEnrollments: number;
  totalCompletions: number;
  previousPeriod: {
    completionRate: number;
    avgTimeToComplete: number;
  };
}

interface StruggleDistribution {
  ranges: {
    label: string;
    min: number;
    max: number;
    count: number;
    percentage: number;
  }[];
  average: number;
  median: number;
}

interface ModulePerformance {
  id: string;
  title: string;
  category: string;
  completionRate: number;
  avgStruggleScore: number;
  dropOffRate: number;
  avgTimeMinutes: number;
  totalAttempts: number;
  hintsUsedAvg: number;
}

interface CertificateVelocity {
  path: string;
  pathLabel: string;
  avgDaysToComplete: number;
  medianDaysToComplete: number;
  fastestCompletion: number;
  slowestCompletion: number;
  totalCertificates: number;
  previousPeriodAvg: number;
}

interface FunnelStage {
  stage: string;
  stageLabel: string;
  count: number;
  percentage: number;
  dropOffFromPrevious: number;
}

interface LearningPathFunnel {
  path: string;
  pathLabel: string;
  stages: FunnelStage[];
}

interface AICoachingStats {
  totalInteractions: number;
  uniqueUsers: number;
  avgInteractionsPerUser: number;
  topTopics: { topic: string; count: number; percentage: number }[];
  effectivenessRate: number;
  avgResponseHelpfulness: number;
  escalationRate: number;
  previousPeriod: {
    totalInteractions: number;
    effectivenessRate: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateMockData(days: number, pathFilter?: string) {
  const seed = days + (pathFilter?.length || 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed + min * max) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };

  // Completion Metrics
  const baseCompletion = random(62, 78);
  const completion: CompletionMetrics = {
    overallCompletionRate: baseCompletion,
    avgTimeToComplete: random(18, 32),
    totalEnrollments: random(1200, 2500),
    totalCompletions: Math.floor(random(1200, 2500) * (baseCompletion / 100)),
    previousPeriod: {
      completionRate: baseCompletion - random(-5, 8),
      avgTimeToComplete: random(20, 35),
    },
  };

  // Struggle Distribution
  const totalLearners = random(800, 1500);
  const distribution = [
    { label: '0-20', min: 0, max: 20 },
    { label: '21-40', min: 21, max: 40 },
    { label: '41-60', min: 41, max: 60 },
    { label: '61-80', min: 61, max: 80 },
    { label: '81-100', min: 81, max: 100 },
  ];

  const weights = [0.25, 0.35, 0.22, 0.12, 0.06];
  let remaining = totalLearners;
  const ranges = distribution.map((d, i) => {
    const count =
      i === distribution.length - 1
        ? remaining
        : Math.floor(totalLearners * weights[i] + random(-20, 20));
    remaining -= count;
    return {
      ...d,
      count: Math.max(0, count),
      percentage: 0,
    };
  });

  const actualTotal = ranges.reduce((sum, r) => sum + r.count, 0);
  ranges.forEach(r => {
    r.percentage = Math.round((r.count / actualTotal) * 100);
  });

  const struggleDistribution: StruggleDistribution = {
    ranges,
    average: random(32, 48),
    median: random(28, 42),
  };

  // Module Performance
  const modules: ModulePerformance[] = [
    {
      id: 'aku-001',
      title: 'Introduction to AI Prompting',
      category: 'Prompt Engineering',
      completionRate: random(85, 95),
      avgStruggleScore: random(15, 28),
      dropOffRate: random(3, 8),
      avgTimeMinutes: random(8, 15),
      totalAttempts: random(800, 1200),
      hintsUsedAvg: random(5, 15) / 10,
    },
    {
      id: 'aku-002',
      title: 'Chain of Thought Techniques',
      category: 'Prompt Engineering',
      completionRate: random(72, 85),
      avgStruggleScore: random(30, 45),
      dropOffRate: random(8, 15),
      avgTimeMinutes: random(15, 25),
      totalAttempts: random(650, 950),
      hintsUsedAvg: random(12, 22) / 10,
    },
    {
      id: 'aku-003',
      title: 'API Integration Basics',
      category: 'API Integration',
      completionRate: random(65, 78),
      avgStruggleScore: random(40, 55),
      dropOffRate: random(12, 22),
      avgTimeMinutes: random(20, 35),
      totalAttempts: random(500, 750),
      hintsUsedAvg: random(18, 28) / 10,
    },
    {
      id: 'aku-004',
      title: 'Building RAG Pipelines',
      category: 'RAG Pipeline',
      completionRate: random(55, 68),
      avgStruggleScore: random(50, 65),
      dropOffRate: random(18, 30),
      avgTimeMinutes: random(30, 45),
      totalAttempts: random(350, 550),
      hintsUsedAvg: random(22, 32) / 10,
    },
    {
      id: 'aku-005',
      title: 'Vector Database Setup',
      category: 'RAG Pipeline',
      completionRate: random(58, 72),
      avgStruggleScore: random(45, 58),
      dropOffRate: random(15, 25),
      avgTimeMinutes: random(25, 40),
      totalAttempts: random(400, 600),
      hintsUsedAvg: random(20, 30) / 10,
    },
    {
      id: 'aku-006',
      title: 'Multi-Agent Orchestration',
      category: 'Agent Orchestration',
      completionRate: random(48, 62),
      avgStruggleScore: random(55, 72),
      dropOffRate: random(25, 38),
      avgTimeMinutes: random(35, 55),
      totalAttempts: random(280, 420),
      hintsUsedAvg: random(25, 38) / 10,
    },
    {
      id: 'aku-007',
      title: 'Claude Code Mastery',
      category: 'Tool Proficiency',
      completionRate: random(70, 82),
      avgStruggleScore: random(35, 48),
      dropOffRate: random(10, 18),
      avgTimeMinutes: random(18, 28),
      totalAttempts: random(550, 800),
      hintsUsedAvg: random(15, 25) / 10,
    },
    {
      id: 'aku-008',
      title: 'Workflow Automation',
      category: 'API Integration',
      completionRate: random(62, 75),
      avgStruggleScore: random(42, 55),
      dropOffRate: random(14, 24),
      avgTimeMinutes: random(22, 38),
      totalAttempts: random(450, 680),
      hintsUsedAvg: random(18, 28) / 10,
    },
  ];

  // Certificate Velocity
  const certificateVelocity: CertificateVelocity[] = [
    {
      path: 'student',
      pathLabel: 'AI Associate',
      avgDaysToComplete: random(25, 42),
      medianDaysToComplete: random(22, 38),
      fastestCompletion: random(12, 18),
      slowestCompletion: random(85, 120),
      totalCertificates: random(180, 350),
      previousPeriodAvg: random(28, 48),
    },
    {
      path: 'employee',
      pathLabel: 'Workflow Efficiency Lead',
      avgDaysToComplete: random(35, 55),
      medianDaysToComplete: random(32, 50),
      fastestCompletion: random(18, 28),
      slowestCompletion: random(95, 150),
      totalCertificates: random(120, 250),
      previousPeriodAvg: random(38, 58),
    },
    {
      path: 'owner',
      pathLabel: 'AI Operations Master',
      avgDaysToComplete: random(50, 75),
      medianDaysToComplete: random(45, 68),
      fastestCompletion: random(28, 40),
      slowestCompletion: random(120, 180),
      totalCertificates: random(65, 150),
      previousPeriodAvg: random(55, 80),
    },
  ];

  // Learning Path Funnels
  const createFunnel = (path: string, pathLabel: string, startCount: number): LearningPathFunnel => {
    const stages = [
      { stage: 'enrolled', stageLabel: 'Enrolled' },
      { stage: 'started', stageLabel: 'Started First Module' },
      { stage: 'halfway', stageLabel: 'Completed 50%' },
      { stage: 'capstone', stageLabel: 'Reached Capstone' },
      { stage: 'certified', stageLabel: 'Certified' },
    ];

    let currentCount = startCount;
    const funnelStages: FunnelStage[] = stages.map((s, i) => {
      const dropOff = i === 0 ? 0 : random(8, 22);
      if (i > 0) {
        currentCount = Math.floor(currentCount * (1 - dropOff / 100));
      }
      return {
        ...s,
        count: currentCount,
        percentage: Math.round((currentCount / startCount) * 100),
        dropOffFromPrevious: dropOff,
      };
    });

    return { path, pathLabel, stages: funnelStages };
  };

  const learningPathFunnels: LearningPathFunnel[] = [
    createFunnel('student', 'AI Associate', random(800, 1200)),
    createFunnel('employee', 'Workflow Efficiency Lead', random(500, 800)),
    createFunnel('owner', 'AI Operations Master', random(250, 450)),
  ];

  // AI Coaching Stats
  const totalInteractions = random(8500, 15000);
  const uniqueUsers = random(600, 1000);
  const topTopicsData = [
    { topic: 'Prompt Structure', weight: random(18, 25) },
    { topic: 'API Errors', weight: random(14, 20) },
    { topic: 'RAG Configuration', weight: random(12, 18) },
    { topic: 'Code Debugging', weight: random(10, 15) },
    { topic: 'Workflow Design', weight: random(8, 14) },
    { topic: 'Model Selection', weight: random(6, 12) },
    { topic: 'Token Optimization', weight: random(5, 10) },
  ];

  const totalWeight = topTopicsData.reduce((sum, t) => sum + t.weight, 0);
  const topTopics = topTopicsData.map(t => ({
    topic: t.topic,
    count: Math.floor((t.weight / totalWeight) * totalInteractions),
    percentage: Math.round((t.weight / totalWeight) * 100),
  }));

  const aiCoaching: AICoachingStats = {
    totalInteractions,
    uniqueUsers,
    avgInteractionsPerUser: Math.round((totalInteractions / uniqueUsers) * 10) / 10,
    topTopics,
    effectivenessRate: random(78, 92),
    avgResponseHelpfulness: random(38, 48) / 10,
    escalationRate: random(4, 12),
    previousPeriod: {
      totalInteractions: totalInteractions - random(-2000, 3000),
      effectivenessRate: random(75, 88),
    },
  };

  // Filter by path if specified
  if (pathFilter && pathFilter !== 'all') {
    return {
      completion,
      struggleDistribution,
      modulePerformance: modules,
      certificateVelocity: certificateVelocity.filter(c => c.path === pathFilter),
      learningPathFunnels: learningPathFunnels.filter(f => f.path === pathFilter),
      aiCoaching,
    };
  }

  return {
    completion,
    struggleDistribution,
    modulePerformance: modules,
    certificateVelocity,
    learningPathFunnels,
    aiCoaching,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// API HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    // Check admin/teacher role
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !['admin', 'teacher'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const pathFilter = searchParams.get('path') || undefined;

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be between 1 and 365.' },
        { status: 400 }
      );
    }

    // Validate path filter
    const validPaths = ['student', 'employee', 'owner', 'all'];
    if (pathFilter && !validPaths.includes(pathFilter)) {
      return NextResponse.json(
        { error: 'Invalid path parameter. Must be one of: student, employee, owner, all' },
        { status: 400 }
      );
    }

    // Generate mock data
    const analytics = generateMockData(days, pathFilter);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Learning analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning analytics' },
      { status: 500 }
    );
  }
}
