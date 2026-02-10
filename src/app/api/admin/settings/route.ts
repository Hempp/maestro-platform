/**
 * ADMIN PLATFORM SETTINGS API (Firebase)
 * Manage platform-wide configuration settings
 * Requires admin privileges
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// Helper to check admin access
async function checkAdminAccess() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    return { authorized: false, error: 'Not authenticated', status: 401, user: null, profile: null };
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || (userData.role !== 'admin' && !userData.adminTier)) {
      return { authorized: false, error: 'Admin access required', status: 403, user: null, profile: null };
    }

    return {
      authorized: true,
      user: { id: userId, email: decodedClaims.email },
      profile: { role: userData.role, adminTier: userData.adminTier },
    };
  } catch {
    return { authorized: false, error: 'Invalid session', status: 401, user: null, profile: null };
  }
}

// GET: Fetch platform settings
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess();

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const db = getAdminDb();

    // Get optional type filter from query params
    const { searchParams } = new URL(request.url);
    const settingType = searchParams.get('type');

    let query = db.collection('platformSettings').orderBy('settingType').orderBy('settingKey');

    if (settingType) {
      query = query.where('settingType', '==', settingType);
    }

    const settingsSnapshot = await query.get();

    if (settingsSnapshot.empty) {
      // Return default settings if none exist
      return NextResponse.json({
        settings: {
          platform: {
            platformName: 'Phazur',
            supportEmail: 'support@phazur.io',
            maintenanceMode: false,
          },
          integration: {
            blockchainEnabled: false,
            analyticsEnabled: true,
            paymentGatewayConfigured: false,
          },
          branding: {
            primaryColor: '#06b6d4',
            secondaryColor: '#a855f7',
          },
        },
        raw: [],
      });
    }

    // Group settings by type
    const groupedSettings: Record<string, Record<string, unknown>> = {};
    const rawSettings: Array<Record<string, unknown>> = [];

    settingsSnapshot.docs.forEach(doc => {
      const setting = doc.data();
      rawSettings.push({ id: doc.id, ...setting });

      if (!groupedSettings[setting.settingType]) {
        groupedSettings[setting.settingType] = {};
      }

      // Parse JSON value
      let value = setting.settingValue;
      try {
        value = JSON.parse(setting.settingValue);
      } catch {
        // Keep as is if not valid JSON
      }

      // Mask secret values for non-super-admins
      if (setting.isSecret && authCheck.profile?.adminTier !== 'super_admin') {
        value = '••••••••';
      }

      groupedSettings[setting.settingType][setting.settingKey] = value;
    });

    return NextResponse.json({
      settings: groupedSettings,
      raw: rawSettings,
    });
  } catch (error) {
    console.error('Platform settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT: Update platform settings
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess();

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const db = getAdminDb();
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    const updates: Array<{ key: string; value: unknown; type: string }> = [];

    // Flatten the grouped settings into updates
    for (const [type, typeSettings] of Object.entries(settings)) {
      if (typeof typeSettings === 'object' && typeSettings !== null) {
        for (const [key, value] of Object.entries(typeSettings as Record<string, unknown>)) {
          updates.push({ key, value, type });
        }
      }
    }

    // Perform upserts
    const results = await Promise.all(
      updates.map(async ({ key, value, type }) => {
        try {
          // Check if setting exists
          const existingQuery = await db
            .collection('platformSettings')
            .where('settingKey', '==', key)
            .limit(1)
            .get();

          if (existingQuery.empty) {
            // Create new setting
            await db.collection('platformSettings').add({
              settingKey: key,
              settingValue: JSON.stringify(value),
              settingType: type,
              updatedBy: authCheck.user?.id,
              updatedAt: Timestamp.now(),
              createdAt: Timestamp.now(),
            });
          } else {
            // Update existing
            await existingQuery.docs[0].ref.update({
              settingValue: JSON.stringify(value),
              updatedBy: authCheck.user?.id,
              updatedAt: Timestamp.now(),
            });
          }

          return { key, success: true };
        } catch (error) {
          return { key, success: false, error };
        }
      })
    );

    const failures = results.filter(r => !r.success);

    if (failures.length > 0) {
      console.error('Some settings failed to update:', failures);
    }

    return NextResponse.json({
      message: 'Settings updated',
      updated: results.filter(r => r.success).length,
      failed: failures.length,
    });
  } catch (error) {
    console.error('Platform settings update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// POST: Create a new setting
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAccess();

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const db = getAdminDb();
    const body = await request.json();
    const { key, value, type, description, isSecret } = body;

    if (!key || value === undefined || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value, type' },
        { status: 400 }
      );
    }

    const settingRef = await db.collection('platformSettings').add({
      settingKey: key,
      settingValue: JSON.stringify(value),
      settingType: type,
      description: description || null,
      isSecret: isSecret || false,
      updatedBy: authCheck.user?.id,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const settingDoc = await settingRef.get();

    return NextResponse.json({
      message: 'Setting created',
      setting: { id: settingDoc.id, ...settingDoc.data() },
    });
  } catch (error) {
    console.error('Setting creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    );
  }
}
