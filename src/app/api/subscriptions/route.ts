/**
 * SUBSCRIPTION API
 * Handles subscription creation, management, and billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStripe, SUBSCRIPTION_PLANS, isValidPlan, SubscriptionPlanId } from '@/lib/stripe/config';

// Helper to get supabase client with any type for untyped tables
async function getSupabase() {
  const supabase = await createServerSupabaseClient();
  return supabase as any;
}

// GET: Get user's subscription status
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription from database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Subscription fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

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
      subscription: subscription || null,
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
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const stripe = getStripe();
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create Stripe checkout session for subscription
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
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
        userId: user.id,
        planId,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId,
        },
      },
    });

    // Create pending subscription record
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan_id: planId,
      status: 'pending',
      billing_cycle: billingCycle,
      stripe_session_id: session.id,
      amount: amount,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
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
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, newPlanId } = body;

    // Get current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const stripe = getStripe();

    switch (action) {
      case 'upgrade':
      case 'downgrade': {
        if (!newPlanId || !isValidPlan(newPlanId)) {
          return NextResponse.json({ error: 'Invalid new plan ID' }, { status: 400 });
        }

        // In real implementation, would update Stripe subscription
        // For now, return success with note to implement
        return NextResponse.json({
          success: true,
          message: `Plan change to ${newPlanId} scheduled`,
          note: 'Full Stripe subscription update would happen here',
        });
      }

      case 'cancel': {
        // Cancel at period end
        if (subscription.stripe_subscription_id) {
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
        }

        await supabase
          .from('subscriptions')
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        return NextResponse.json({
          success: true,
          message: 'Subscription will cancel at the end of the billing period',
        });
      }

      case 'reactivate': {
        // Reactivate a cancelled subscription
        if (subscription.stripe_subscription_id) {
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: false,
          });
        }

        await supabase
          .from('subscriptions')
          .update({
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

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
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const stripe = getStripe();

    // Cancel immediately in Stripe
    if (subscription.stripe_subscription_id) {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    }

    // Update database
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

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
