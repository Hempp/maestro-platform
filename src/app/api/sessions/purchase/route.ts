/**
 * SEAT PURCHASE API (Firebase)
 * Handles seat purchases for tiered live events
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// Check if user has free access to a session based on their tier
function hasFreeTierAccess(userTier: string | null, sessionTier: string): boolean {
  if (!userTier) userTier = 'student';

  if (userTier === 'owner') return true; // Owners access everything
  if (userTier === 'employee' && ['student', 'employee'].includes(sessionTier)) return true;
  if (userTier === 'student' && sessionTier === 'student') return true;

  return false;
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    return { user: null };
  }

  try {
    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(session, true);
    return { user: { id: decodedClaims.uid, email: decodedClaims.email } };
  } catch {
    return { user: null };
  }
}

// GET: Check access status for a session
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const db = getAdminDb();

    // Get user's tier
    const userDoc = await db.collection('users').doc(user.id).get();
    const userData = userDoc.data();
    const userTier = (userData?.tier as string) || 'student';

    // Get session details
    const sessionDoc = await db.collection('liveSessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionDoc.data()!;

    // Check if user already purchased
    const purchaseQuery = await db
      .collection('seatPurchases')
      .where('sessionId', '==', sessionId)
      .where('userId', '==', user.id)
      .where('paymentStatus', '==', 'completed')
      .limit(1)
      .get();

    const hasPurchased = !purchaseQuery.empty;

    // Check current enrollment count
    const enrollmentQuery = await db
      .collection('sessionEnrollments')
      .where('sessionId', '==', sessionId)
      .get();

    const enrollmentCount = enrollmentQuery.size;

    const hasFreeAccess = hasFreeTierAccess(userTier, session.targetTier);
    const hasAccess = hasFreeAccess || hasPurchased;
    const seatsAvailable = (session.maxSeats || 100) - enrollmentCount;

    // Calculate price (check early bird)
    let price = session.seatPrice || 0;
    let isEarlyBird = false;
    if (session.earlyBirdPrice && session.earlyBirdDeadline) {
      const deadline = session.earlyBirdDeadline.toDate?.() || new Date(session.earlyBirdDeadline);
      if (new Date() < deadline) {
        price = session.earlyBirdPrice;
        isEarlyBird = true;
      }
    }

    return NextResponse.json({
      sessionId,
      userTier,
      sessionTier: session.targetTier,
      hasFreeAccess,
      hasPurchased,
      hasAccess,
      price: hasFreeAccess ? 0 : price,
      isEarlyBird,
      earlyBirdDeadline: session.earlyBirdDeadline?.toDate?.()?.toISOString() || null,
      seatsAvailable,
      maxSeats: session.maxSeats,
    });
  } catch (error) {
    console.error('Session access check error:', error);
    return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
  }
}

// POST: Purchase a seat
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const db = getAdminDb();

    // Get user's tier
    const userDoc = await db.collection('users').doc(user.id).get();
    const userData = userDoc.data();
    const userTier = (userData?.tier as string) || 'student';

    // Get session details
    const sessionDoc = await db.collection('liveSessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionDoc.data()!;

    // Check if user already has free access
    if (hasFreeTierAccess(userTier, session.targetTier)) {
      return NextResponse.json(
        { error: 'You already have free access to this session' },
        { status: 400 }
      );
    }

    // Check if already purchased
    const existingPurchaseQuery = await db
      .collection('seatPurchases')
      .where('sessionId', '==', sessionId)
      .where('userId', '==', user.id)
      .where('paymentStatus', '==', 'completed')
      .limit(1)
      .get();

    if (!existingPurchaseQuery.empty) {
      return NextResponse.json(
        { error: 'You already purchased a seat for this session' },
        { status: 400 }
      );
    }

    // Check seat availability
    const enrollmentQuery = await db
      .collection('sessionEnrollments')
      .where('sessionId', '==', sessionId)
      .get();

    const enrollmentCount = enrollmentQuery.size;

    if (enrollmentCount >= (session.maxSeats || 100)) {
      return NextResponse.json({ error: 'No seats available' }, { status: 400 });
    }

    // Calculate price
    let price = session.seatPrice || 0;
    if (session.earlyBirdPrice && session.earlyBirdDeadline) {
      const deadline = session.earlyBirdDeadline.toDate?.() || new Date(session.earlyBirdDeadline);
      if (new Date() < deadline) {
        price = session.earlyBirdPrice;
      }
    }

    // Create purchase record
    // For now, create a "completed" purchase (integrate Stripe later)
    // In production, you'd create a Stripe checkout session here
    const purchaseRef = await db.collection('seatPurchases').add({
      sessionId,
      userId: user.id,
      amountPaid: price,
      paymentStatus: 'completed', // Would be 'pending' with real payments
      paymentIntentId: `demo_${Date.now()}`, // Placeholder
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const purchaseDoc = await purchaseRef.get();
    const purchase = { id: purchaseDoc.id, ...purchaseDoc.data() };

    // Also enroll the user in the session
    await db.collection('sessionEnrollments').add({
      sessionId,
      studentId: user.id,
      accessType: 'purchased',
      purchaseId: purchase.id,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      purchase,
      message: 'Seat purchased successfully!',
    });
  } catch (error) {
    console.error('Seat purchase error:', error);
    return NextResponse.json({ error: 'Failed to purchase seat' }, { status: 500 });
  }
}
