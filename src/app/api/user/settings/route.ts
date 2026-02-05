/**
 * USER SETTINGS API
 * Manage user preferences, notifications, privacy, and accessibility settings
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch user settings
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" which is OK - we'll create defaults
      // PGRST205 is "table not found" - return defaults
      if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
        console.warn('user_settings table not found, returning defaults');
        return NextResponse.json({
          settings: {
            display_name: user.email?.split('@')[0] || '',
            bio: '',
            email_notifications: true,
            learning_reminders: true,
            community_activity: true,
            marketing_emails: false,
            learning_pace: 'standard',
            daily_goal_minutes: 30,
            show_progress_on_profile: true,
            theme: 'dark',
            two_factor_enabled: false,
            profile_visibility: 'public',
            show_activity_status: true,
            allow_data_collection: true,
            reduced_motion: false,
            high_contrast: false,
            font_size: 'medium',
            screen_reader_optimized: false,
            wallet_connected: false,
          }
        });
      }
      console.error('Settings fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        user_id: user.id,
        display_name: user.email?.split('@')[0] || '',
        bio: '',
        email_notifications: true,
        learning_reminders: true,
        community_activity: true,
        marketing_emails: false,
        learning_pace: 'standard',
        daily_goal_minutes: 30,
        show_progress_on_profile: true,
        theme: 'dark',
        two_factor_enabled: false,
        profile_visibility: 'public',
        show_activity_status: true,
        allow_data_collection: true,
        reduced_motion: false,
        high_contrast: false,
        font_size: 'medium',
        screen_reader_optimized: false,
        wallet_connected: false,
      };

      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert(defaultSettings as never)
        .select()
        .single();

      if (insertError) {
        console.error('Settings creation error:', insertError);
        // Return defaults even if insert fails
        return NextResponse.json({ settings: defaultSettings });
      }

      return NextResponse.json({ settings: newSettings });
    }

    return NextResponse.json({ settings });
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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Map camelCase to snake_case for database
    const updateData: Record<string, unknown> = {};

    // Profile
    if (body.displayName !== undefined) updateData.display_name = body.displayName;
    if (body.bio !== undefined) updateData.bio = body.bio;

    // Notifications
    if (body.emailNotifications !== undefined) updateData.email_notifications = body.emailNotifications;
    if (body.learningReminders !== undefined) updateData.learning_reminders = body.learningReminders;
    if (body.communityActivity !== undefined) updateData.community_activity = body.communityActivity;
    if (body.marketingEmails !== undefined) updateData.marketing_emails = body.marketingEmails;

    // Learning Preferences
    if (body.learningPace !== undefined) updateData.learning_pace = body.learningPace;
    if (body.dailyGoalMinutes !== undefined) updateData.daily_goal_minutes = body.dailyGoalMinutes;
    if (body.showProgressOnProfile !== undefined) updateData.show_progress_on_profile = body.showProgressOnProfile;

    // Appearance
    if (body.theme !== undefined) updateData.theme = body.theme;

    // Privacy & Security
    if (body.twoFactorEnabled !== undefined) updateData.two_factor_enabled = body.twoFactorEnabled;
    if (body.profileVisibility !== undefined) updateData.profile_visibility = body.profileVisibility;
    if (body.showActivityStatus !== undefined) updateData.show_activity_status = body.showActivityStatus;
    if (body.allowDataCollection !== undefined) updateData.allow_data_collection = body.allowDataCollection;

    // Accessibility
    if (body.reducedMotion !== undefined) updateData.reduced_motion = body.reducedMotion;
    if (body.highContrast !== undefined) updateData.high_contrast = body.highContrast;
    if (body.fontSize !== undefined) updateData.font_size = body.fontSize;
    if (body.screenReaderOptimized !== undefined) updateData.screen_reader_optimized = body.screenReaderOptimized;

    // Wallet
    if (body.walletConnected !== undefined) updateData.wallet_connected = body.walletConnected;

    // Upsert settings (create if not exists, update if exists)
    const { data: updatedSettings, error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, ...updateData } as never,
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      // Handle missing table gracefully
      if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
        console.warn('user_settings table not found, saving to client only');
        return NextResponse.json({
          message: 'Settings saved locally (database table pending)',
          settings: { user_id: user.id, ...updateData },
        });
      }
      console.error('Settings update error:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Settings updated',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Settings update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
