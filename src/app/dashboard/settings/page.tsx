'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

type ThemePreference = 'dark' | 'light' | 'system';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SettingsState {
  displayName: string;
  bio: string;
  emailNotifications: boolean;
  learningReminders: boolean;
  theme: ThemePreference;
}

// Constants
const STATUS_RESET_MS = 2000;

const SAVE_STYLES: Record<SaveStatus, string> = {
  idle: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  saving: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
  saved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  error: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const SAVE_TEXT: Record<SaveStatus, string> = {
  idle: 'Save', saving: 'Saving...', saved: 'Saved', error: 'Error',
};

// Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? 'bg-cyan-500' : 'bg-slate-700'
      }`}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// Section Component
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/30 border border-slate-800/60 rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800/40">
        <h2 className="text-sm font-medium text-white">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// Row Component
function Row({
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

// Theme icons
const ThemeIcon = ({ theme }: { theme: ThemePreference }) => {
  const paths: Record<ThemePreference, string> = {
    dark: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
    light: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    system: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  };
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={paths[theme]} />
    </svg>
  );
};

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [settings, setSettings] = useState<SettingsState>({
    displayName: '',
    bio: '',
    emailNotifications: true,
    learningReminders: true,
    theme: 'dark',
  });

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            const s = data.settings;
            setSettings({
              displayName: s.display_name || '',
              bio: s.bio || '',
              emailNotifications: s.email_notifications ?? true,
              learningReminders: s.learning_reminders ?? true,
              theme: s.theme || 'dark',
            });
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    if (user) loadSettings();
  }, [user]);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), STATUS_RESET_MS);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), STATUS_RESET_MS);
    }
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify({ settings, email: user?.email }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phazur-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 -ml-2 text-slate-500 hover:text-slate-300 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-lg font-semibold text-white">Settings</h1>
            </div>

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${SAVE_STYLES[saveStatus]}`}
            >
              {SAVE_TEXT[saveStatus]}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Profile */}
        <Section title="Profile">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-800/40">
            <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 text-lg font-medium">
              {settings.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition">
                Change Avatar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Display Name</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => updateSetting('displayName', e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-800/40 rounded-lg text-slate-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Bio</label>
            <textarea
              value={settings.bio}
              onChange={(e) => updateSetting('bio', e.target.value)}
              placeholder="A short bio..."
              rows={2}
              maxLength={160}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-800/60 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 text-sm resize-none"
            />
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Row label="Email Notifications" description="Updates and announcements">
            <ToggleSwitch
              enabled={settings.emailNotifications}
              onChange={(v) => updateSetting('emailNotifications', v)}
            />
          </Row>

          <Row label="Learning Reminders" description="Daily learning reminders">
            <ToggleSwitch
              enabled={settings.learningReminders}
              onChange={(v) => updateSetting('learningReminders', v)}
            />
          </Row>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'light', 'system'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSetting('theme', theme)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-2 ${
                    settings.theme === theme
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-slate-800/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <ThemeIcon theme={theme} />
                  <span className="capitalize">{theme}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Account */}
        <Section title="Account">
          <Row label="Export Data" description="Download your data">
            <button
              onClick={handleExportData}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Export
            </button>
          </Row>

          <div className="pt-3 border-t border-slate-800/40">
            <Row label="Delete Account" description="Permanently delete your account">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition"
              >
                Delete
              </button>
            </Row>
          </div>
        </Section>
      </main>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-slate-400 mb-6">
              This will permanently delete your account and all data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Account deletion requested');
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
