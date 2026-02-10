/**
 * STRIPE SUBSCRIPTION MANAGEMENT API (Firebase)
 * Handles subscription updates, cancellations, and billing portal access
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getStripe } from '@/lib/stripe/config';

// GET - Get current subscription details
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const subscriptionQuery = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', 'in', ['active', 'trialing', 'past_due'])
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (subscriptionQuery.empty) {
      return NextResponse.json({ subscription: null });
    }

    const subscriptionDoc = subscriptionQuery.docs[0];
    const subscription = { id: subscriptionDoc.id, ...subscriptionDoc.data() };

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
  }
}

// POST - Manage subscription (cancel, resume, portal)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const body = await request.json();
    const { action } = body as { action: 'cancel' | 'resume' | 'portal' };

    // Get user's subscription
    const subscriptionQuery = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', 'in', ['active', 'trialing', 'past_due'])
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (subscriptionQuery.empty) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const subscriptionDoc = subscriptionQuery.docs[0];
    const subscription = subscriptionDoc.data();

    const stripe = getStripe();

    switch (action) {
      case 'cancel': {
        // Cancel at period end (user keeps access until end of billing period)
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        // Update local record
        await subscriptionDoc.ref.update({
          cancelAtPeriodEnd: true,
          updatedAt: Timestamp.now(),
        });

        return NextResponse.json({
          success: true,
          message: 'Subscription will cancel at the end of your billing period',
          cancelAt: subscription.currentPeriodEnd,
        });
      }

      case 'resume': {
        // Resume a subscription that was set to cancel
        if (!subscription.cancelAtPeriodEnd) {
          return NextResponse.json({ error: 'Subscription is not set to cancel' }, { status: 400 });
        }

        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });

        await subscriptionDoc.ref.update({
          cancelAtPeriodEnd: false,
          updatedAt: Timestamp.now(),
        });

        return NextResponse.json({
          success: true,
          message: 'Subscription has been resumed',
        });
      }

      case 'portal': {
        // Create Stripe billing portal session
        if (!subscription.stripeCustomerId) {
          return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: subscription.stripeCustomerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
        });

        return NextResponse.json({
          url: portalSession.url,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Manage subscription error:', error);
    return NextResponse.json({ error: 'Failed to manage subscription' }, { status: 500 });
  }
}
