/**
 * STRIPE SUBSCRIPTION CHECKOUT API (Firebase)
 * Creates a Stripe checkout session for subscription plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { getStripe, SUBSCRIPTION_PLANS, isValidPlan, type SubscriptionPlanId } from '@/lib/stripe/config';
import { rateLimit, RATE_LIMITS } from '@/lib/security';

export async function POST(request: NextRequest) {
  // Rate limit payment endpoints strictly
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    // Parse request body
    const body = await request.json();
    const { planId, billingCycle = 'monthly' } = body as {
      planId: string;
      billingCycle?: 'monthly' | 'yearly';
    };

    // Validate plan
    if (!planId || !isValidPlan(planId)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanId];
    const amount = billingCycle === 'yearly' ? plan.yearlyAmount : plan.monthlyAmount;
    const interval = billingCycle === 'yearly' ? 'year' : 'month';

    // Check for existing active subscription
    const existingSubQuery = await db
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', 'in', ['active', 'trialing'])
      .limit(1)
      .get();

    if (!existingSubQuery.empty) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Please manage it from your dashboard.' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const stripe = getStripe();
    let customerId = userData?.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: decodedClaims.email || undefined,
        name: userData?.fullName || undefined,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to user doc
      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId,
        updatedAt: Timestamp.now(),
      });
    }

    // Create Stripe checkout session for subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        planId: planId,
        billingCycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planId: planId,
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
              metadata: {
                planId: planId,
              },
            },
            unit_amount: amount,
            recurring: {
              interval: interval,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      allow_promotion_codes: true,
    });

    // Create pending subscription record
    await db.collection('subscriptions').add({
      userId,
      planId,
      status: 'pending',
      billingCycle,
      stripeCustomerId: customerId,
      stripeSessionId: checkoutSession.id,
      amount,
      currency: 'usd',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Subscription checkout error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create subscription checkout' },
      { status: 500 }
    );
  }
}
