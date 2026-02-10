/**
 * STRIPE CHECKOUT SESSION API (Firebase)
 * Creates a Stripe checkout session for certification payment
 *
 * This is triggered AFTER the user completes their certification
 * (pay-after-completion model)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { stripe, CERTIFICATION_PRICES, isValidTier, type CertificationTier } from '@/lib/stripe/config';
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
    const { tier, courseId, certificateId } = body as {
      tier: string;
      courseId: string;
      certificateId: string;
    };

    // Validate required fields
    if (!tier || !courseId || !certificateId) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, courseId, and certificateId are required' },
        { status: 400 }
      );
    }

    // Validate tier
    if (!isValidTier(tier)) {
      return NextResponse.json(
        { error: 'Invalid certification tier. Must be: student, employee, or owner' },
        { status: 400 }
      );
    }

    const tierConfig = CERTIFICATION_PRICES[tier as CertificationTier];

    // Verify the certificate exists and belongs to this user
    const certificateDoc = await db.collection('certificates').doc(certificateId).get();

    if (!certificateDoc.exists) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    const certificate = certificateDoc.data();

    if (certificate?.userId !== userId) {
      return NextResponse.json(
        { error: 'Certificate does not belong to this user' },
        { status: 404 }
      );
    }

    // Check if certificate is already verified (paid)
    if (certificate?.verifiedAt) {
      return NextResponse.json(
        { error: 'This certificate has already been paid for' },
        { status: 400 }
      );
    }

    // Get user details for the checkout session
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userData?.email || decodedClaims.email,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        courseId: courseId,
        certificateId: certificateId,
        tier: tier,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tierConfig.name,
              description: tierConfig.description,
              metadata: {
                tier: tier,
                courseId: courseId,
              },
            },
            unit_amount: tierConfig.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${certificateId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${certificateId}?payment=cancelled`,
    });

    // Create a pending payment record
    await db.collection('payments').add({
      userId,
      courseId,
      amount: tierConfig.amount / 100, // Convert cents to dollars for DB
      currency: 'usd',
      status: 'pending',
      stripePaymentIntentId: checkoutSession.id, // Store session ID initially
      paymentMethod: 'stripe',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
