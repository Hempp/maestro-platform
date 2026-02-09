/**
 * STRIPE SUBSCRIPTION CHECKOUT API
 * Creates a Stripe checkout session for subscription plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStripe, SUBSCRIPTION_PLANS, isValidPlan, type SubscriptionPlanId } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
    const { data: existingSub } = await (supabase as any)
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    if (existingSub) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Please manage it from your dashboard.' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .single();

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await (supabase as any)
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        plan_id: planId,
        billing_cycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan_id: planId,
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
    await (supabase as any)
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: 'pending',
        billing_cycle: billingCycle,
        stripe_customer_id: customerId,
        stripe_session_id: session.id,
        amount: amount,
        currency: 'usd',
      });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
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
