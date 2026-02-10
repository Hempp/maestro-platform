/**
 * USAGE TRACKING API (Firebase)
 * GET: Returns current usage for the authenticated user
 * POST: Increments usage for a specific feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { rateLimit, RATE_LIMITS } from '@/lib/security';

type FeatureType = 'tutor' | 'agent' | 'skill';

const FEATURE_FIELDS: Record<FeatureType, string> = {
  tutor: 'tutorSessions',
  agent: 'agentExecutions',
  skill: 'skillUses',
};

// Get current billing period boundaries
function getCurrentPeriod(): { start: Date; end: Date; periodKey: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return { start, end, periodKey };
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    return { user: null, error: 'No session' };
  }

  try {
    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(session, true);
    return { user: { id: decodedClaims.uid, email: decodedClaims.email }, error: null };
  } catch {
    return { user: null, error: 'Invalid session' };
  }
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.read);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    const { start, end, periodKey } = getCurrentPeriod();

    // Get or create usage document for current period
    const usageDocId = `${user.id}_${periodKey}`;
    const usageDoc = await db.collection('usage').doc(usageDocId).get();

    if (!usageDoc.exists) {
      // Return default usage
      return NextResponse.json({
        usage: {
          tutorSessions: 0,
          agentExecutions: 0,
          skillUses: 0,
          periodStart: start.toISOString(),
          periodEnd: end.toISOString(),
        },
      });
    }

    const usageData = usageDoc.data();

    return NextResponse.json({
      usage: {
        tutorSessions: usageData?.tutorSessions || 0,
        agentExecutions: usageData?.agentExecutions || 0,
        skillUses: usageData?.skillUses || 0,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feature } = (await request.json()) as { feature: FeatureType };

    if (!feature || !FEATURE_FIELDS[feature]) {
      return NextResponse.json(
        { error: 'Invalid feature. Must be one of: tutor, agent, skill' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const { start, end, periodKey } = getCurrentPeriod();
    const usageDocId = `${user.id}_${periodKey}`;
    const usageRef = db.collection('usage').doc(usageDocId);

    const fieldName = FEATURE_FIELDS[feature];

    // Use set with merge to create if doesn't exist, or update if exists
    await usageRef.set(
      {
        userId: user.id,
        periodKey,
        periodStart: Timestamp.fromDate(start),
        periodEnd: Timestamp.fromDate(end),
        [fieldName]: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );

    // Get the updated count
    const updatedDoc = await usageRef.get();
    const newCount = updatedDoc.data()?.[fieldName] || 1;

    return NextResponse.json({
      success: true,
      newCount,
      feature,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
