/**
 * SEAT PURCHASE API
 * Handles seat purchases for tiered live events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Check if user has free access to a session based on their tier
function hasFreeTierAccess(userTier: string | null, sessionTier: string): boolean {
  if (!userTier) userTier = 'student';

  if (userTier === 'owner') return true; // Owners access everything
  if (userTier === 'employee' && ['student', 'employee'].includes(sessionTier)) return true;
  if (userTier === 'student' && sessionTier === 'student') return true;

  return false;
}

// GET: Check access status for a session
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get user's tier
    const { data: userData } = await (supabase as any)
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    const userTier = (userData?.tier as string) || 'student';

    // Get session details
    const { data: session, error } = await (supabase as any)
      .from('live_sessions')
      .select('id, target_tier, seat_price, max_seats, early_bird_price, early_bird_deadline')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user already purchased
    const { data: existingPurchase } = await (supabase as any)
      .from('seat_purchases')
      .select('id, payment_status')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('payment_status', 'completed')
      .single();

    // Check current enrollment count
    const { count: enrollmentCount } = await (supabase as any)
      .from('session_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    const hasFreeAccess = hasFreeTierAccess(userTier, session.target_tier);
    const hasPurchased = !!existingPurchase;
    const hasAccess = hasFreeAccess || hasPurchased;
    const seatsAvailable = (session.max_seats || 100) - (enrollmentCount || 0);

    // Calculate price (check early bird)
    let price = session.seat_price || 0;
    let isEarlyBird = false;
    if (session.early_bird_price && session.early_bird_deadline) {
      if (new Date() < new Date(session.early_bird_deadline)) {
        price = session.early_bird_price;
        isEarlyBird = true;
      }
    }

    return NextResponse.json({
      sessionId,
      userTier,
      sessionTier: session.target_tier,
      hasFreeAccess,
      hasPurchased,
      hasAccess,
      price: hasFreeAccess ? 0 : price,
      isEarlyBird,
      earlyBirdDeadline: session.early_bird_deadline,
      seatsAvailable,
      maxSeats: session.max_seats,
    });
  } catch (error) {
    console.error('Session access check error:', error);
    return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
  }
}

// POST: Purchase a seat
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get user's tier
    const { data: userData } = await (supabase as any)
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    const userTier = (userData?.tier as string) || 'student';

    // Get session details
    const { data: session, error: sessionError } = await (supabase as any)
      .from('live_sessions')
      .select('id, target_tier, seat_price, max_seats, early_bird_price, early_bird_deadline')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if user already has free access
    if (hasFreeTierAccess(userTier, session.target_tier)) {
      return NextResponse.json({ error: 'You already have free access to this session' }, { status: 400 });
    }

    // Check if already purchased
    const { data: existingPurchase } = await (supabase as any)
      .from('seat_purchases')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('payment_status', 'completed')
      .single();

    if (existingPurchase) {
      return NextResponse.json({ error: 'You already purchased a seat for this session' }, { status: 400 });
    }

    // Check seat availability
    const { count: enrollmentCount } = await (supabase as any)
      .from('session_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if ((enrollmentCount || 0) >= (session.max_seats || 100)) {
      return NextResponse.json({ error: 'No seats available' }, { status: 400 });
    }

    // Calculate price
    let price = session.seat_price || 0;
    if (session.early_bird_price && session.early_bird_deadline) {
      if (new Date() < new Date(session.early_bird_deadline)) {
        price = session.early_bird_price;
      }
    }

    // For now, create a "completed" purchase (integrate Stripe later)
    // In production, you'd create a Stripe checkout session here
    const { data: purchase, error: purchaseError } = await (supabase as any)
      .from('seat_purchases')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        amount_paid: price,
        payment_status: 'completed', // Would be 'pending' with real payments
        payment_intent_id: `demo_${Date.now()}`, // Placeholder
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Also enroll the user in the session
    await (supabase as any)
      .from('session_enrollments')
      .insert({
        session_id: sessionId,
        student_id: user.id,
        access_type: 'purchased',
        purchase_id: purchase.id,
      });

    return NextResponse.json({
      success: true,
      purchase,
      message: 'Seat purchased successfully!',
    });
  } catch (error) {
    console.error('Seat purchase error:', error);
    return NextResponse.json({ error: 'Failed to purchase seat' }, { status: 500 });
  }
}
