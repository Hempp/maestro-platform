/**
 * LOGOUT API ROUTE (Firebase)
 * Signs out the current user and clears session cookie
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (session) {
      try {
        // Optionally revoke all sessions for this user
        const auth = getAdminAuth();
        const decodedClaims = await auth.verifySessionCookie(session);
        await auth.revokeRefreshTokens(decodedClaims.uid);
      } catch {
        // Session might already be invalid, continue to clear cookie
      }
    }

    // Clear the session cookie
    cookieStore.delete('session');

    return NextResponse.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

/**
 * GET - Also support GET for simple logout links
 */
export async function GET() {
  return POST();
}
