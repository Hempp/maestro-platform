/**
 * ADMIN REVENUE ANALYTICS API
 * Returns revenue metrics, subscription data, and churn analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Tier pricing configuration
const TIER_PRICING = {
  student: 49,
  employee: 199,
  owner: 499,
};

// Types
interface TierBreakdown {
  student: number;
  employee: number;
  owner: number;
}

interface RevenueTrendPoint {
  date: string;
  total: number;
  student: number;
  employee: number;
  owner: number;
}

interface CohortLTV {
  cohort: string;
  subscribers: number;
  avgLTV: number;
  avgLifespanMonths: number;
  retentionRate: number;
}

interface TierTransition {
  from: string;
  to: string;
  count: number;
  percentage: number;
}

// Generate realistic mock data
function generateMockData(days: number, tierFilter: string | null) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Base subscriber counts (realistic for a growing SaaS)
  const baseStudentSubs = 847;
  const baseEmployeeSubs = 312;
  const baseOwnerSubs = 89;

  // Calculate current MRR
  const subscriberCounts: TierBreakdown = {
    student: tierFilter && tierFilter !== 'student' ? 0 : baseStudentSubs,
    employee: tierFilter && tierFilter !== 'employee' ? 0 : baseEmployeeSubs,
    owner: tierFilter && tierFilter !== 'owner' ? 0 : baseOwnerSubs,
  };

  const breakdown: TierBreakdown = {
    student: subscriberCounts.student * TIER_PRICING.student,
    employee: subscriberCounts.employee * TIER_PRICING.employee,
    owner: subscriberCounts.owner * TIER_PRICING.owner,
  };

  const currentMRR = breakdown.student + breakdown.employee + breakdown.owner;

  // Previous period MRR (simulate 8% monthly growth)
  const previousMRR = currentMRR / 1.08;
  const growthRate = ((currentMRR - previousMRR) / previousMRR) * 100;

  // YoY growth (simulate 95% yearly growth for early-stage SaaS)
  const yearAgoMRR = currentMRR / 1.95;
  const growthRateYoY = ((currentMRR - yearAgoMRR) / yearAgoMRR) * 100;

  // Generate revenue trend data
  const trend: RevenueTrendPoint[] = [];
  const trendMonths = Math.min(12, Math.ceil(days / 30));

  for (let i = trendMonths - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7);

    // Simulate growth pattern with some variance
    const growthFactor = Math.pow(1.08, i);
    const variance = 0.95 + Math.random() * 0.1;

    const studentMRR = Math.round((breakdown.student / growthFactor) * variance);
    const employeeMRR = Math.round((breakdown.employee / growthFactor) * variance);
    const ownerMRR = Math.round((breakdown.owner / growthFactor) * variance);

    trend.push({
      date: monthKey,
      total: studentMRR + employeeMRR + ownerMRR,
      student: tierFilter && tierFilter !== 'student' ? 0 : studentMRR,
      employee: tierFilter && tierFilter !== 'employee' ? 0 : employeeMRR,
      owner: tierFilter && tierFilter !== 'owner' ? 0 : ownerMRR,
    });
  }

  // Subscription flow (this period)
  const flowBase = Math.ceil(days / 30); // Scale by period length
  const flow = {
    newSubscriptions: Math.round(45 * flowBase * (0.9 + Math.random() * 0.2)),
    upgrades: Math.round(18 * flowBase * (0.9 + Math.random() * 0.2)),
    downgrades: Math.round(7 * flowBase * (0.9 + Math.random() * 0.2)),
    churns: Math.round(12 * flowBase * (0.9 + Math.random() * 0.2)),
    reactivations: Math.round(5 * flowBase * (0.9 + Math.random() * 0.2)),
  };

  // Distribution
  const totalSubs = subscriberCounts.student + subscriberCounts.employee + subscriberCounts.owner;
  const distribution: TierBreakdown = {
    student: totalSubs > 0 ? subscriberCounts.student : 0,
    employee: totalSubs > 0 ? subscriberCounts.employee : 0,
    owner: totalSubs > 0 ? subscriberCounts.owner : 0,
  };

  // Cohort LTV data (last 6 months of cohorts)
  const cohorts: CohortLTV[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 5; i >= 0; i--) {
    const cohortDate = new Date();
    cohortDate.setMonth(cohortDate.getMonth() - i);
    const monthName = monthNames[cohortDate.getMonth()];
    const year = cohortDate.getFullYear().toString().slice(-2);

    // Older cohorts have higher LTV (more time to accumulate revenue)
    const ageMonths = i + 1;
    const baseLTV = 180 + ageMonths * 45;
    const variance = 0.9 + Math.random() * 0.2;

    cohorts.push({
      cohort: `${monthName} '${year}`,
      subscribers: Math.round((85 - i * 8) * (0.9 + Math.random() * 0.2)),
      avgLTV: Math.round(baseLTV * variance),
      avgLifespanMonths: Math.round(ageMonths * 0.95 * (0.9 + Math.random() * 0.2)),
      retentionRate: Math.round(92 - i * 2 + (Math.random() * 6 - 3)),
    });
  }

  // Churn analysis
  const totalChurned = flow.churns;
  const studentChurns = Math.round(totalChurned * 0.55); // Higher churn at lower tier
  const employeeChurns = Math.round(totalChurned * 0.32);
  const ownerChurns = totalChurned - studentChurns - employeeChurns;

  const churn = {
    overallRate: parseFloat(((totalChurned / Math.max(totalSubs, 1)) * 100).toFixed(1)),
    byTier: {
      student: {
        rate: parseFloat(((studentChurns / Math.max(subscriberCounts.student, 1)) * 100).toFixed(1)),
        count: studentChurns,
      },
      employee: {
        rate: parseFloat(((employeeChurns / Math.max(subscriberCounts.employee, 1)) * 100).toFixed(1)),
        count: employeeChurns,
      },
      owner: {
        rate: parseFloat(((ownerChurns / Math.max(subscriberCounts.owner, 1)) * 100).toFixed(1)),
        count: ownerChurns,
      },
    },
    topReasons: [
      { reason: 'Price too high', percentage: 32 },
      { reason: 'Not using enough', percentage: 28 },
      { reason: 'Switched to competitor', percentage: 18 },
      { reason: 'Business closed', percentage: 12 },
      { reason: 'Other', percentage: 10 },
    ],
  };

  // Tier transitions
  const transitions: TierTransition[] = [
    { from: 'student', to: 'employee', count: Math.round(flow.upgrades * 0.65), percentage: 65 },
    { from: 'student', to: 'owner', count: Math.round(flow.upgrades * 0.08), percentage: 8 },
    { from: 'employee', to: 'owner', count: Math.round(flow.upgrades * 0.27), percentage: 27 },
    { from: 'owner', to: 'employee', count: Math.round(flow.downgrades * 0.25), percentage: 25 },
    { from: 'employee', to: 'student', count: Math.round(flow.downgrades * 0.75), percentage: 75 },
  ];

  return {
    mrr: {
      currentMRR,
      previousMRR: Math.round(previousMRR),
      growthRate: parseFloat(growthRate.toFixed(1)),
      growthRateMoM: parseFloat(growthRate.toFixed(1)),
      growthRateYoY: parseFloat(growthRateYoY.toFixed(1)),
      breakdown,
      subscriberCounts,
    },
    trend,
    flow,
    distribution,
    cohorts,
    churn,
    transitions,
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check admin/teacher role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string | null } | null };

    if (!userData || !['admin', 'teacher'].includes(userData.role || '')) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const tierFilter = searchParams.get('tier') || null;

    // Validate days parameter
    const validDays = [7, 30, 90, 365];
    const normalizedDays = validDays.includes(days) ? days : 30;

    // Validate tier filter
    const validTiers = ['student', 'employee', 'owner'];
    const normalizedTierFilter = tierFilter && validTiers.includes(tierFilter) ? tierFilter : null;

    // In production, this would query actual subscription/payment data
    // For now, generate realistic mock data
    const revenueData = generateMockData(normalizedDays, normalizedTierFilter);

    return NextResponse.json(revenueData);
  } catch (error) {
    console.error('Revenue analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}
