/**
 * STRIPE WEBHOOK HANDLER
 * Handles Stripe webhook events for payment confirmation
 *
 * This endpoint receives events from Stripe and updates:
 * - Payment status in the payments table
 * - Certificate verification status
 * - User tier upgrade
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import { createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

// Disable body parsing - Stripe needs the raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for webhook operations
    const supabase = createAdminClient();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const { userId, courseId, certificateId, tier } = session.metadata || {};

  if (!userId || !courseId || !certificateId || !tier) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  console.log('Processing payment for:', { userId, courseId, certificateId, tier });

  // Update payment status
  const { error: paymentError } = await (supabase as any)
    .from('payments')
    .update({
      status: 'completed',
      stripe_payment_intent_id: session.payment_intent as string,
      completed_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', session.id)
    .eq('user_id', userId);

  if (paymentError) {
    console.error('Failed to update payment:', paymentError);
  }

  // Update certificate verification status
  const { error: certError } = await (supabase as any)
    .from('certificates')
    .update({
      verified_at: new Date().toISOString(),
      metadata: {
        payment_session_id: session.id,
        payment_intent_id: session.payment_intent,
        amount_paid: session.amount_total,
        currency: session.currency,
        paid_at: new Date().toISOString(),
      },
    })
    .eq('id', certificateId)
    .eq('user_id', userId);

  if (certError) {
    console.error('Failed to update certificate:', certError);
  }

  // Update user tier in learner_profiles
  const { error: tierError } = await (supabase as any)
    .from('learner_profiles')
    .update({
      tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (tierError) {
    console.error('Failed to update user tier:', tierError);
  }

  // Create notification for the user
  await (supabase as any)
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'certificate_issued',
      title: 'Payment Successful!',
      message: `Your ${tier} certification has been verified and is now active.`,
      action_url: `/certificates/${certificateId}`,
    });

  console.log('Payment processed successfully for user:', userId);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  const { userId, courseId } = paymentIntent.metadata || {};

  if (!userId || !courseId) {
    console.error('Missing metadata in payment intent:', paymentIntent.id);
    return;
  }

  // Update payment status to failed
  const { error } = await (supabase as any)
    .from('payments')
    .update({
      status: 'failed',
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to update payment status:', error);
  }

  // Notify user of failed payment
  await (supabase as any)
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'reminder',
      title: 'Payment Failed',
      message: 'Your certification payment could not be processed. Please try again.',
      action_url: `/dashboard/certificates`,
    });

  console.log('Payment failed for user:', userId);
}
