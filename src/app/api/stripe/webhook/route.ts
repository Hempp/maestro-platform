/**
 * STRIPE WEBHOOK HANDLER
 * Handles Stripe webhook events for payment confirmation
 *
 * This endpoint receives events from Stripe and updates:
 * - Payment status in the payments table
 * - Certification submission status (submitted -> passed)
 * - Certificate verification and SBT minting
 * - User tier upgrade
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import { createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';
import { sbtMinter } from '@/lib/blockchain/sbt-minter';

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

      // ═══════════════════════════════════════════════════════════════════════
      // SUBSCRIPTION EVENTS
      // ═══════════════════════════════════════════════════════════════════════

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(supabase, subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabase, invoice);
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
 * Supports both legacy certificate flow and new certification_submissions flow
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const { userId, courseId, certificateId, tier, path, submissionId } = session.metadata || {};

  // Check if this is a certification submission flow (new milestone-based system)
  if (userId && path && submissionId) {
    await handleCertificationPayment(supabase, session, {
      userId,
      path: path as 'student' | 'employee' | 'owner',
      submissionId,
    });
    return;
  }

  // Legacy certificate flow
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
 * Handle certification payment for milestone-based submissions
 * Flow: Complete M10 -> Submit -> Pay -> Certificate Generated -> SBT Minted
 */
async function handleCertificationPayment(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  metadata: {
    userId: string;
    path: 'student' | 'employee' | 'owner';
    submissionId: string;
  }
) {
  const { userId, path, submissionId } = metadata;

  console.log('Processing certification payment:', { userId, path, submissionId });

  try {
    // 1. Update certification_submission status from 'submitted' to 'passed'
    const { data: submission, error: submissionError } = await (supabase as any)
      .from('certification_submissions')
      .update({
        status: 'passed',
        reviewed_at: new Date().toISOString(),
        reviewer_notes: 'Payment verified - auto-approved',
      })
      .eq('id', submissionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (submissionError) {
      console.error('Failed to update certification submission:', submissionError);
      throw submissionError;
    }

    // 2. Create payment record
    const { error: paymentError } = await (supabase as any)
      .from('payments')
      .upsert({
        user_id: userId,
        course_id: path, // Use path as course identifier
        amount: (session.amount_total || 0) / 100,
        currency: session.currency || 'usd',
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent as string,
        payment_method: 'stripe',
        completed_at: new Date().toISOString(),
        metadata: {
          checkout_session_id: session.id,
          submission_id: submissionId,
          path,
        },
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
    }

    // 3. Create or update certificate record
    const certificateData = {
      user_id: userId,
      certificate_type: path,
      issued_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
      metadata: {
        submission_id: submissionId,
        payment_session_id: session.id,
        payment_intent_id: session.payment_intent,
        amount_paid: session.amount_total,
        currency: session.currency,
        total_score: submission?.total_score || null,
        path,
      },
    };

    const { data: certificate, error: certError } = await (supabase as any)
      .from('certificates')
      .upsert(certificateData, {
        onConflict: 'user_id,certificate_type',
      })
      .select()
      .single();

    if (certError) {
      console.error('Failed to create certificate:', certError);
    }

    // 4. Update user tier in learner_profiles
    const tierMap = {
      student: 'certified_student',
      employee: 'certified_employee',
      owner: 'certified_owner',
    };

    await (supabase as any)
      .from('learner_profiles')
      .upsert({
        user_id: userId,
        tier: tierMap[path],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    // 5. Queue SBT minting (async, non-blocking)
    await queueSBTMinting(supabase, userId, path, certificate?.id || submissionId);

    // 6. Create success notification
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'certificate_issued',
        title: 'Congratulations! You are now certified!',
        message: `Your ${path.charAt(0).toUpperCase() + path.slice(1)} Path certification is complete. Your Soulbound Token is being minted.`,
        action_url: `/certification/success?path=${path}`,
      });

    console.log('Certification payment processed successfully:', { userId, path, certificateId: certificate?.id });
  } catch (error) {
    console.error('Certification payment processing failed:', error);
    throw error;
  }
}

/**
 * Queue SBT minting job
 * In production, this would add to a job queue (e.g., BullMQ, Inngest)
 * For now, we'll attempt minting directly with error handling
 */
async function queueSBTMinting(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  path: 'student' | 'employee' | 'owner',
  certificateId: string
) {
  try {
    // Get user's wallet address if they have one
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('wallet_address')
      .eq('id', userId)
      .single();

    if (!profile?.wallet_address) {
      console.log('No wallet address for user, SBT minting deferred:', userId);

      // Create a pending mint record
      await (supabase as any)
        .from('pending_mints')
        .upsert({
          user_id: userId,
          certificate_id: certificateId,
          path,
          status: 'pending_wallet',
          created_at: new Date().toISOString(),
        });

      return;
    }

    // Attempt to mint SBT
    console.log('Attempting SBT mint for:', { userId, path, walletAddress: profile.wallet_address });

    // Get milestone data for verification
    const { data: milestones } = await (supabase as any)
      .from('user_milestones')
      .select('*')
      .eq('user_id', userId)
      .eq('path', path)
      .eq('status', 'approved');

    const completedAKUs = milestones?.map((m: { milestone_number: number }) =>
      `${path}-milestone-${m.milestone_number}`
    ) || [];

    // Create a mock verification result for minting
    const verificationResult = {
      passed: true,
      akuId: `${path}-certification`,
      learnerId: userId,
      timestamp: new Date(),
      outputValidations: [],
      executionResults: [],
      struggleScore: 30, // Default good score
      hintsUsed: 0,
      timeToComplete: 0,
      workflowSnapshot: '',
    };

    const mintResult = await sbtMinter.mintCertificate(
      profile.wallet_address,
      verificationResult,
      `${path.charAt(0).toUpperCase() + path.slice(1)} Path`,
      completedAKUs
    );

    if (mintResult.success) {
      // Update certificate with SBT info
      await (supabase as any)
        .from('certificates')
        .update({
          sbt_token_id: mintResult.tokenId,
          sbt_transaction_hash: mintResult.transactionHash,
          sbt_minted_at: new Date().toISOString(),
        })
        .eq('id', certificateId);

      console.log('SBT minted successfully:', mintResult);
    } else {
      console.error('SBT minting failed:', mintResult.error);

      // Record failed mint attempt
      await (supabase as any)
        .from('pending_mints')
        .upsert({
          user_id: userId,
          certificate_id: certificateId,
          path,
          status: 'failed',
          error: mintResult.error,
          created_at: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('SBT minting queue error:', error);
  }
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

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle new subscription creation
 */
async function handleSubscriptionCreated(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  // Use type assertion for Stripe API compatibility
  const sub = subscription as unknown as {
    id: string;
    customer: string;
    status: Stripe.Subscription.Status;
    currency: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    canceled_at: number | null;
    metadata: Record<string, string>;
    items: { data: Array<{ price: { id: string; unit_amount: number | null; recurring?: { interval: string } } }> };
  };

  const customerId = sub.customer;
  const priceId = sub.items.data[0]?.price.id;
  const planId = sub.metadata?.plan_id || 'starter';

  console.log('Subscription created:', { customerId, planId, subscriptionId: sub.id });

  // Find user by stripe_customer_id
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }

  // Create subscription record
  const { error } = await (supabase as any)
    .from('subscriptions')
    .upsert({
      user_id: profile.id,
      plan_id: planId,
      status: mapStripeStatus(sub.status),
      billing_cycle: sub.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      amount: sub.items.data[0]?.price.unit_amount || 0,
      currency: sub.currency,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
    }, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Failed to create subscription:', error);
  }

  // Send welcome notification
  await (supabase as any)
    .from('notifications')
    .insert({
      user_id: profile.id,
      type: 'subscription_created',
      title: 'Welcome to your new plan!',
      message: `Your ${planId} subscription is now active.`,
      action_url: '/dashboard/subscription',
    });

  console.log('Subscription created for user:', profile.id);
}

/**
 * Handle subscription updates (upgrades, downgrades, cancellations)
 */
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  // Use type assertion for Stripe API compatibility
  const sub = subscription as unknown as {
    id: string;
    status: Stripe.Subscription.Status;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    canceled_at: number | null;
    metadata: Record<string, string>;
    items: { data: Array<{ price: { unit_amount: number | null } }> };
  };

  const subscriptionId = sub.id;
  const newStatus = mapStripeStatus(sub.status);
  const planId = sub.metadata?.plan_id;

  console.log('Subscription updated:', { subscriptionId, status: newStatus, planId });

  const updateData: Record<string, unknown> = {
    status: newStatus,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  if (planId) {
    updateData.plan_id = planId;
    updateData.amount = sub.items.data[0]?.price.unit_amount || 0;
  }

  if (sub.canceled_at) {
    updateData.cancelled_at = new Date(sub.canceled_at * 1000).toISOString();
  }

  const { error } = await (supabase as any)
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Failed to update subscription:', error);
  }
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const subscriptionId = subscription.id;

  console.log('Subscription deleted:', subscriptionId);

  // Get the subscription to find the user
  const { data: sub } = await (supabase as any)
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  // Update status to cancelled
  const { error } = await (supabase as any)
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Failed to cancel subscription:', error);
  }

  // Notify user
  if (sub?.user_id) {
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: sub.user_id,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled. You can resubscribe anytime.',
        action_url: '/pricing',
      });
  }
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaid(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  // Use type assertion for Stripe API compatibility
  const inv = invoice as unknown as { subscription: string | null };
  const subscriptionId = inv.subscription;
  if (!subscriptionId) return; // One-time payment, not subscription

  console.log('Invoice paid for subscription:', subscriptionId);

  // Update subscription status to active
  await (supabase as any)
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  // Use type assertion for Stripe API compatibility
  const inv = invoice as unknown as { subscription: string | null };
  const subscriptionId = inv.subscription;
  if (!subscriptionId) return;

  console.log('Invoice payment failed for subscription:', subscriptionId);

  // Get user from subscription
  const { data: sub } = await (supabase as any)
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  // Update status to past_due
  await (supabase as any)
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  // Notify user
  if (sub?.user_id) {
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: sub.user_id,
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'We couldn\'t process your subscription payment. Please update your payment method.',
        action_url: '/dashboard/subscription/billing',
      });
  }
}

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'active',
    canceled: 'cancelled',
    incomplete: 'incomplete',
    incomplete_expired: 'cancelled',
    past_due: 'past_due',
    paused: 'cancelled',
    trialing: 'trialing',
    unpaid: 'past_due',
  };
  return statusMap[stripeStatus] || 'pending';
}
