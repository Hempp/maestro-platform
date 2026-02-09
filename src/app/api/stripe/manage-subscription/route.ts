/**
 * STRIPE SUBSCRIPTION MANAGEMENT API
 * Handles subscription updates, cancellations, and billing portal access
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/config';

// GET - Get current subscription details
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: subscription, error } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !subscription) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
  }
}

// POST - Manage subscription (cancel, resume, portal)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body as { action: 'cancel' | 'resume' | 'portal' };

    // Get user's subscription
    const { data: subscription, error: subError } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const stripe = getStripe();

    switch (action) {
      case 'cancel': {
        // Cancel at period end (user keeps access until end of billing period)
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        // Update local record
        await (supabase as any)
          .from('subscriptions')
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        return NextResponse.json({
          success: true,
          message: 'Subscription will cancel at the end of your billing period',
          cancelAt: subscription.current_period_end,
        });
      }

      case 'resume': {
        // Resume a subscription that was set to cancel
        if (!subscription.cancel_at_period_end) {
          return NextResponse.json({ error: 'Subscription is not set to cancel' }, { status: 400 });
        }

        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: false,
        });

        await (supabase as any)
          .from('subscriptions')
          .update({
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        return NextResponse.json({
          success: true,
          message: 'Subscription has been resumed',
        });
      }

      case 'portal': {
        // Create Stripe billing portal session
        if (!subscription.stripe_customer_id) {
          return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: subscription.stripe_customer_id,
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
