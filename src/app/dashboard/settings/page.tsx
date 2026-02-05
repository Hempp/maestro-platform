'use client';

/**
 * USER SETTINGS PAGE
 * Comprehensive settings management with sections for:
 * - Profile Settings
 * - Notification Preferences
 * - Learning Preferences
 * - Account Settings
 * - Appearance
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

type LearningPath = 'student' | 'employee' | 'owner' | null;
type LearningPace = 'relaxed' | 'standard' | 'intensive';
type ThemePreference = 'dark' | 'light' | 'system';
type FontSize = 'small' | 'medium' | 'large';

interface WalletState {
  connected: boolean;
  address: string | null;
  network: string;
}

interface SubscriptionState {
  plan: 'free' | 'student' | 'employee' | 'owner' | null;
  status: 'active' | 'cancelled' | 'past_due' | 'none';
  renewalDate: string | null;
  paymentMethod: string | null;
}

interface SettingsState {
  // Profile
  displayName: string;
  bio: string;
  learningPath: LearningPath;

  // Notifications
  emailNotifications: boolean;
  learningReminders: boolean;
  communityActivity: boolean;
  marketingEmails: boolean;

  // Learning Preferences
  learningPace: LearningPace;
  dailyGoalMinutes: number;
  showProgressOnProfile: boolean;

  // Appearance
  theme: ThemePreference;

  // Privacy & Security
  twoFactorEnabled: boolean;
  profileVisibility: 'public' | 'private' | 'connections';
  showActivityStatus: boolean;
  allowDataCollection: boolean;

  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: FontSize;
  screenReaderOptimized: boolean;
}

const PATH_INFO = {
  student: {
    title: 'The Student',
    subtitle: 'Build a Job-Ready Portfolio',
    color: 'purple',
  },
  employee: {
    title: 'The Employee',
    subtitle: 'Efficiency Mastery',
    color: 'cyan',
  },
  owner: {
    title: 'The Owner',
    subtitle: 'Operations Scaling',
    color: 'emerald',
  },
};

// Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? 'bg-cyan-500' : 'bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// Section Card Component
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/30 border border-slate-800/60 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800/40">
        <h2 className="text-sm font-medium text-white">{title}</h2>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// Settings Row Component
function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{label}</p>
        {description && (
          <p className="text-xs text-slate-600 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPathModal, setShowPathModal] = useState(false);
  const [showDisconnectWalletConfirm, setShowDisconnectWalletConfirm] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showActiveSessions, setShowActiveSessions] = useState(false);

  // Wallet state
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    network: 'polygon',
  });

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionState>({
    plan: null,
    status: 'none',
    renewalDate: null,
    paymentMethod: null,
  });

  // Mock active sessions
  const [activeSessions] = useState([
    { id: '1', device: 'Chrome on MacOS', location: 'New York, US', lastActive: 'Now', current: true },
    { id: '2', device: 'Safari on iPhone', location: 'New York, US', lastActive: '2 hours ago', current: false },
  ]);

  // Settings state
  const [settings, setSettings] = useState<SettingsState>({
    displayName: '',
    bio: '',
    learningPath: null,
    emailNotifications: true,
    learningReminders: true,
    communityActivity: true,
    marketingEmails: false,
    learningPace: 'standard',
    dailyGoalMinutes: 30,
    showProgressOnProfile: true,
    theme: 'dark',
    // Privacy & Security
    twoFactorEnabled: false,
    profileVisibility: 'public',
    showActivityStatus: true,
    allowDataCollection: true,
    // Accessibility
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium',
    screenReaderOptimized: false,
  });

  // Load settings from API on mount (with localStorage fallback)
  useEffect(() => {
    async function loadSettings() {
      try {
        // Try API first
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            // Map snake_case from DB to camelCase
            const dbSettings = data.settings;
            setSettings(prev => ({
              ...prev,
              displayName: dbSettings.display_name || prev.displayName,
              bio: dbSettings.bio || prev.bio,
              emailNotifications: dbSettings.email_notifications ?? prev.emailNotifications,
              learningReminders: dbSettings.learning_reminders ?? prev.learningReminders,
              communityActivity: dbSettings.community_activity ?? prev.communityActivity,
              marketingEmails: dbSettings.marketing_emails ?? prev.marketingEmails,
              learningPace: dbSettings.learning_pace || prev.learningPace,
              dailyGoalMinutes: dbSettings.daily_goal_minutes || prev.dailyGoalMinutes,
              showProgressOnProfile: dbSettings.show_progress_on_profile ?? prev.showProgressOnProfile,
              theme: dbSettings.theme || prev.theme,
              twoFactorEnabled: dbSettings.two_factor_enabled ?? prev.twoFactorEnabled,
              profileVisibility: dbSettings.profile_visibility || prev.profileVisibility,
              showActivityStatus: dbSettings.show_activity_status ?? prev.showActivityStatus,
              allowDataCollection: dbSettings.allow_data_collection ?? prev.allowDataCollection,
              reducedMotion: dbSettings.reduced_motion ?? prev.reducedMotion,
              highContrast: dbSettings.high_contrast ?? prev.highContrast,
              fontSize: dbSettings.font_size || prev.fontSize,
              screenReaderOptimized: dbSettings.screen_reader_optimized ?? prev.screenReaderOptimized,
            }));
            // Also update wallet state
            if (dbSettings.wallet_connected !== undefined) {
              setWallet(prev => ({ ...prev, connected: dbSettings.wallet_connected }));
            }
            // Cache to localStorage
            localStorage.setItem('userSettings', JSON.stringify(data.settings));
            return;
          }
        }
      } catch (e) {
        console.error('Failed to fetch settings from API:', e);
      }

      // Fallback to localStorage
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse saved settings:', e);
        }
      }
    }

    if (user) {
      loadSettings();
    }
  }, [user]);

  // Update a single setting
  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  // Save all settings to API
  const handleSave = async () => {
    setSaveStatus('saving');

    try {
      // Save to API
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          walletConnected: wallet.connected,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Also cache to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));

      setSaveStatus('saved');

      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Try localStorage as fallback
      try {
        localStorage.setItem('userSettings', JSON.stringify(settings));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }
  };

  // Export data handler
  const handleExportData = () => {
    const exportData = {
      settings,
      email: user?.email,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phazur-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('Your data has been exported successfully.');
  };

  // Delete account handler
  const handleDeleteAccount = () => {
    // In production, this would call an API endpoint
    alert('Account deletion requested. In production, this would permanently delete your account and all associated data.');
    setShowDeleteConfirm(false);
  };

  // Connect wallet handler
  const handleConnectWallet = async () => {
    // In production, this would use Thirdweb SDK
    // Simulating wallet connection
    setWallet({
      connected: true,
      address: '0x1234...5678',
      network: 'polygon',
    });
  };

  // Disconnect wallet handler
  const handleDisconnectWallet = () => {
    setWallet({
      connected: false,
      address: null,
      network: 'polygon',
    });
    setShowDisconnectWalletConfirm(false);
  };

  // Enable 2FA handler
  const handleEnable2FA = () => {
    // In production, this would initiate 2FA setup flow
    updateSetting('twoFactorEnabled', true);
    setShow2FASetup(false);
  };

  // Revoke session handler
  const handleRevokeSession = (sessionId: string) => {
    // In production, this would call an API to revoke the session
    alert(`Session ${sessionId} revoked. In production, this would invalidate the session.`);
  };

  // Revoke all other sessions
  const handleRevokeAllSessions = () => {
    alert('All other sessions revoked. In production, this would invalidate all sessions except current.');
    setShowActiveSessions(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="border-b border-slate-800/40 bg-[#0f1115]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 -ml-2 text-slate-500 hover:text-slate-300 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-white">Settings</h1>
                <p className="text-xs text-slate-500">Manage your account preferences</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                saveStatus === 'saved'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : saveStatus === 'error'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {saveStatus === 'saving' ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : saveStatus === 'saved' ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              ) : saveStatus === 'error' ? (
                'Error - Try Again'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Settings */}
        <SettingsSection
          title="Profile Settings"
          description="Manage your public profile information"
        >
          {/* Avatar Upload Placeholder */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-800/40">
            <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 text-xl font-medium">
              {settings.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition">
                Upload Photo
              </button>
              <p className="text-[10px] text-slate-600 mt-1">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Display Name</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => updateSetting('displayName', e.target.value)}
              placeholder="Enter your display name"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 text-sm"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Email</label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={user?.email || 'Not signed in'}
                disabled
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-800/40 rounded-lg text-slate-500 text-sm cursor-not-allowed"
              />
              <span className="px-2 py-1 bg-slate-800/50 text-slate-600 rounded text-[10px]">
                From Auth
              </span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Bio</label>
            <textarea
              value={settings.bio}
              onChange={(e) => updateSetting('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={280}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 text-sm resize-none"
            />
            <p className="text-[10px] text-slate-600 mt-1 text-right">
              {settings.bio.length}/280 characters
            </p>
          </div>

          {/* Learning Path */}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Learning Path</label>
            <div className="flex items-center gap-3">
              {settings.learningPath ? (
                <div className={`flex-1 p-3 rounded-lg border ${
                  settings.learningPath === 'student'
                    ? 'bg-purple-500/5 border-purple-500/20'
                    : settings.learningPath === 'employee'
                    ? 'bg-cyan-500/5 border-cyan-500/20'
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}>
                  <p className={`text-sm font-medium ${
                    settings.learningPath === 'student'
                      ? 'text-purple-400'
                      : settings.learningPath === 'employee'
                      ? 'text-cyan-400'
                      : 'text-emerald-400'
                  }`}>
                    {PATH_INFO[settings.learningPath].title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {PATH_INFO[settings.learningPath].subtitle}
                  </p>
                </div>
              ) : (
                <div className="flex-1 p-3 rounded-lg border border-slate-800/40 bg-slate-800/20">
                  <p className="text-sm text-slate-500">No path selected</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Choose a path to begin your journey
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowPathModal(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
              >
                {settings.learningPath ? 'Change Path' : 'Select Path'}
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* Notification Preferences */}
        <SettingsSection
          title="Notification Preferences"
          description="Control how and when we contact you"
        >
          <SettingsRow
            label="Email Notifications"
            description="Course updates and new content announcements"
          >
            <ToggleSwitch
              enabled={settings.emailNotifications}
              onChange={(v) => updateSetting('emailNotifications', v)}
            />
          </SettingsRow>

          <SettingsRow
            label="Learning Reminders"
            description="Daily reminders to continue your learning"
          >
            <ToggleSwitch
              enabled={settings.learningReminders}
              onChange={(v) => updateSetting('learningReminders', v)}
            />
          </SettingsRow>

          <SettingsRow
            label="Community Activity"
            description="Notifications about comments and mentions"
          >
            <ToggleSwitch
              enabled={settings.communityActivity}
              onChange={(v) => updateSetting('communityActivity', v)}
            />
          </SettingsRow>

          <SettingsRow
            label="Marketing Emails"
            description="Product updates and promotional content"
          >
            <ToggleSwitch
              enabled={settings.marketingEmails}
              onChange={(v) => updateSetting('marketingEmails', v)}
            />
          </SettingsRow>
        </SettingsSection>

        {/* Learning Preferences */}
        <SettingsSection
          title="Learning Preferences"
          description="Customize your learning experience"
        >
          {/* Learning Pace */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Learning Pace</label>
            <div className="grid grid-cols-3 gap-2">
              {(['relaxed', 'standard', 'intensive'] as const).map((pace) => (
                <button
                  key={pace}
                  onClick={() => updateSetting('learningPace', pace)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition ${
                    settings.learningPace === pace
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-slate-800/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="block capitalize">{pace}</span>
                  <span className="text-[10px] text-slate-600 mt-0.5 block">
                    {pace === 'relaxed' ? '15 min/day' : pace === 'standard' ? '30 min/day' : '60+ min/day'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">
              Daily Learning Goal
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={settings.dailyGoalMinutes}
                onChange={(e) => updateSetting('dailyGoalMinutes', parseInt(e.target.value))}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-sm text-slate-300 w-20 text-right">
                {settings.dailyGoalMinutes} min
              </span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Set a daily learning goal that works for your schedule
            </p>
          </div>

          <SettingsRow
            label="Show Progress on Profile"
            description="Display your learning progress publicly"
          >
            <ToggleSwitch
              enabled={settings.showProgressOnProfile}
              onChange={(v) => updateSetting('showProgressOnProfile', v)}
            />
          </SettingsRow>
        </SettingsSection>

        {/* Account Settings */}
        <SettingsSection
          title="Account Settings"
          description="Manage your account and data"
        >
          {/* Connected Accounts */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Connected Accounts</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/40 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">GitHub</p>
                    <p className="text-[10px] text-slate-600">Not connected</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition">
                  Connect
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/40 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Google</p>
                    <p className="text-[10px] text-slate-600">Not connected</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition">
                  Connect
                </button>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="pt-2 border-t border-slate-800/40">
            <SettingsRow
              label="Export My Data"
              description="Download a copy of all your data"
            >
              <button
                onClick={handleExportData}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
              >
                Export
              </button>
            </SettingsRow>
          </div>

          {/* Delete Account */}
          <div className="pt-2 border-t border-slate-800/40">
            <SettingsRow
              label="Delete Account"
              description="Permanently delete your account and all data"
            >
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition"
              >
                Delete
              </button>
            </SettingsRow>
          </div>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection
          title="Appearance"
          description="Customize the look and feel"
        >
          <div>
            <label className="block text-sm text-slate-300 mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'light', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSetting('theme', theme)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-2 ${
                    settings.theme === theme
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-slate-800/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {theme === 'dark' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  {theme === 'light' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  {theme === 'system' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="capitalize">{theme}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              Note: Currently only dark mode is available. Light mode coming soon.
            </p>
          </div>
        </SettingsSection>

        {/* Wallet & Credentials */}
        <SettingsSection
          title="Wallet & Credentials"
          description="Connect your wallet for on-chain certificates (SBTs)"
        >
          {/* Wallet Connection */}
          <div className="p-4 bg-slate-800/30 border border-slate-800/40 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  wallet.connected ? 'bg-purple-500/20' : 'bg-slate-800'
                }`}>
                  <svg className={`w-5 h-5 ${wallet.connected ? 'text-purple-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300 font-medium">
                    {wallet.connected ? 'Wallet Connected' : 'No Wallet Connected'}
                  </p>
                  {wallet.connected ? (
                    <p className="text-xs text-slate-500">{wallet.address} • Polygon</p>
                  ) : (
                    <p className="text-xs text-slate-600">Connect to receive SBT credentials</p>
                  )}
                </div>
              </div>
              {wallet.connected ? (
                <button
                  onClick={() => setShowDisconnectWalletConfirm(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>

          {/* SBT Certificates */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Your Certificates (SBTs)</label>
            {wallet.connected ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-800/20 border border-slate-800/40 rounded-lg opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">No certificates yet</p>
                      <p className="text-[10px] text-slate-600">Complete a path to earn your first SBT</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 p-3 bg-slate-800/20 rounded-lg border border-slate-800/40">
                Connect your wallet to view and manage your on-chain certificates.
              </p>
            )}
          </div>
        </SettingsSection>

        {/* Billing & Subscription */}
        <SettingsSection
          title="Billing & Subscription"
          description="Manage your subscription and payment methods"
        >
          {/* Current Plan */}
          <div className="p-4 bg-slate-800/30 border border-slate-800/40 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-300 font-medium">
                    {subscription.plan ? PATH_INFO[subscription.plan as keyof typeof PATH_INFO]?.title || 'Free Plan' : 'Free Plan'}
                  </p>
                  {subscription.status === 'active' && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {subscription.plan ? 'Pay after you ship' : 'No active subscription'}
                </p>
              </div>
              <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium transition">
                {subscription.plan ? 'Manage Plan' : 'View Plans'}
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">Payment Method</label>
            {subscription.paymentMethod ? (
              <div className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/40 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">{subscription.paymentMethod}</p>
                    <p className="text-[10px] text-slate-600">Expires 12/25</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition">
                  Update
                </button>
              </div>
            ) : (
              <div className="p-3 bg-slate-800/20 border border-dashed border-slate-700 rounded-lg">
                <button className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-400 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium">Add Payment Method</span>
                </button>
              </div>
            )}
          </div>

          {/* Billing History */}
          <div className="pt-2 border-t border-slate-800/40">
            <SettingsRow
              label="Billing History"
              description="View past invoices and receipts"
            >
              <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition">
                View History
              </button>
            </SettingsRow>
          </div>
        </SettingsSection>

        {/* Privacy & Security */}
        <SettingsSection
          title="Privacy & Security"
          description="Manage your security settings and privacy preferences"
        >
          {/* Two-Factor Authentication */}
          <div className="p-4 bg-slate-800/30 border border-slate-800/40 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  settings.twoFactorEnabled ? 'bg-emerald-500/20' : 'bg-slate-800'
                }`}>
                  <svg className={`w-5 h-5 ${settings.twoFactorEnabled ? 'text-emerald-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-300 font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">
                    {settings.twoFactorEnabled ? 'Enabled - Your account is protected' : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>
              {settings.twoFactorEnabled ? (
                <button
                  onClick={() => updateSetting('twoFactorEnabled', false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={() => setShow2FASetup(true)}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="pt-2 border-t border-slate-800/40">
            <SettingsRow
              label="Active Sessions"
              description={`${activeSessions.length} devices currently signed in`}
            >
              <button
                onClick={() => setShowActiveSessions(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
              >
                Manage
              </button>
            </SettingsRow>
          </div>

          {/* Profile Visibility */}
          <div className="pt-2 border-t border-slate-800/40">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Profile Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {(['public', 'connections', 'private'] as const).map((visibility) => (
                  <button
                    key={visibility}
                    onClick={() => updateSetting('profileVisibility', visibility)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition ${
                      settings.profileVisibility === visibility
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                        : 'bg-slate-800/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="capitalize">{visibility}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Toggles */}
          <SettingsRow
            label="Show Activity Status"
            description="Let others see when you're online"
          >
            <ToggleSwitch
              enabled={settings.showActivityStatus}
              onChange={(v) => updateSetting('showActivityStatus', v)}
            />
          </SettingsRow>

          <SettingsRow
            label="Allow Data Collection"
            description="Help improve Phazur with anonymous usage data"
          >
            <ToggleSwitch
              enabled={settings.allowDataCollection}
              onChange={(v) => updateSetting('allowDataCollection', v)}
            />
          </SettingsRow>
        </SettingsSection>

        {/* Accessibility */}
        <SettingsSection
          title="Accessibility"
          description="Customize your experience for better accessibility"
        >
          <SettingsRow
            label="Reduced Motion"
            description="Minimize animations and transitions"
          >
            <ToggleSwitch
              enabled={settings.reducedMotion}
              onChange={(v) => updateSetting('reducedMotion', v)}
            />
          </SettingsRow>

          <SettingsRow
            label="High Contrast"
            description="Increase contrast for better readability"
          >
            <ToggleSwitch
              enabled={settings.highContrast}
              onChange={(v) => updateSetting('highContrast', v)}
            />
          </SettingsRow>

          {/* Font Size */}
          <div className="pt-2 border-t border-slate-800/40">
            <label className="block text-sm text-slate-300 mb-2">Font Size</label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateSetting('fontSize', size)}
                  className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition ${
                    settings.fontSize === size
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-slate-800/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className={`block ${size === 'small' ? 'text-[10px]' : size === 'large' ? 'text-sm' : 'text-xs'}`}>
                    Aa
                  </span>
                  <span className="block capitalize mt-0.5">{size}</span>
                </button>
              ))}
            </div>
          </div>

          <SettingsRow
            label="Screen Reader Optimized"
            description="Enhance compatibility with screen readers"
          >
            <ToggleSwitch
              enabled={settings.screenReaderOptimized}
              onChange={(v) => updateSetting('screenReaderOptimized', v)}
            />
          </SettingsRow>
        </SettingsSection>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete your account? All of your data, including progress, certificates, and projects will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Path Selection Modal */}
      {showPathModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Choose Your Path</h3>
              <button
                onClick={() => setShowPathModal(false)}
                className="p-1 text-slate-500 hover:text-slate-300 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {(['student', 'employee', 'owner'] as const).map((path) => (
                <button
                  key={path}
                  onClick={() => {
                    updateSetting('learningPath', path);
                    setShowPathModal(false);
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition ${
                    settings.learningPath === path
                      ? path === 'student'
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : path === 'employee'
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/30 border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      path === 'student'
                        ? 'bg-purple-500/20'
                        : path === 'employee'
                        ? 'bg-cyan-500/20'
                        : 'bg-emerald-500/20'
                    }`}>
                      {path === 'student' && (
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                      )}
                      {path === 'employee' && (
                        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {path === 'owner' && (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        path === 'student'
                          ? 'text-purple-400'
                          : path === 'employee'
                          ? 'text-cyan-400'
                          : 'text-emerald-400'
                      }`}>
                        {PATH_INFO[path].title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {PATH_INFO[path].subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Wallet Confirmation Modal */}
      {showDisconnectWalletConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Disconnect Wallet</h3>
                <p className="text-xs text-slate-500">This won't affect your SBTs</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to disconnect your wallet? Your on-chain certificates (SBTs) will remain on the blockchain and can be reconnected anytime.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectWalletConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnectWallet}
                className="flex-1 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Enable 2FA</h3>
                  <p className="text-xs text-slate-500">Secure your account</p>
                </div>
              </div>
              <button
                onClick={() => setShow2FASetup(false)}
                className="p-1 text-slate-500 hover:text-slate-300 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>

              {/* Mock QR Code */}
              <div className="flex justify-center">
                <div className="w-40 h-40 bg-white rounded-lg p-2 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-900 rounded grid grid-cols-5 gap-0.5 p-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${Math.random() > 0.5 ? 'bg-white' : 'bg-slate-900'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Or enter this code manually:</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-800/60 rounded-lg text-cyan-400 text-sm font-mono">
                    ABCD-EFGH-IJKL-MNOP
                  </code>
                  <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Enter verification code:</label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 text-sm text-center tracking-widest"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShow2FASetup(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEnable2FA}
                className="flex-1 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium transition"
              >
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions Modal */}
      {showActiveSessions && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
                  <p className="text-xs text-slate-500">{activeSessions.length} devices signed in</p>
                </div>
              </div>
              <button
                onClick={() => setShowActiveSessions(false)}
                className="p-1 text-slate-500 hover:text-slate-300 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border ${
                    session.current
                      ? 'bg-cyan-500/5 border-cyan-500/20'
                      : 'bg-slate-800/30 border-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        session.current ? 'bg-cyan-500/20' : 'bg-slate-800'
                      }`}>
                        <svg className={`w-4 h-4 ${session.current ? 'text-cyan-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {session.device.includes('iPhone') ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-300">{session.device}</p>
                          {session.current && (
                            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[9px] rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {session.location} • {session.lastActive}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-2 py-1 text-red-400 hover:bg-red-500/10 rounded text-xs font-medium transition"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowActiveSessions(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
              >
                Done
              </button>
              <button
                onClick={handleRevokeAllSessions}
                className="flex-1 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition"
              >
                Sign Out All Other
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
