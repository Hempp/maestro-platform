/**
 * SUBSCRIPTION API (Firebase)
 * Handles subscription creation, management, and billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getStripe, SUBSCRIPTION_PLANS, isValidPlan, SubscriptionPlanId } from '@/lib/stripe/config';

// GET: Get user's subscription status
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

    // Get user's subscription from database
    const subscriptionQuery = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    const subscription = subscriptionQuery.empty
      ? null
      : { id: subscriptionQuery.docs[0].id, ...subscriptionQuery.docs[0].data() };

    // Get available plans
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
      id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyAmount / 100,
      yearlyPrice: plan.yearlyAmount / 100,
      features: plan.features,
      limits: plan.limits,
      popular: 'popular' in plan && plan.popular,
    }));

    return NextResponse.json({
      subscription,
      plans,
      isSubscribed: !!subscription,
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

// POST: Create or update subscription
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
    const { planId, billingCycle = 'monthly', successUrl, cancelUrl } = body;

    if (!planId || !isValidPlan(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID', validPlans: Object.keys(SUBSCRIPTION_PLANS) },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanId];
    const amount = billingCycle === 'yearly' ? plan.yearlyAmount : plan.monthlyAmount;
    const interval = billingCycle === 'yearly' ? 'year' : 'month';

    // Get or create Stripe customer
    let customerId: string;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData?.stripeCustomerId) {
      customerId = userData.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const stripe = getStripe();
      const customer = await stripe.customers.create({
        email: decodedClaims.email || undefined,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;

      // Save to user document
      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId,
        updatedAt: Timestamp.now(),
      });
    }

    // Create Stripe checkout session for subscription
    const stripe = getStripe();

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: amount,
            recurring: {
              interval,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      metadata: {
        userId: userId,
        planId,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planId,
        },
      },
    });

    // Create pending subscription record
    await db.collection('subscriptions').add({
      userId,
      planId,
      status: 'pending',
      billingCycle,
      stripeSessionId: checkoutSession.id,
      amount,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH: Update subscription (upgrade/downgrade)
export async function PATCH(request: NextRequest) {
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
    const { action, newPlanId } = body;

    // Get current subscription
    const subscriptionQuery = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (subscriptionQuery.empty) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const subscriptionDoc = subscriptionQuery.docs[0];
    const subscription = subscriptionDoc.data();

    const stripe = getStripe();

    switch (action) {
      case 'upgrade':
      case 'downgrade': {
        if (!newPlanId || !isValidPlan(newPlanId)) {
          return NextResponse.json({ error: 'Invalid new plan ID' }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: `Plan change to ${newPlanId} scheduled`,
          note: 'Full Stripe subscription update would happen here',
        });
      }

      case 'cancel': {
        // Cancel at period end
        if (subscription.stripeSubscriptionId) {
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
        }

        await subscriptionDoc.ref.update({
          cancelAtPeriodEnd: true,
          updatedAt: Timestamp.now(),
        });

        return NextResponse.json({
          success: true,
          message: 'Subscription will cancel at the end of the billing period',
        });
      }

      case 'reactivate': {
        // Reactivate a cancelled subscription
        if (subscription.stripeSubscriptionId) {
          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: false,
          });
        }

        await subscriptionDoc.ref.update({
          cancelAtPeriodEnd: false,
          updatedAt: Timestamp.now(),
        });

        return NextResponse.json({
          success: true,
          message: 'Subscription reactivated',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action', validActions: ['upgrade', 'downgrade', 'cancel', 'reactivate'] },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel subscription immediately
export async function DELETE() {
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

    // Get current subscription
    const subscriptionQuery = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (subscriptionQuery.empty) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const subscriptionDoc = subscriptionQuery.docs[0];
    const subscription = subscriptionDoc.data();

    const stripe = getStripe();

    // Cancel immediately in Stripe
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update database
    await subscriptionDoc.ref.update({
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled immediately',
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
