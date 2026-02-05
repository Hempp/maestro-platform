'use client';

import { useEffect, useState } from 'react';
import { AdminTier, ADMIN_TIER_INFO, tierHasPermission } from '@/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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

// Toggle Component
function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        enabled ? 'bg-cyan-500' : 'bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

// Section Component
function Section({ title, children, locked }: { title: string; children: React.ReactNode; locked?: boolean }) {
  return (
    <div className={`bg-slate-800/30 border border-slate-800/60 rounded-lg overflow-hidden ${locked ? 'opacity-60' : ''}`}>
      <div className="px-5 py-4 border-b border-slate-800/40 flex items-center justify-between">
        <h2 className="text-sm font-medium text-white">{title}</h2>
        {locked && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Restricted</span>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// Row Component
function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{label}</p>
        {description && <p className="text-xs text-slate-600 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// Tier Badge Component
function TierBadge({ tier }: { tier: AdminTier }) {
  const info = ADMIN_TIER_INFO[tier];
  const colorClasses: Record<string, string> = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClasses[info.color] || colorClasses.cyan}`}>
      {info.label}
    </span>
  );
}

// Settings state type
interface SettingsState {
  // Platform
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  // Users
  autoApproveSignups: boolean;
  requireEmailVerification: boolean;
  sessionTimeoutMinutes: number;
  // Courses
  allowSelfEnrollment: boolean;
  autoGenerateCertificates: boolean;
  // Notifications
  notifyOnNewUser: boolean;
  notifyOnCourseCompletion: boolean;
  // Security
  require2FA: boolean;
  minPasswordLength: number;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [adminTier, setAdminTier] = useState<AdminTier | null>(null);

  const [settings, setSettings] = useState<SettingsState>({
    platformName: 'Phazur',
    supportEmail: 'support@phazur.io',
    maintenanceMode: false,
    autoApproveSignups: true,
    requireEmailVerification: true,
    sessionTimeoutMinutes: 60,
    allowSelfEnrollment: true,
    autoGenerateCertificates: true,
    notifyOnNewUser: true,
    notifyOnCourseCompletion: true,
    require2FA: false,
    minPasswordLength: 8,
  });

  // Load settings and check permissions
  useEffect(() => {
    async function init() {
      try {
        // Get user profile for tier
        const profileRes = await fetch('/api/user/profile', { credentials: 'include' });
        if (profileRes.ok) {
          const { user } = await profileRes.json();
          setAdminTier(user?.admin_tier || (user?.role === 'admin' ? 'super_admin' : null));
        }

        // Load settings
        const settingsRes = await fetch('/api/admin/settings', { credentials: 'include' });
        if (settingsRes.ok) {
          const { settings: s } = await settingsRes.json();
          if (s) {
            setSettings(prev => ({
              ...prev,
              platformName: s.platform?.platform_name || prev.platformName,
              supportEmail: s.platform?.support_email || prev.supportEmail,
              maintenanceMode: s.platform?.maintenance_mode ?? prev.maintenanceMode,
              autoApproveSignups: s.user_defaults?.auto_approve_signups ?? prev.autoApproveSignups,
              requireEmailVerification: s.user_defaults?.require_email_verification ?? prev.requireEmailVerification,
              sessionTimeoutMinutes: s.user_defaults?.session_timeout_minutes || prev.sessionTimeoutMinutes,
              allowSelfEnrollment: s.course?.allow_self_enrollment ?? prev.allowSelfEnrollment,
              autoGenerateCertificates: s.course?.auto_generate_certificates ?? prev.autoGenerateCertificates,
              notifyOnNewUser: s.email?.notify_on_new_user ?? prev.notifyOnNewUser,
              notifyOnCourseCompletion: s.email?.notify_on_course_completion ?? prev.notifyOnCourseCompletion,
              require2FA: s.security?.require_2fa ?? prev.require2FA,
              minPasswordLength: s.security?.min_password_length || prev.minPasswordLength,
            }));
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      setLoading(false);
    }
    init();
  }, []);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          settings: {
            platform: {
              platform_name: settings.platformName,
              support_email: settings.supportEmail,
              maintenance_mode: settings.maintenanceMode,
            },
            user_defaults: {
              auto_approve_signups: settings.autoApproveSignups,
              require_email_verification: settings.requireEmailVerification,
              session_timeout_minutes: settings.sessionTimeoutMinutes,
            },
            course: {
              allow_self_enrollment: settings.allowSelfEnrollment,
              auto_generate_certificates: settings.autoGenerateCertificates,
            },
            email: {
              notify_on_new_user: settings.notifyOnNewUser,
              notify_on_course_completion: settings.notifyOnCourseCompletion,
            },
            security: {
              require_2fa: settings.require2FA,
              min_password_length: settings.minPasswordLength,
            },
          },
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), STATUS_RESET_MS);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), STATUS_RESET_MS);
    }
  };

  // Permission checks
  const canManageAdmins = tierHasPermission(adminTier, 'manage_admins');
  const canManageUsers = tierHasPermission(adminTier, 'manage_users');
  const canManageCourses = tierHasPermission(adminTier, 'manage_courses');
  const canViewAnalytics = tierHasPermission(adminTier, 'view_analytics');
  const isSuperAdmin = adminTier === 'super_admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Access denied for non-admins
  if (!adminTier) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400">You need admin privileges to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115]">
      {/* Header */}
      <header className="border-b border-slate-800/40 bg-[#0f1115]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">Admin Settings</h1>
              <div className="flex items-center gap-2 mt-1">
                <TierBadge tier={adminTier} />
                <span className="text-xs text-slate-500">
                  {isSuperAdmin ? 'Full access' : 'Limited access based on your role'}
                </span>
              </div>
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
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Platform Settings - Super Admin only */}
        {isSuperAdmin && (
          <Section title="Platform">
            <Row label="Platform Name">
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => updateSetting('platformName', e.target.value)}
                className="w-40 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </Row>
            <Row label="Support Email">
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                className="w-48 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </Row>
            <Row label="Maintenance Mode" description="Disable access for non-admins">
              <Toggle enabled={settings.maintenanceMode} onChange={(v) => updateSetting('maintenanceMode', v)} />
            </Row>
          </Section>
        )}

        {/* User Settings - Super Admin or Support Admin */}
        {(canManageUsers || canManageAdmins) && (
          <Section title="User Management" locked={!canManageAdmins}>
            <Row label="Auto-approve Signups" description="New users are approved automatically">
              <Toggle
                enabled={settings.autoApproveSignups}
                onChange={(v) => updateSetting('autoApproveSignups', v)}
                disabled={!canManageAdmins}
              />
            </Row>
            <Row label="Require Email Verification" description="Users must verify email to access content">
              <Toggle
                enabled={settings.requireEmailVerification}
                onChange={(v) => updateSetting('requireEmailVerification', v)}
                disabled={!canManageAdmins}
              />
            </Row>
            <Row label="Session Timeout" description="Minutes until auto-logout">
              <input
                type="number"
                min={15}
                max={1440}
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => updateSetting('sessionTimeoutMinutes', parseInt(e.target.value) || 60)}
                disabled={!canManageAdmins}
                className="w-20 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
              />
            </Row>
          </Section>
        )}

        {/* Course Settings - Content Admin or Super Admin */}
        {canManageCourses && (
          <Section title="Courses">
            <Row label="Allow Self-enrollment" description="Users can enroll without approval">
              <Toggle enabled={settings.allowSelfEnrollment} onChange={(v) => updateSetting('allowSelfEnrollment', v)} />
            </Row>
            <Row label="Auto-generate Certificates" description="Issue certificates on course completion">
              <Toggle enabled={settings.autoGenerateCertificates} onChange={(v) => updateSetting('autoGenerateCertificates', v)} />
            </Row>
          </Section>
        )}

        {/* Notification Settings - Available to admins with analytics access */}
        {canViewAnalytics && (
          <Section title="Notifications">
            <Row label="New User Alerts" description="Email when users register">
              <Toggle enabled={settings.notifyOnNewUser} onChange={(v) => updateSetting('notifyOnNewUser', v)} />
            </Row>
            <Row label="Completion Alerts" description="Email when courses are completed">
              <Toggle enabled={settings.notifyOnCourseCompletion} onChange={(v) => updateSetting('notifyOnCourseCompletion', v)} />
            </Row>
          </Section>
        )}

        {/* Security Settings - Super Admin only */}
        {isSuperAdmin && (
          <Section title="Security">
            <Row label="Require 2FA" description="Enforce two-factor authentication for admins">
              <Toggle enabled={settings.require2FA} onChange={(v) => updateSetting('require2FA', v)} />
            </Row>
            <Row label="Min Password Length" description="Minimum characters required">
              <input
                type="number"
                min={6}
                max={32}
                value={settings.minPasswordLength}
                onChange={(e) => updateSetting('minPasswordLength', parseInt(e.target.value) || 8)}
                className="w-20 px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </Row>
          </Section>
        )}

        {/* Danger Zone - Super Admin only */}
        {isSuperAdmin && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-red-500/20">
              <h2 className="text-sm font-medium text-red-400">Danger Zone</h2>
            </div>
            <div className="p-5 space-y-4">
              <Row label="Export All Data" description="Download complete platform backup">
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition">
                  Export
                </button>
              </Row>
              <div className="pt-3 border-t border-red-500/20">
                <Row label="Reset Statistics" description="Clear all analytics data">
                  <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition">
                    Reset
                  </button>
                </Row>
              </div>
            </div>
          </div>
        )}

        {/* Access Info for non-super admins */}
        {!isSuperAdmin && (
          <div className="bg-slate-800/20 border border-slate-800/40 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-slate-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-slate-300">Limited Access</p>
                <p className="text-xs text-slate-500 mt-1">
                  As a <strong>{ADMIN_TIER_INFO[adminTier].label}</strong>, you can only modify settings related to your role.
                  Contact a Super Admin for full platform configuration.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
