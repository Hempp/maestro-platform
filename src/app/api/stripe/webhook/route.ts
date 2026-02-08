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
