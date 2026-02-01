/**
 * PROGRESS TRANSPARENCY DASHBOARD API
 * Track your learning journey in real-time
 *
 * Core philosophy: No hidden progress. You see exactly where you stand.
 * Full transparency builds trust and motivation.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ProgressDashboard, AKUCategory } from '@/types';

// In-memory progress storage (production: database)
const learnerProgress: Map<string, ProgressDashboard> = new Map();

// Calculate metrics from learning history
function calculateDashboard(
  learnerId: string,
  learningHistory?: {
    sessions: Array<{
      date: string;
      duration: number;
      akuId: string;
      completed: boolean;
      hintsUsed: number;
      attempts: number;
    }>;
    akus: Array<{
      id: string;
      title: string;
      category: AKUCategory;
      completedAt?: string;
      timeSpent: number;
      struggleScore: number;
    }>;
  }
): ProgressDashboard {
  // Default/empty dashboard
  if (!learningHistory || learningHistory.sessions.length === 0) {
    return {
      learnerId,
      totalLearningTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      akusCompleted: 0,
      akusTotal: 12, // Default curriculum size
      competenciesEarned: 0,
      certificatesEarned: 0,
      averageStruggleScore: 0,
      hintsUsedTotal: 0,
      verificationAttempts: 0,
      firstTrySuccessRate: 0,
      averageTimePerAKU: 0,
      fastestAKU: { id: '', title: '', time: 0 },
      slowestAKU: { id: '', title: '', time: 0 },
      weeklyActivity: generateEmptyWeeklyActivity(),
      competencyLevels: generateDefaultCompetencies(),
      milestones: generateMilestones(0, 12),
    };
  }

  const { sessions, akus } = learningHistory;
  const completedAkus = akus.filter(a => a.completedAt);

  // Calculate streak
  const { currentStreak, longestStreak } = calculateStreak(sessions);

  // Calculate totals
  const totalLearningTime = sessions.reduce((sum, s) => sum + s.duration, 0) / 60; // hours
  const hintsUsedTotal = sessions.reduce((sum, s) => sum + s.hintsUsed, 0);
  const verificationAttempts = sessions.reduce((sum, s) => sum + s.attempts, 0);
  const firstTrySuccesses = sessions.filter(s => s.completed && s.attempts === 1).length;
  const firstTrySuccessRate = sessions.length > 0
    ? Math.round((firstTrySuccesses / sessions.filter(s => s.completed).length) * 100)
    : 0;

  // Calculate averages
  const averageStruggleScore = completedAkus.length > 0
    ? Math.round(completedAkus.reduce((sum, a) => sum + a.struggleScore, 0) / completedAkus.length)
    : 0;
  const averageTimePerAKU = completedAkus.length > 0
    ? Math.round(completedAkus.reduce((sum, a) => sum + a.timeSpent, 0) / completedAkus.length)
    : 0;

  // Find fastest/slowest
  const sortedByTime = [...completedAkus].sort((a, b) => a.timeSpent - b.timeSpent);
  const fastestAKU = sortedByTime[0]
    ? { id: sortedByTime[0].id, title: sortedByTime[0].title, time: sortedByTime[0].timeSpent }
    : { id: '', title: '', time: 0 };
  const slowestAKU = sortedByTime[sortedByTime.length - 1]
    ? { id: sortedByTime[sortedByTime.length - 1].id, title: sortedByTime[sortedByTime.length - 1].title, time: sortedByTime[sortedByTime.length - 1].timeSpent }
    : { id: '', title: '', time: 0 };

  // Generate weekly activity
  const weeklyActivity = generateWeeklyActivity(sessions);

  // Calculate competency levels
  const competencyLevels = calculateCompetencyLevels(completedAkus);

  // Generate milestones
  const milestones = generateMilestones(completedAkus.length, akus.length);

  // Estimate completion
  const remainingAkus = akus.length - completedAkus.length;
  const avgDaysPerAku = sessions.length > 0
    ? calculateDaysBetween(sessions[0].date, sessions[sessions.length - 1].date) / completedAkus.length
    : 7;
  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + Math.ceil(remainingAkus * avgDaysPerAku));

  return {
    learnerId,
    totalLearningTime,
    currentStreak,
    longestStreak,
    akusCompleted: completedAkus.length,
    akusTotal: akus.length,
    competenciesEarned: calculateCompetenciesEarned(competencyLevels),
    certificatesEarned: completedAkus.length >= akus.length ? 1 : 0,
    averageStruggleScore,
    hintsUsedTotal,
    verificationAttempts,
    firstTrySuccessRate,
    averageTimePerAKU,
    fastestAKU,
    slowestAKU,
    weeklyActivity,
    competencyLevels,
    milestones,
    estimatedCertificationDate: remainingAkus > 0 ? estimatedCompletionDate : undefined,
    predictedFinalStruggleScore: averageStruggleScore,
  };
}

function calculateStreak(sessions: Array<{ date: string }>): { currentStreak: number; longestStreak: number } {
  if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const uniqueDates = [...new Set(sessions.map(s => s.date.split('T')[0]))].sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check if streak is active (last activity today or yesterday)
  const lastDate = uniqueDates[uniqueDates.length - 1];
  const streakActive = lastDate === today || lastDate === yesterday;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const dayDiff = (currDate.getTime() - prevDate.getTime()) / 86400000;

    if (dayDiff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);
  currentStreak = streakActive ? tempStreak : 0;

  return { currentStreak, longestStreak };
}

function calculateDaysBetween(date1: string, date2: string): number {
  return Math.abs(new Date(date2).getTime() - new Date(date1).getTime()) / 86400000;
}

function generateEmptyWeeklyActivity(): ProgressDashboard['weeklyActivity'] {
  const activity: ProgressDashboard['weeklyActivity'] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    activity.push({
      date: date.toISOString().split('T')[0],
      minutesLearned: 0,
      akusCompleted: 0,
    });
  }
  return activity;
}

function generateWeeklyActivity(sessions: Array<{ date: string; duration: number; completed: boolean }>): ProgressDashboard['weeklyActivity'] {
  const activity = generateEmptyWeeklyActivity();

  for (const session of sessions) {
    const sessionDate = session.date.split('T')[0];
    const dayEntry = activity.find(a => a.date === sessionDate);
    if (dayEntry) {
      dayEntry.minutesLearned += session.duration;
      if (session.completed) dayEntry.akusCompleted++;
    }
  }

  return activity;
}

function generateDefaultCompetencies(): ProgressDashboard['competencyLevels'] {
  return [
    { category: 'prompt_engineering', currentLevel: 0, targetLevel: 5 },
    { category: 'api_integration', currentLevel: 0, targetLevel: 4 },
    { category: 'rag_pipeline', currentLevel: 0, targetLevel: 4 },
    { category: 'agent_orchestration', currentLevel: 0, targetLevel: 3 },
    { category: 'fine_tuning', currentLevel: 0, targetLevel: 2 },
  ];
}

function calculateCompetencyLevels(completedAkus: Array<{ category: AKUCategory; struggleScore: number }>): ProgressDashboard['competencyLevels'] {
  const categories: AKUCategory[] = ['prompt_engineering', 'api_integration', 'rag_pipeline', 'agent_orchestration', 'fine_tuning'];
  const targetLevels = [5, 4, 4, 3, 2];

  return categories.map((category, i) => {
    const categoryAkus = completedAkus.filter(a => a.category === category);
    const avgScore = categoryAkus.length > 0
      ? categoryAkus.reduce((sum, a) => sum + a.struggleScore, 0) / categoryAkus.length
      : 0;

    // Calculate level based on completion and performance
    let level = categoryAkus.length;
    if (avgScore <= 30) level = Math.min(level + 1, targetLevels[i]); // Bonus for low struggle
    if (avgScore >= 70) level = Math.max(level - 1, 0); // Penalty for high struggle

    return {
      category,
      currentLevel: Math.min(level, targetLevels[i]),
      targetLevel: targetLevels[i],
    };
  });
}

function calculateCompetenciesEarned(competencyLevels: ProgressDashboard['competencyLevels']): number {
  return competencyLevels.filter(c => c.currentLevel >= c.targetLevel).length;
}

function generateMilestones(completed: number, total: number): ProgressDashboard['milestones'] {
  const now = new Date();
  return [
    {
      name: 'First Steps',
      description: 'Complete your first AKU',
      achievedAt: completed >= 1 ? now : undefined,
      progress: Math.min(completed * 100, 100),
    },
    {
      name: 'Getting Traction',
      description: 'Complete 25% of the curriculum',
      achievedAt: completed >= Math.ceil(total * 0.25) ? now : undefined,
      progress: Math.min((completed / Math.ceil(total * 0.25)) * 100, 100),
    },
    {
      name: 'Halfway Hero',
      description: 'Complete 50% of the curriculum',
      achievedAt: completed >= Math.ceil(total * 0.5) ? now : undefined,
      progress: Math.min((completed / Math.ceil(total * 0.5)) * 100, 100),
    },
    {
      name: 'Final Push',
      description: 'Complete 75% of the curriculum',
      achievedAt: completed >= Math.ceil(total * 0.75) ? now : undefined,
      progress: Math.min((completed / Math.ceil(total * 0.75)) * 100, 100),
    },
    {
      name: 'Certified Professional',
      description: 'Complete the full curriculum',
      achievedAt: completed >= total ? now : undefined,
      progress: Math.round((completed / total) * 100),
    },
  ];
}

// GET: Fetch learner's progress dashboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get('learnerId');

  if (!learnerId) {
    return NextResponse.json(
      { error: 'learnerId required' },
      { status: 400 }
    );
  }

  // Get or create dashboard
  let dashboard = learnerProgress.get(learnerId);
  if (!dashboard) {
    dashboard = calculateDashboard(learnerId);
    learnerProgress.set(learnerId, dashboard);
  }

  // Add real-time insights
  const insights = generateInsights(dashboard);

  return NextResponse.json({
    dashboard,
    insights,
    lastUpdated: new Date().toISOString(),
  });
}

// POST: Update progress (called after completing an AKU)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { learnerId, session, aku } = body;

    if (!learnerId) {
      return NextResponse.json(
        { error: 'learnerId required' },
        { status: 400 }
      );
    }

    // Get existing progress or create new
    let dashboard = learnerProgress.get(learnerId);

    // Update with new session/aku data
    const learningHistory = {
      sessions: [session].filter(Boolean),
      akus: [aku].filter(Boolean),
    };

    dashboard = calculateDashboard(learnerId, learningHistory);
    learnerProgress.set(learnerId, dashboard);

    return NextResponse.json({
      updated: true,
      dashboard,
      message: aku?.completedAt ? `Great job completing "${aku.title}"!` : 'Progress updated.',
    });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// Generate actionable insights
function generateInsights(dashboard: ProgressDashboard): string[] {
  const insights: string[] = [];

  // Streak insights
  if (dashboard.currentStreak >= 7) {
    insights.push(`🔥 Amazing! You're on a ${dashboard.currentStreak}-day streak!`);
  } else if (dashboard.currentStreak === 0 && dashboard.longestStreak > 0) {
    insights.push(`Your longest streak was ${dashboard.longestStreak} days. Let's rebuild it!`);
  }

  // Performance insights
  if (dashboard.firstTrySuccessRate >= 80) {
    insights.push(`⭐ ${dashboard.firstTrySuccessRate}% first-try success rate - you're crushing it!`);
  }

  if (dashboard.averageStruggleScore <= 30 && dashboard.akusCompleted > 0) {
    insights.push('Elite performance detected. You might be ready for advanced challenges.');
  }

  // Progress insights
  const progressPercent = Math.round((dashboard.akusCompleted / dashboard.akusTotal) * 100);
  if (progressPercent >= 50 && progressPercent < 75) {
    insights.push("You're past the halfway point! The finish line is in sight.");
  }

  // Time insights
  if (dashboard.averageTimePerAKU > 0) {
    if (dashboard.averageTimePerAKU <= 10) {
      insights.push('You complete challenges quickly. Consider exploring deeper concepts.');
    } else if (dashboard.averageTimePerAKU >= 30) {
      insights.push("You're thorough. Consider using hints earlier to optimize time.");
    }
  }

  // Competency insights
  const masteredCompetencies = dashboard.competencyLevels.filter(c => c.currentLevel >= c.targetLevel);
  if (masteredCompetencies.length > 0) {
    insights.push(`Competencies mastered: ${masteredCompetencies.map(c => c.category.replace('_', ' ')).join(', ')}`);
  }

  return insights;
}
