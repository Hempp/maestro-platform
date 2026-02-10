/**
 * STRIPE CHECKOUT SESSION API
 * Creates a Stripe checkout session for certification payment
 *
 * This is triggered AFTER the user completes their certification
 * (pay-after-completion model)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { stripe, CERTIFICATION_PRICES, isValidTier, type CertificationTier } from '@/lib/stripe/config';
import { rateLimit, RATE_LIMITS } from '@/lib/security';

export async function POST(request: NextRequest) {
  // Rate limit payment endpoints strictly
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.auth);
  if (rateLimitResponse) return rateLimitResponse;

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
    const { data: certificate, error: certError } = await (supabase as any)
      .from('certificates')
      .select('id, course_id, user_id, verified_at')
      .eq('id', certificateId)
      .eq('user_id', user.id)
      .single();

    if (certError || !certificate) {
      return NextResponse.json(
        { error: 'Certificate not found or does not belong to this user' },
        { status: 404 }
      );
    }

    // Check if certificate is already verified (paid)
    if (certificate.verified_at) {
      return NextResponse.json(
        { error: 'This certificate has already been paid for' },
        { status: 400 }
      );
    }

    // Get user details for the checkout session
    const { data: userData } = await (supabase as any)
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: userData?.email || user.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
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
    await (supabase as any)
      .from('payments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        amount: tierConfig.amount / 100, // Convert cents to dollars for DB
        currency: 'usd',
        status: 'pending',
        stripe_payment_intent_id: session.id, // Store session ID initially
        payment_method: 'stripe',
      });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
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
