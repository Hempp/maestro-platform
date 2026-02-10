/**
 * STRIPE WEBHOOK HANDLER (Firebase)
 * Handles Stripe webhook events for payment confirmation
 *
 * This endpoint receives events from Stripe and updates:
 * - Payment status in the payments collection
 * - Certification submission status (submitted -> passed)
 * - Certificate verification and SBT minting
 * - User tier upgrade
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/config';
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
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

    const db = getAdminDb();

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(db, session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(db, paymentIntent);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SUBSCRIPTION EVENTS
      // ═══════════════════════════════════════════════════════════════════════

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(db, subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(db, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(db, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(db, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(db, invoice);
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
  db: FirebaseFirestore.Firestore,
  session: Stripe.Checkout.Session
) {
  const { userId, courseId, certificateId, tier, path, submissionId } = session.metadata || {};

  // Check if this is a certification submission flow (new milestone-based system)
  if (userId && path && submissionId) {
    await handleCertificationPayment(db, session, {
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

  // Update payment status - find by session ID
  const paymentsQuery = await db
    .collection('payments')
    .where('stripePaymentIntentId', '==', session.id)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (!paymentsQuery.empty) {
    await paymentsQuery.docs[0].ref.update({
      status: 'completed',
      stripePaymentIntentId: session.payment_intent as string,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  // Update certificate verification status
  const certRef = db.collection('certificates').doc(certificateId);
  const certDoc = await certRef.get();

  if (certDoc.exists && certDoc.data()?.userId === userId) {
    await certRef.update({
      verifiedAt: Timestamp.now(),
      metadata: {
        ...certDoc.data()?.metadata,
        paymentSessionId: session.id,
        paymentIntentId: session.payment_intent,
        amountPaid: session.amount_total,
        currency: session.currency,
        paidAt: new Date().toISOString(),
      },
      updatedAt: Timestamp.now(),
    });
  }

  // Update user tier in learner_profiles
  const learnerRef = db.collection('learnerProfiles').doc(userId);
  const learnerDoc = await learnerRef.get();

  if (learnerDoc.exists) {
    await learnerRef.update({
      tier: tier,
      updatedAt: Timestamp.now(),
    });
  }

  // Create notification for the user
  await db.collection('notifications').add({
    userId,
    type: 'certificate_issued',
    title: 'Payment Successful!',
    message: `Your ${tier} certification has been verified and is now active.`,
    actionUrl: `/certificates/${certificateId}`,
    read: false,
    createdAt: Timestamp.now(),
  });

  console.log('Payment processed successfully for user:', userId);
}

/**
 * Handle certification payment for milestone-based submissions
 * Flow: Complete M10 -> Submit -> Pay -> Certificate Generated -> SBT Minted
 */
async function handleCertificationPayment(
  db: FirebaseFirestore.Firestore,
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
    const submissionRef = db.collection('certificationSubmissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();

    if (!submissionDoc.exists || submissionDoc.data()?.userId !== userId) {
      console.error('Submission not found or user mismatch:', submissionId);
      return;
    }

    const submissionData = submissionDoc.data();
    await submissionRef.update({
      status: 'passed',
      reviewedAt: Timestamp.now(),
      reviewerNotes: 'Payment verified - auto-approved',
      updatedAt: Timestamp.now(),
    });

    // 2. Create payment record
    await db.collection('payments').add({
      userId,
      courseId: path, // Use path as course identifier
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      status: 'completed',
      stripePaymentIntentId: session.payment_intent as string,
      metadata: {
        checkoutSessionId: session.id,
        submissionId,
        path,
      },
      completedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 3. Create or update certificate record
    const certificateData = {
      userId,
      certificateType: path,
      issuedAt: Timestamp.now(),
      verifiedAt: Timestamp.now(),
      metadata: {
        submissionId,
        paymentSessionId: session.id,
        paymentIntentId: session.payment_intent,
        amountPaid: session.amount_total,
        currency: session.currency,
        totalScore: submissionData?.totalScore || null,
        path,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Check for existing certificate by userId and type
    const existingCertQuery = await db
      .collection('certificates')
      .where('userId', '==', userId)
      .where('certificateType', '==', path)
      .limit(1)
      .get();

    let certificateId: string;
    if (existingCertQuery.empty) {
      const newCert = await db.collection('certificates').add(certificateData);
      certificateId = newCert.id;
    } else {
      certificateId = existingCertQuery.docs[0].id;
      await existingCertQuery.docs[0].ref.update({
        ...certificateData,
        createdAt: existingCertQuery.docs[0].data().createdAt, // Keep original
      });
    }

    // 4. Update user tier in learner_profiles
    const tierMap: Record<string, string> = {
      student: 'certified_student',
      employee: 'certified_employee',
      owner: 'certified_owner',
    };

    const learnerRef = db.collection('learnerProfiles').doc(userId);
    const learnerDoc = await learnerRef.get();

    if (learnerDoc.exists) {
      await learnerRef.update({
        tier: tierMap[path],
        updatedAt: Timestamp.now(),
      });
    } else {
      await learnerRef.set({
        userId,
        tier: tierMap[path],
        currentPath: path,
        interactionDna: {},
        struggleScore: 50,
        totalLearningTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityAt: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // 5. Queue SBT minting (async, non-blocking)
    await queueSBTMinting(db, userId, path, certificateId);

    // 6. Create success notification
    await db.collection('notifications').add({
      userId,
      type: 'certificate_issued',
      title: 'Congratulations! You are now certified!',
      message: `Your ${path.charAt(0).toUpperCase() + path.slice(1)} Path certification is complete. Your Soulbound Token is being minted.`,
      actionUrl: `/certification/success?path=${path}`,
      read: false,
      createdAt: Timestamp.now(),
    });

    console.log('Certification payment processed successfully:', { userId, path, certificateId });
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
  db: FirebaseFirestore.Firestore,
  userId: string,
  path: 'student' | 'employee' | 'owner',
  certificateId: string
) {
  try {
    // Get user's wallet address if they have one
    const userDoc = await db.collection('users').doc(userId).get();
    const walletAddress = userDoc.data()?.walletAddress;

    if (!walletAddress) {
      console.log('No wallet address for user, SBT minting deferred:', userId);

      // Create a pending mint record
      await db.collection('pendingMints').add({
        userId,
        certificateId,
        path,
        status: 'pending_wallet',
        createdAt: Timestamp.now(),
      });

      return;
    }

    // Attempt to mint SBT
    console.log('Attempting SBT mint for:', { userId, path, walletAddress });

    // Get milestone data for verification
    const milestonesSnapshot = await db
      .collection('userMilestones')
      .where('userId', '==', userId)
      .where('path', '==', path)
      .where('status', '==', 'approved')
      .get();

    const completedAKUs = milestonesSnapshot.docs.map(doc =>
      `${path}-milestone-${doc.data().milestoneNumber}`
    );

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
      walletAddress,
      verificationResult,
      `${path.charAt(0).toUpperCase() + path.slice(1)} Path`,
      completedAKUs
    );

    if (mintResult.success) {
      // Update certificate with SBT info
      await db.collection('certificates').doc(certificateId).update({
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
        updatedAt: Timestamp.now(),
      });

      console.log('SBT minted successfully:', mintResult);
    } else {
      console.error('SBT minting failed:', mintResult.error);

      // Record failed mint attempt
      await db.collection('pendingMints').add({
        userId,
        certificateId,
        path,
        status: 'failed',
        error: mintResult.error,
        createdAt: Timestamp.now(),
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
  db: FirebaseFirestore.Firestore,
  paymentIntent: Stripe.PaymentIntent
) {
  const { userId, courseId } = paymentIntent.metadata || {};

  if (!userId || !courseId) {
    console.error('Missing metadata in payment intent:', paymentIntent.id);
    return;
  }

  // Update payment status to failed
  const paymentsQuery = await db
    .collection('payments')
    .where('stripePaymentIntentId', '==', paymentIntent.id)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (!paymentsQuery.empty) {
    await paymentsQuery.docs[0].ref.update({
      status: 'failed',
      updatedAt: Timestamp.now(),
    });
  }

  // Notify user of failed payment
  await db.collection('notifications').add({
    userId,
    type: 'reminder',
    title: 'Payment Failed',
    message: 'Your certification payment could not be processed. Please try again.',
    actionUrl: `/dashboard/certificates`,
    read: false,
    createdAt: Timestamp.now(),
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
  db: FirebaseFirestore.Firestore,
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

  // Find user by stripeCustomerId
  const usersQuery = await db
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (usersQuery.empty) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }

  const userId = usersQuery.docs[0].id;

  // Check for existing subscription by stripe ID
  const existingSubQuery = await db
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', sub.id)
    .limit(1)
    .get();

  const subscriptionData = {
    userId,
    planId,
    status: mapStripeStatus(sub.status),
    billingCycle: sub.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly',
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    amount: sub.items.data[0]?.price.unit_amount || 0,
    currency: sub.currency,
    currentPeriodStart: Timestamp.fromMillis(sub.current_period_start * 1000),
    currentPeriodEnd: Timestamp.fromMillis(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    updatedAt: Timestamp.now(),
  };

  if (existingSubQuery.empty) {
    await db.collection('subscriptions').add({
      ...subscriptionData,
      createdAt: Timestamp.now(),
    });
  } else {
    await existingSubQuery.docs[0].ref.update(subscriptionData);
  }

  // Send welcome notification
  await db.collection('notifications').add({
    userId,
    type: 'subscription_created',
    title: 'Welcome to your new plan!',
    message: `Your ${planId} subscription is now active.`,
    actionUrl: '/dashboard/subscription',
    read: false,
    createdAt: Timestamp.now(),
  });

  console.log('Subscription created for user:', userId);
}

/**
 * Handle subscription updates (upgrades, downgrades, cancellations)
 */
async function handleSubscriptionUpdated(
  db: FirebaseFirestore.Firestore,
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

  // Find subscription by stripe ID
  const subsQuery = await db
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get();

  if (subsQuery.empty) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    currentPeriodStart: Timestamp.fromMillis(sub.current_period_start * 1000),
    currentPeriodEnd: Timestamp.fromMillis(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    updatedAt: Timestamp.now(),
  };

  if (planId) {
    updateData.planId = planId;
    updateData.amount = sub.items.data[0]?.price.unit_amount || 0;
  }

  if (sub.canceled_at) {
    updateData.cancelledAt = Timestamp.fromMillis(sub.canceled_at * 1000);
  }

  await subsQuery.docs[0].ref.update(updateData);
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(
  db: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const subscriptionId = subscription.id;

  console.log('Subscription deleted:', subscriptionId);

  // Find subscription by stripe ID
  const subsQuery = await db
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get();

  if (subsQuery.empty) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  const subDoc = subsQuery.docs[0];
  const userId = subDoc.data().userId;

  // Update status to cancelled
  await subDoc.ref.update({
    status: 'cancelled',
    cancelledAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Notify user
  if (userId) {
    await db.collection('notifications').add({
      userId,
      type: 'subscription_cancelled',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled. You can resubscribe anytime.',
      actionUrl: '/pricing',
      read: false,
      createdAt: Timestamp.now(),
    });
  }
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaid(
  db: FirebaseFirestore.Firestore,
  invoice: Stripe.Invoice
) {
  // Use type assertion for Stripe API compatibility
  const inv = invoice as unknown as { subscription: string | null };
  const subscriptionId = inv.subscription;
  if (!subscriptionId) return; // One-time payment, not subscription

  console.log('Invoice paid for subscription:', subscriptionId);

  // Find and update subscription
  const subsQuery = await db
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get();

  if (!subsQuery.empty) {
    await subsQuery.docs[0].ref.update({
      status: 'active',
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(
  db: FirebaseFirestore.Firestore,
  invoice: Stripe.Invoice
) {
  // Use type assertion for Stripe API compatibility
  const inv = invoice as unknown as { subscription: string | null };
  const subscriptionId = inv.subscription;
  if (!subscriptionId) return;

  console.log('Invoice payment failed for subscription:', subscriptionId);

  // Find subscription
  const subsQuery = await db
    .collection('subscriptions')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get();

  if (subsQuery.empty) return;

  const subDoc = subsQuery.docs[0];
  const userId = subDoc.data().userId;

  // Update status to past_due
  await subDoc.ref.update({
    status: 'past_due',
    updatedAt: Timestamp.now(),
  });

  // Notify user
  if (userId) {
    await db.collection('notifications').add({
      userId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: 'We couldn\'t process your subscription payment. Please update your payment method.',
      actionUrl: '/dashboard/subscription/billing',
      read: false,
      createdAt: Timestamp.now(),
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
