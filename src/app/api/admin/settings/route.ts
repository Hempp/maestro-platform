/**
 * ADMIN PLATFORM SETTINGS API
 * Manage platform-wide configuration settings
 * Requires admin privileges
 */

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper to check admin access
async function checkAdminAccess(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: 'Not authenticated', status: 401, user: null, profile: null };
  }

  // Check if user is admin - use admin client to access all columns
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Cast profile to access role and admin_tier which may exist in DB but not in types
  const profileData = profile as Record<string, unknown> | null;
  const role = profileData?.role as string | null;
  const adminTier = profileData?.admin_tier as string | null;

  if (!profileData || (role !== 'admin' && !adminTier)) {
    return { authorized: false, error: 'Admin access required', status: 403, user: null, profile: null };
  }

  return { authorized: true, user, profile: { role, admin_tier: adminTier } };
}

// GET: Fetch platform settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const authCheck = await checkAdminAccess(supabase);

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    // Get optional type filter from query params
    const { searchParams } = new URL(request.url);
    const settingType = searchParams.get('type');

    // Use admin client to bypass RLS for secret values
    const adminSupabase = createAdminClient();

    let query = adminSupabase
      .from('platform_settings')
      .select('*');

    if (settingType) {
      query = query.eq('setting_type', settingType);
    }

    const { data: settings, error } = await query.order('setting_type').order('setting_key');

    if (error) {
      // Handle missing table gracefully - return empty defaults
      if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
        console.warn('platform_settings table not found, returning defaults');
        return NextResponse.json({
          settings: {
            platform: {
              platform_name: 'Phazur',
              support_email: 'support@phazur.io',
              maintenance_mode: false,
            },
            integration: {
              blockchain_enabled: false,
              analytics_enabled: true,
              payment_gateway_configured: false,
            },
            branding: {
              primary_color: '#06b6d4',
              secondary_color: '#a855f7',
            },
          },
          raw: [],
        });
      }
      console.error('Platform settings fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Group settings by type
    const groupedSettings: Record<string, Record<string, unknown>> = {};

    for (const setting of settings || []) {
      if (!groupedSettings[setting.setting_type]) {
        groupedSettings[setting.setting_type] = {};
      }

      // Parse JSON value
      let value = setting.setting_value;
      try {
        value = JSON.parse(setting.setting_value as string);
      } catch {
        // Keep as is if not valid JSON
      }

      // Mask secret values for non-super-admins
      if (setting.is_secret && authCheck.profile?.admin_tier !== 'super_admin') {
        value = '••••••••';
      }

      groupedSettings[setting.setting_type][setting.setting_key] = value;
    }

    return NextResponse.json({
      settings: groupedSettings,
      raw: settings,
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
    const supabase = await createServerSupabaseClient();
    const authCheck = await checkAdminAccess(supabase);

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();

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
        const { error } = await adminSupabase
          .from('platform_settings')
          .upsert(
            {
              setting_key: key,
              setting_value: JSON.stringify(value),
              setting_type: type,
              updated_by: authCheck.user?.id,
            } as never,
            { onConflict: 'setting_key' }
          );

        return { key, success: !error, error };
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
    const supabase = await createServerSupabaseClient();
    const authCheck = await checkAdminAccess(supabase);

    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await request.json();
    const { key, value, type, description, isSecret } = body;

    if (!key || value === undefined || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value, type' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('platform_settings')
      .insert({
        setting_key: key,
        setting_value: JSON.stringify(value),
        setting_type: type,
        description: description || null,
        is_secret: isSecret || false,
        updated_by: authCheck.user?.id,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Setting creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Setting created',
      setting: data,
    });
  } catch (error) {
    console.error('Setting creation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create setting' },
      { status: 500 }
    );
  }
}
