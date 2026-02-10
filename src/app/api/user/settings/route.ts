/**
 * USER SETTINGS API (Firebase)
 * Manage user preferences, notifications, privacy, and accessibility settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// Default settings
const getDefaultSettings = (email?: string) => ({
  displayName: email?.split('@')[0] || '',
  bio: '',
  emailNotifications: true,
  learningReminders: true,
  communityActivity: true,
  marketingEmails: false,
  learningPace: 'standard',
  dailyGoalMinutes: 30,
  showProgressOnProfile: true,
  theme: 'dark',
  twoFactorEnabled: false,
  profileVisibility: 'public',
  showActivityStatus: true,
  allowDataCollection: true,
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  screenReaderOptimized: false,
  walletConnected: false,
});

// GET: Fetch user settings
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify session and get user
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    // Fetch user settings
    const settingsDoc = await db.collection('userSettings').doc(userId).get();

    if (!settingsDoc.exists) {
      // Create default settings
      const defaultSettings = {
        userId,
        ...getDefaultSettings(decodedClaims.email),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await db.collection('userSettings').doc(userId).set(defaultSettings);

      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ settings: settingsDoc.data() });
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT: Update user settings
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // Verify session and get user
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const body = await request.json();

    // Build update data (already camelCase for Firestore)
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    // Profile
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.bio !== undefined) updateData.bio = body.bio;

    // Notifications
    if (body.emailNotifications !== undefined) updateData.emailNotifications = body.emailNotifications;
    if (body.learningReminders !== undefined) updateData.learningReminders = body.learningReminders;
    if (body.communityActivity !== undefined) updateData.communityActivity = body.communityActivity;
    if (body.marketingEmails !== undefined) updateData.marketingEmails = body.marketingEmails;

    // Learning Preferences
    if (body.learningPace !== undefined) updateData.learningPace = body.learningPace;
    if (body.dailyGoalMinutes !== undefined) updateData.dailyGoalMinutes = body.dailyGoalMinutes;
    if (body.showProgressOnProfile !== undefined) updateData.showProgressOnProfile = body.showProgressOnProfile;

    // Appearance
    if (body.theme !== undefined) updateData.theme = body.theme;

    // Privacy & Security
    if (body.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = body.twoFactorEnabled;
    if (body.profileVisibility !== undefined) updateData.profileVisibility = body.profileVisibility;
    if (body.showActivityStatus !== undefined) updateData.showActivityStatus = body.showActivityStatus;
    if (body.allowDataCollection !== undefined) updateData.allowDataCollection = body.allowDataCollection;

    // Accessibility
    if (body.reducedMotion !== undefined) updateData.reducedMotion = body.reducedMotion;
    if (body.highContrast !== undefined) updateData.highContrast = body.highContrast;
    if (body.fontSize !== undefined) updateData.fontSize = body.fontSize;
    if (body.screenReaderOptimized !== undefined) updateData.screenReaderOptimized = body.screenReaderOptimized;

    // Wallet
    if (body.walletConnected !== undefined) updateData.walletConnected = body.walletConnected;

    // Check if settings doc exists
    const settingsRef = db.collection('userSettings').doc(userId);
    const settingsDoc = await settingsRef.get();

    if (settingsDoc.exists) {
      await settingsRef.update(updateData);
    } else {
      // Create with defaults merged with updates
      await settingsRef.set({
        userId,
        ...getDefaultSettings(decodedClaims.email),
        ...updateData,
        createdAt: Timestamp.now(),
      });
    }

    // Fetch updated settings
    const updatedDoc = await settingsRef.get();

    return NextResponse.json({
      message: 'Settings updated',
      settings: updatedDoc.data(),
    });
  } catch (error) {
    console.error('Settings update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
