/**
 * ADMIN ENGAGEMENT ANALYTICS API (Firebase)
 * Engagement & retention metrics with mock data
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

// Types for engagement analytics
interface ActiveUsersMetric {
  dau: number;
  wau: number;
  mau: number;
  dauTrend: number; // percentage change
  wauTrend: number;
  mauTrend: number;
}

interface RetentionCohort {
  cohort: string; // e.g., "Jan 2025 Week 1"
  cohortSize: number;
  day1: number;
  day7: number;
  day14: number;
  day30: number;
}

interface HeatmapCell {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  value: number; // activity count
}

interface AtRiskUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastActive: string;
  activityDecline: number; // percentage decline
  previousAvgSessions: number;
  recentSessions: number;
  churnRisk: 'high' | 'medium' | 'low';
  tier: string;
}

interface FeatureUsage {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  avgSessionTime: number; // in minutes
  trend: number; // percentage change
  category: string;
}

interface EngagementAnalytics {
  activeUsers: ActiveUsersMetric;
  retentionCohorts: RetentionCohort[];
  engagementHeatmap: HeatmapCell[];
  atRiskUsers: AtRiskUser[];
  featureAdoption: FeatureUsage[];
  dateRange: {
    start: string;
    end: string;
  };
}

// Generate mock active users data
function generateActiveUsersData(): ActiveUsersMetric {
  return {
    dau: 342,
    wau: 1847,
    mau: 5623,
    dauTrend: 8.3,
    wauTrend: 12.1,
    mauTrend: 15.7,
  };
}

// Generate mock retention cohorts
function generateRetentionCohorts(): RetentionCohort[] {
  const cohorts: RetentionCohort[] = [];
  const baseDate = new Date();

  for (let i = 0; i < 8; i++) {
    const cohortDate = new Date(baseDate);
    cohortDate.setDate(cohortDate.getDate() - (i * 7));
    const weekNum = Math.ceil((cohortDate.getDate()) / 7);
    const monthName = cohortDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    // Simulate realistic retention decay
    const cohortSize = Math.floor(Math.random() * 200) + 150;
    const day1 = Math.floor(70 + Math.random() * 15); // 70-85%
    const day7 = Math.floor(45 + Math.random() * 15); // 45-60%
    const day14 = Math.floor(30 + Math.random() * 12); // 30-42%
    const day30 = Math.floor(20 + Math.random() * 10); // 20-30%

    cohorts.push({
      cohort: `${monthName} Week ${weekNum}`,
      cohortSize,
      day1,
      day7,
      day14,
      day30,
    });
  }

  return cohorts.reverse();
}

// Generate mock engagement heatmap
function generateEngagementHeatmap(): HeatmapCell[] {
  const heatmap: HeatmapCell[] = [];

  // Activity patterns: higher during work hours, lower on weekends
  const dayMultipliers = [0.4, 0.9, 1.0, 1.0, 0.95, 0.85, 0.5]; // Sun-Sat
  const hourMultipliers = [
    0.1, 0.05, 0.03, 0.02, 0.02, 0.05, // 0-5 (night)
    0.15, 0.35, 0.65, 0.85, 0.95, 1.0, // 6-11 (morning ramp)
    0.9, 0.95, 1.0, 0.95, 0.85, 0.75, // 12-17 (afternoon)
    0.55, 0.45, 0.35, 0.25, 0.2, 0.15, // 18-23 (evening decline)
  ];

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const baseValue = 100;
      const value = Math.floor(
        baseValue * dayMultipliers[day] * hourMultipliers[hour] * (0.8 + Math.random() * 0.4)
      );
      heatmap.push({ day, hour, value });
    }
  }

  return heatmap;
}

// Generate mock at-risk users
function generateAtRiskUsers(): AtRiskUser[] {
  const names = [
    'Sarah Mitchell', 'James Chen', 'Emily Rodriguez', 'Michael Park',
    'Jessica Thompson', 'David Kim', 'Amanda Foster', 'Ryan Martinez',
    'Nicole Williams', 'Brandon Lee', 'Stephanie Davis', 'Kevin Nguyen',
  ];

  const tiers = ['student', 'employee', 'owner'];
  const risks: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];

  return names.slice(0, 10).map((name, i) => {
    const lastName = name.split(' ')[1].toLowerCase();
    const firstName = name.split(' ')[0].toLowerCase();
    const daysAgo = Math.floor(Math.random() * 14) + 3;
    const lastActive = new Date();
    lastActive.setDate(lastActive.getDate() - daysAgo);

    const previousAvgSessions = Math.floor(Math.random() * 8) + 5;
    const recentSessions = Math.floor(Math.random() * 3) + 1;
    const activityDecline = Math.round(((previousAvgSessions - recentSessions) / previousAvgSessions) * 100);

    // Risk is based on activity decline
    let churnRisk: 'high' | 'medium' | 'low';
    if (activityDecline > 70) churnRisk = 'high';
    else if (activityDecline > 50) churnRisk = 'medium';
    else churnRisk = 'low';

    return {
      id: `user-${i + 1}`,
      name,
      email: `${firstName}.${lastName}@example.com`,
      lastActive: lastActive.toISOString(),
      activityDecline,
      previousAvgSessions,
      recentSessions,
      churnRisk,
      tier: tiers[i % 3],
    };
  }).sort((a, b) => b.activityDecline - a.activityDecline);
}

// Generate mock feature adoption data
function generateFeatureAdoption(): FeatureUsage[] {
  return [
    {
      feature: 'AI Tutor Chat',
      usageCount: 15420,
      uniqueUsers: 4231,
      avgSessionTime: 12.5,
      trend: 23.4,
      category: 'Learning',
    },
    {
      feature: 'Practice Exercises',
      usageCount: 12350,
      uniqueUsers: 3892,
      avgSessionTime: 18.2,
      trend: 15.7,
      category: 'Learning',
    },
    {
      feature: 'Live Sessions',
      usageCount: 8920,
      uniqueUsers: 2156,
      avgSessionTime: 45.0,
      trend: 8.3,
      category: 'Live',
    },
    {
      feature: 'Progress Dashboard',
      usageCount: 7840,
      uniqueUsers: 3421,
      avgSessionTime: 3.2,
      trend: 5.1,
      category: 'Analytics',
    },
    {
      feature: 'Certificate Generator',
      usageCount: 2340,
      uniqueUsers: 1892,
      avgSessionTime: 2.1,
      trend: 42.5,
      category: 'Achievements',
    },
    {
      feature: 'Workflow Sandbox',
      usageCount: 6720,
      uniqueUsers: 2134,
      avgSessionTime: 22.8,
      trend: 31.2,
      category: 'Learning',
    },
    {
      feature: 'Community Forum',
      usageCount: 3210,
      uniqueUsers: 987,
      avgSessionTime: 8.5,
      trend: -5.2,
      category: 'Social',
    },
    {
      feature: 'Resource Library',
      usageCount: 4560,
      uniqueUsers: 2341,
      avgSessionTime: 5.3,
      trend: 2.1,
      category: 'Resources',
    },
    {
      feature: 'Team Management',
      usageCount: 890,
      uniqueUsers: 234,
      avgSessionTime: 6.7,
      trend: -12.3,
      category: 'Admin',
    },
    {
      feature: 'Notifications',
      usageCount: 9870,
      uniqueUsers: 4123,
      avgSessionTime: 0.5,
      trend: 1.2,
      category: 'System',
    },
  ].sort((a, b) => b.usageCount - a.usageCount);
}

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

    // Parse date range from query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    // Generate mock data (would be replaced with real DB queries)
    const analytics: EngagementAnalytics = {
      activeUsers: generateActiveUsersData(),
      retentionCohorts: generateRetentionCohorts(),
      engagementHeatmap: generateEngagementHeatmap(),
      atRiskUsers: generateAtRiskUsers(),
      featureAdoption: generateFeatureAdoption(),
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Engagement analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement analytics' },
      { status: 500 }
    );
  }
}
