/**
 * ADAPTIVE PACING ENGINE API
 * Adjusts workload for students working 40+ hrs/week
 *
 * Core philosophy: Learning shouldn't compete with life.
 * We adapt to YOUR schedule, not the other way around.
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  LearnerSchedule,
  PacingRecommendation,
  WorkSchedule,
} from '@/types';

// In-memory storage (production: database)
const learnerSchedules: Map<string, LearnerSchedule> = new Map();

// Default learning minutes based on work schedule
const PACING_DEFAULTS: Record<WorkSchedule, {
  dailyMinutes: number;
  akusPerWeek: number;
  weekendMultiplier: number;
}> = {
  full_time_student: {
    dailyMinutes: 90,
    akusPerWeek: 7,
    weekendMultiplier: 1.5,
  },
  part_time_worker: {
    dailyMinutes: 45,
    akusPerWeek: 5,
    weekendMultiplier: 2,
  },
  full_time_worker: {
    dailyMinutes: 30,
    akusPerWeek: 3,
    weekendMultiplier: 2.5,
  },
  overtime_worker: {
    dailyMinutes: 20,
    akusPerWeek: 2,
    weekendMultiplier: 3,
  },
};

// Burnout risk factors
function calculateBurnoutRisk(
  schedule: LearnerSchedule,
  recentActivity?: { streakDays: number; avgDailyMinutes: number }
): 'low' | 'medium' | 'high' {
  // High burnout risk indicators
  if (schedule.workHoursPerWeek >= 50) {
    if (schedule.maxDailyLearningMinutes > 45) return 'high';
    if (!schedule.breakReminders) return 'medium';
  }

  if (schedule.workHoursPerWeek >= 40) {
    if (schedule.maxDailyLearningMinutes > 60) return 'medium';
  }

  // Check recent activity patterns
  if (recentActivity) {
    // Long streak with high daily minutes = burnout risk
    if (recentActivity.streakDays > 14 && recentActivity.avgDailyMinutes > 60) {
      return 'medium';
    }
    // Extremely long streak
    if (recentActivity.streakDays > 30) return 'medium';
  }

  return 'low';
}

// Generate personalized recommendations
function generateRecommendations(
  schedule: LearnerSchedule,
  burnoutRisk: 'low' | 'medium' | 'high'
): string[] {
  const recommendations: string[] = [];

  if (schedule.workHoursPerWeek >= 50) {
    recommendations.push(
      'With 50+ work hours, we recommend micro-learning sessions of 15-20 minutes'
    );
    recommendations.push(
      'Focus on weekends for longer hands-on challenges'
    );
  }

  if (schedule.workHoursPerWeek >= 40 && !schedule.weekendIntensive) {
    recommendations.push(
      'Consider enabling Weekend Intensive mode to catch up on weekends'
    );
  }

  if (burnoutRisk === 'high') {
    recommendations.push(
      '⚠️ Burnout risk detected. We recommend reducing daily learning time'
    );
    recommendations.push(
      'Take a rest day at least twice per week'
    );
  }

  if (burnoutRisk === 'medium') {
    recommendations.push(
      'Consider taking a break day mid-week to maintain sustainability'
    );
  }

  if (!schedule.breakReminders && schedule.maxDailyLearningMinutes > 30) {
    recommendations.push(
      'Enable break reminders to prevent eye strain and mental fatigue'
    );
  }

  if (schedule.preferredLearningTimes.length === 0) {
    recommendations.push(
      'Set preferred learning times for better notification scheduling'
    );
  }

  // Always include an encouraging note
  if (recommendations.length === 0) {
    recommendations.push(
      'Your learning schedule looks sustainable. Keep up the great work!'
    );
  }

  return recommendations;
}

// Generate weekly plan
function generateWeeklyPlan(
  schedule: LearnerSchedule,
  totalAKUs: number,
  completedAKUs: number
): PacingRecommendation['weeklyPlan'] {
  const defaults = PACING_DEFAULTS[schedule.workSchedule];
  const plan: PacingRecommendation['weeklyPlan'] = [];

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
  const remainingAKUs = totalAKUs - completedAKUs;
  let akusAssigned = 0;
  const targetAKUsThisWeek = Math.min(defaults.akusPerWeek, remainingAKUs);

  for (const day of days) {
    const isPreferredDay = schedule.preferredLearningDays.includes(day);
    const isWeekend = day === 'sat' || day === 'sun';

    if (!isPreferredDay && schedule.preferredLearningDays.length > 0) {
      plan.push({ day, akuIds: [], estimatedMinutes: 0 });
      continue;
    }

    let dailyMinutes = defaults.dailyMinutes;
    if (isWeekend && schedule.weekendIntensive) {
      dailyMinutes = Math.round(dailyMinutes * defaults.weekendMultiplier);
    }

    // Cap at user's max
    dailyMinutes = Math.min(dailyMinutes, schedule.maxDailyLearningMinutes);

    // Assign AKUs proportionally
    const akusForDay = isWeekend && schedule.weekendIntensive
      ? Math.ceil(targetAKUsThisWeek / 3) // More on weekends
      : Math.floor(targetAKUsThisWeek / 5); // Spread across weekdays

    const assignedCount = Math.min(akusForDay, targetAKUsThisWeek - akusAssigned);

    plan.push({
      day,
      akuIds: Array(assignedCount).fill(null).map((_, i) =>
        `aku-${completedAKUs + akusAssigned + i + 1}`
      ),
      estimatedMinutes: dailyMinutes,
    });

    akusAssigned += assignedCount;
  }

  return plan;
}

// POST: Create or update learner schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { learnerId, ...scheduleData } = body;

    if (!learnerId) {
      return NextResponse.json(
        { error: 'learnerId required' },
        { status: 400 }
      );
    }

    // Determine work schedule category
    let workSchedule: WorkSchedule = 'full_time_student';
    if (scheduleData.workHoursPerWeek >= 50) {
      workSchedule = 'overtime_worker';
    } else if (scheduleData.workHoursPerWeek >= 35) {
      workSchedule = 'full_time_worker';
    } else if (scheduleData.workHoursPerWeek >= 15) {
      workSchedule = 'part_time_worker';
    }

    const schedule: LearnerSchedule = {
      learnerId,
      workHoursPerWeek: scheduleData.workHoursPerWeek || 0,
      preferredLearningDays: scheduleData.preferredLearningDays || ['sat', 'sun'],
      preferredLearningTimes: scheduleData.preferredLearningTimes || [],
      timezone: scheduleData.timezone || 'America/New_York',
      workSchedule,
      maxDailyLearningMinutes: scheduleData.maxDailyLearningMinutes ||
        PACING_DEFAULTS[workSchedule].dailyMinutes,
      breakReminders: scheduleData.breakReminders ?? true,
      weekendIntensive: scheduleData.weekendIntensive ?? (workSchedule !== 'full_time_student'),
    };

    learnerSchedules.set(learnerId, schedule);

    return NextResponse.json({
      success: true,
      schedule,
      message: `Schedule optimized for ${workSchedule.replace(/_/g, ' ')} (${schedule.workHoursPerWeek} hrs/week)`,
    });
  } catch (error) {
    console.error('Pacing schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to save schedule' },
      { status: 500 }
    );
  }
}

// GET: Get pacing recommendation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get('learnerId');
  const totalAKUs = parseInt(searchParams.get('totalAKUs') || '12');
  const completedAKUs = parseInt(searchParams.get('completedAKUs') || '0');

  if (!learnerId) {
    return NextResponse.json(
      { error: 'learnerId required' },
      { status: 400 }
    );
  }

  // Get or create default schedule
  let schedule = learnerSchedules.get(learnerId);
  if (!schedule) {
    // Create default schedule for new learner
    schedule = {
      learnerId,
      workHoursPerWeek: 40,
      preferredLearningDays: ['sat', 'sun'],
      preferredLearningTimes: [{ start: '09:00', end: '12:00' }],
      timezone: 'America/New_York',
      workSchedule: 'full_time_worker',
      maxDailyLearningMinutes: 30,
      breakReminders: true,
      weekendIntensive: true,
    };
    learnerSchedules.set(learnerId, schedule);
  }

  const defaults = PACING_DEFAULTS[schedule.workSchedule];
  const burnoutRisk = calculateBurnoutRisk(schedule);

  // Calculate estimated completion
  const remainingAKUs = totalAKUs - completedAKUs;
  const weeksToComplete = Math.ceil(remainingAKUs / defaults.akusPerWeek);
  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + weeksToComplete * 7);

  const recommendation: PacingRecommendation = {
    learnerId,
    suggestedDailyMinutes: Math.min(defaults.dailyMinutes, schedule.maxDailyLearningMinutes),
    suggestedAKUsPerWeek: defaults.akusPerWeek,
    estimatedCompletionDate,
    burnoutRisk,
    recommendations: generateRecommendations(schedule, burnoutRisk),
    weeklyPlan: generateWeeklyPlan(schedule, totalAKUs, completedAKUs),
  };

  return NextResponse.json({
    schedule,
    recommendation,
    summary: {
      workScheduleType: schedule.workSchedule,
      weeksToCompletion: weeksToComplete,
      totalLearningMinutesPerWeek: defaults.dailyMinutes * schedule.preferredLearningDays.length,
    },
  });
}
