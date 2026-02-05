'use client';

/**
 * ADMIN SETTINGS PAGE
 * Comprehensive platform configuration with role-based access
 */

import { useEffect, useState } from 'react';
import {
  AdminTier,
  ADMIN_TIER_INFO,
  AdminPermission,
  tierHasPermission,
} from '@/types';

// Toggle Switch Component
function Toggle({
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
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        enabled ? 'bg-cyan-600' : 'bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// Settings Card Component
function SettingsCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="text-white font-semibold">{title}</h3>
            {description && (
              <p className="text-slate-400 text-sm">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// Setting Row Component
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1">
        <div className="text-slate-200 font-medium">{label}</div>
        {description && (
          <div className="text-slate-500 text-sm">{description}</div>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({
  status,
  label,
}: {
  status: 'configured' | 'not_configured' | 'active' | 'inactive';
  label: string;
}) {
  const statusStyles = {
    configured: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    not_configured: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
    inactive: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm border ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}

// Access Denied Component
function AccessDenied() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 max-w-md">
          You do not have permission to access platform settings. This page
          requires super admin privileges.
        </p>
      </div>
    </div>
  );
}

// Types for settings
interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultTimezone: string;
  maintenanceMode: boolean;
}

interface UserSettings {
  defaultRole: 'learner' | 'teacher';
  autoApproveSignups: boolean;
  requireEmailVerification: boolean;
  sessionTimeoutMinutes: number;
}

interface CourseSettings {
  allowSelfEnrollment: boolean;
  requirePrerequisites: boolean;
  defaultVisibility: 'public' | 'private';
  autoGenerateCertificates: boolean;
}

interface EmailSettings {
  smtpConfigured: boolean;
  notifyOnNewUser: boolean;
  notifyOnCourseCompletion: boolean;
  notifyOnSupport: boolean;
}

interface SecuritySettings {
  require2FA: boolean;
  minPasswordLength: number;
  requireSpecialChars: boolean;
  apiRateLimit: number;
  allowedDomains: string;
}

interface IntegrationSettings {
  blockchainEnabled: boolean;
  analyticsEnabled: boolean;
  paymentGatewayConfigured: boolean;
}

// Main Settings Page
export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminTier, setAdminTier] = useState<AdminTier | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Settings state
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    platformName: 'Phazur',
    supportEmail: 'support@phazur.io',
    defaultTimezone: 'America/New_York',
    maintenanceMode: false,
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    defaultRole: 'learner',
    autoApproveSignups: true,
    requireEmailVerification: true,
    sessionTimeoutMinutes: 60,
  });

  const [courseSettings, setCourseSettings] = useState<CourseSettings>({
    allowSelfEnrollment: true,
    requirePrerequisites: false,
    defaultVisibility: 'public',
    autoGenerateCertificates: true,
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpConfigured: false,
    notifyOnNewUser: true,
    notifyOnCourseCompletion: true,
    notifyOnSupport: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    require2FA: false,
    minPasswordLength: 8,
    requireSpecialChars: true,
    apiRateLimit: 100,
    allowedDomains: '',
  });

  const [integrationSettings, setIntegrationSettings] =
    useState<IntegrationSettings>({
      blockchainEnabled: false,
      analyticsEnabled: true,
      paymentGatewayConfigured: false,
    });

  // Check permissions and load settings on mount
  useEffect(() => {
    async function initializePage() {
      try {
        // Check permissions first
        const profileResponse = await fetch('/api/user/profile');
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          const userTier = data.user?.admin_tier as AdminTier | null;
          const userRole = data.user?.role as string | null;

          setAdminTier(userTier);

          // Super admins always have access
          // Also grant access if user is admin role (pre-migration support)
          if (userTier === 'super_admin' || userRole === 'admin') {
            setHasPermission(true);
            // Load platform settings
            await loadSettings();
          } else {
            // Check for manage_admins permission as fallback
            const hasAccess = tierHasPermission(userTier, 'manage_admins');
            setHasPermission(hasAccess);
            if (hasAccess) {
              await loadSettings();
            }
          }
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Failed to check permissions:', error);
        setHasPermission(false);
      }
      setLoading(false);
    }
    initializePage();
  }, []);

  // Load settings from API
  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const settings = data.settings || {};

        // Platform settings
        if (settings.platform) {
          setPlatformSettings(prev => ({
            ...prev,
            platformName: settings.platform.platform_name || prev.platformName,
            supportEmail: settings.platform.support_email || prev.supportEmail,
            defaultTimezone: settings.platform.default_timezone || prev.defaultTimezone,
            maintenanceMode: settings.platform.maintenance_mode ?? prev.maintenanceMode,
          }));
        }

        // User defaults
        if (settings.user_defaults) {
          setUserSettings(prev => ({
            ...prev,
            defaultRole: settings.user_defaults.default_role || prev.defaultRole,
            autoApproveSignups: settings.user_defaults.auto_approve_signups ?? prev.autoApproveSignups,
            requireEmailVerification: settings.user_defaults.require_email_verification ?? prev.requireEmailVerification,
            sessionTimeoutMinutes: settings.user_defaults.session_timeout_minutes || prev.sessionTimeoutMinutes,
          }));
        }

        // Course settings
        if (settings.course) {
          setCourseSettings(prev => ({
            ...prev,
            allowSelfEnrollment: settings.course.allow_self_enrollment ?? prev.allowSelfEnrollment,
            requirePrerequisites: settings.course.require_prerequisites ?? prev.requirePrerequisites,
            defaultVisibility: settings.course.default_visibility || prev.defaultVisibility,
            autoGenerateCertificates: settings.course.auto_generate_certificates ?? prev.autoGenerateCertificates,
          }));
        }

        // Email settings
        if (settings.email) {
          setEmailSettings(prev => ({
            ...prev,
            notifyOnNewUser: settings.email.notify_on_new_user ?? prev.notifyOnNewUser,
            notifyOnCourseCompletion: settings.email.notify_on_course_completion ?? prev.notifyOnCourseCompletion,
            notifyOnSupport: settings.email.notify_on_support ?? prev.notifyOnSupport,
          }));
        }

        // Security settings
        if (settings.security) {
          setSecuritySettings(prev => ({
            ...prev,
            require2FA: settings.security.require_2fa ?? prev.require2FA,
            minPasswordLength: settings.security.min_password_length || prev.minPasswordLength,
            requireSpecialChars: settings.security.require_special_chars ?? prev.requireSpecialChars,
            apiRateLimit: settings.security.api_rate_limit || prev.apiRateLimit,
          }));
        }

        // Integration settings
        if (settings.integration) {
          setIntegrationSettings(prev => ({
            ...prev,
            blockchainEnabled: settings.integration.blockchain_enabled ?? prev.blockchainEnabled,
            analyticsEnabled: settings.integration.analytics_enabled ?? prev.analyticsEnabled,
            paymentGatewayConfigured: settings.integration.payment_gateway_configured ?? prev.paymentGatewayConfigured,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load platform settings:', error);
    }
  }

  // Save settings to API
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            platform: {
              platform_name: platformSettings.platformName,
              support_email: platformSettings.supportEmail,
              default_timezone: platformSettings.defaultTimezone,
              maintenance_mode: platformSettings.maintenanceMode,
            },
            user_defaults: {
              default_role: userSettings.defaultRole,
              auto_approve_signups: userSettings.autoApproveSignups,
              require_email_verification: userSettings.requireEmailVerification,
              session_timeout_minutes: userSettings.sessionTimeoutMinutes,
            },
            course: {
              allow_self_enrollment: courseSettings.allowSelfEnrollment,
              require_prerequisites: courseSettings.requirePrerequisites,
              default_visibility: courseSettings.defaultVisibility,
              auto_generate_certificates: courseSettings.autoGenerateCertificates,
            },
            email: {
              notify_on_new_user: emailSettings.notifyOnNewUser,
              notify_on_course_completion: emailSettings.notifyOnCourseCompletion,
              notify_on_support: emailSettings.notifyOnSupport,
            },
            security: {
              require_2fa: securitySettings.require2FA,
              min_password_length: securitySettings.minPasswordLength,
              require_special_chars: securitySettings.requireSpecialChars,
              api_rate_limit: securitySettings.apiRateLimit,
            },
            integration: {
              blockchain_enabled: integrationSettings.blockchainEnabled,
              analytics_enabled: integrationSettings.analyticsEnabled,
              payment_gateway_configured: integrationSettings.paymentGatewayConfigured,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Show success briefly
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
    setSaving(false);
  };

  // Check if user can access certain sections based on tier
  const canAccessSection = (requiredPermissions: AdminPermission[]): boolean => {
    if (!adminTier) return true; // Pre-migration admins have full access
    return requiredPermissions.some((perm) =>
      tierHasPermission(adminTier, perm)
    );
  };

  // Show loading while checking permissions
  if (loading || hasPermission === null) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Loading settings...</div>
      </div>
    );
  }

  // Show access denied if no permission
  if (!hasPermission) {
    return <AccessDenied />;
  }

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Australia/Sydney',
    'UTC',
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Platform Settings
          </h1>
          <p className="text-slate-400">
            Configure your platform settings and preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Admin Tier Badge */}
      {adminTier && ADMIN_TIER_INFO[adminTier] && (
        <div className="mb-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="text-slate-400 text-sm">Logged in as:</div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                ADMIN_TIER_INFO[adminTier].color === 'red'
                  ? 'bg-red-500/20 text-red-400'
                  : ADMIN_TIER_INFO[adminTier].color === 'purple'
                  ? 'bg-purple-500/20 text-purple-400'
                  : ADMIN_TIER_INFO[adminTier].color === 'blue'
                  ? 'bg-blue-500/20 text-blue-400'
                  : ADMIN_TIER_INFO[adminTier].color === 'green'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-cyan-500/20 text-cyan-400'
              }`}
            >
              {ADMIN_TIER_INFO[adminTier].label}
            </span>
            <span className="text-slate-500 text-sm">
              - Some settings may be restricted based on your role.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Platform Settings */}
        <SettingsCard
          title="Platform Settings"
          description="Basic platform configuration"
          icon={
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        >
          <SettingRow label="Platform Name">
            <input
              type="text"
              value={platformSettings.platformName}
              onChange={(e) =>
                setPlatformSettings({
                  ...platformSettings,
                  platformName: e.target.value,
                })
              }
              className="w-48 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </SettingRow>

          <SettingRow label="Support Email">
            <input
              type="email"
              value={platformSettings.supportEmail}
              onChange={(e) =>
                setPlatformSettings({
                  ...platformSettings,
                  supportEmail: e.target.value,
                })
              }
              className="w-48 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </SettingRow>

          <SettingRow label="Default Timezone">
            <select
              value={platformSettings.defaultTimezone}
              onChange={(e) =>
                setPlatformSettings({
                  ...platformSettings,
                  defaultTimezone: e.target.value,
                })
              }
              className="w-48 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </SettingRow>

          <SettingRow
            label="Maintenance Mode"
            description="Temporarily disable access for non-admins"
          >
            <Toggle
              enabled={platformSettings.maintenanceMode}
              onChange={(value) =>
                setPlatformSettings({
                  ...platformSettings,
                  maintenanceMode: value,
                })
              }
            />
          </SettingRow>
        </SettingsCard>

        {/* User Management Settings */}
        {canAccessSection(['manage_users', 'view_users']) && (
          <SettingsCard
            title="User Management"
            description="Configure user registration and sessions"
            icon={
              <svg
                className="w-5 h-5 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          >
            <SettingRow label="Default Role for New Users">
              <select
                value={userSettings.defaultRole}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    defaultRole: e.target.value as 'learner' | 'teacher',
                  })
                }
                className="w-48 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
              >
                <option value="learner">Learner</option>
                <option value="teacher">Teacher</option>
              </select>
            </SettingRow>

            <SettingRow
              label="Auto-approve New Signups"
              description="Automatically approve new user registrations"
            >
              <Toggle
                enabled={userSettings.autoApproveSignups}
                onChange={(value) =>
                  setUserSettings({ ...userSettings, autoApproveSignups: value })
                }
              />
            </SettingRow>

            <SettingRow
              label="Require Email Verification"
              description="Users must verify email before accessing content"
            >
              <Toggle
                enabled={userSettings.requireEmailVerification}
                onChange={(value) =>
                  setUserSettings({
                    ...userSettings,
                    requireEmailVerification: value,
                  })
                }
              />
            </SettingRow>

            <SettingRow
              label="Session Timeout"
              description="Minutes of inactivity before logout"
            >
              <input
                type="number"
                min={15}
                max={1440}
                value={userSettings.sessionTimeoutMinutes}
                onChange={(e) =>
                  setUserSettings({
                    ...userSettings,
                    sessionTimeoutMinutes: parseInt(e.target.value) || 60,
                  })
                }
                className="w-24 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </SettingRow>
          </SettingsCard>
        )}

        {/* Course Settings */}
        {canAccessSection(['manage_courses', 'manage_curriculum']) && (
          <SettingsCard
            title="Course Settings"
            description="Configure course behavior and enrollment"
            icon={
              <svg
                className="w-5 h-5 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            }
          >
            <SettingRow
              label="Allow Self-enrollment"
              description="Students can enroll in courses without approval"
            >
              <Toggle
                enabled={courseSettings.allowSelfEnrollment}
                onChange={(value) =>
                  setCourseSettings({
                    ...courseSettings,
                    allowSelfEnrollment: value,
                  })
                }
              />
            </SettingRow>

            <SettingRow
              label="Require Prerequisites"
              description="Enforce prerequisite completion before enrollment"
            >
              <Toggle
                enabled={courseSettings.requirePrerequisites}
                onChange={(value) =>
                  setCourseSettings({
                    ...courseSettings,
                    requirePrerequisites: value,
                  })
                }
              />
            </SettingRow>

            <SettingRow label="Default Course Visibility">
              <select
                value={courseSettings.defaultVisibility}
                onChange={(e) =>
                  setCourseSettings({
                    ...courseSettings,
                    defaultVisibility: e.target.value as 'public' | 'private',
                  })
                }
                className="w-48 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </SettingRow>

            <SettingRow
              label="Auto-generate Certificates"
              description="Automatically issue certificates on completion"
            >
              <Toggle
                enabled={courseSettings.autoGenerateCertificates}
                onChange={(value) =>
                  setCourseSettings({
                    ...courseSettings,
                    autoGenerateCertificates: value,
                  })
                }
              />
            </SettingRow>
          </SettingsCard>
        )}

        {/* Email/Notification Settings */}
        <SettingsCard
          title="Email & Notifications"
          description="Configure email and notification preferences"
          icon={
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
        >
          <SettingRow label="SMTP Configuration">
            <StatusBadge
              status={emailSettings.smtpConfigured ? 'configured' : 'not_configured'}
              label={emailSettings.smtpConfigured ? 'Configured' : 'Not Configured'}
            />
          </SettingRow>

          <div className="pt-2 border-t border-slate-700/50">
            <div className="text-slate-400 text-sm mb-3">Email Templates</div>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition">
                Welcome Email
              </button>
              <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition">
                Password Reset
              </button>
              <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition">
                Course Completion
              </button>
              <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition">
                Certificate Issued
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/50">
            <div className="text-slate-400 text-sm mb-3">System Notifications</div>
            <div className="space-y-3">
              <SettingRow label="New User Registration">
                <Toggle
                  enabled={emailSettings.notifyOnNewUser}
                  onChange={(value) =>
                    setEmailSettings({ ...emailSettings, notifyOnNewUser: value })
                  }
                />
              </SettingRow>
              <SettingRow label="Course Completion">
                <Toggle
                  enabled={emailSettings.notifyOnCourseCompletion}
                  onChange={(value) =>
                    setEmailSettings({
                      ...emailSettings,
                      notifyOnCourseCompletion: value,
                    })
                  }
                />
              </SettingRow>
              <SettingRow label="Support Tickets">
                <Toggle
                  enabled={emailSettings.notifyOnSupport}
                  onChange={(value) =>
                    setEmailSettings({ ...emailSettings, notifyOnSupport: value })
                  }
                />
              </SettingRow>
            </div>
          </div>
        </SettingsCard>

        {/* Security Settings */}
        {canAccessSection(['manage_admins']) && (
          <SettingsCard
            title="Security Settings"
            description="Configure authentication and access controls"
            icon={
              <svg
                className="w-5 h-5 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            }
          >
            <SettingRow
              label="Require Two-Factor Authentication"
              description="Enforce 2FA for all admin accounts"
            >
              <Toggle
                enabled={securitySettings.require2FA}
                onChange={(value) =>
                  setSecuritySettings({ ...securitySettings, require2FA: value })
                }
              />
            </SettingRow>

            <div className="pt-2 border-t border-slate-700/50">
              <div className="text-slate-400 text-sm mb-3">Password Policy</div>
              <div className="space-y-3">
                <SettingRow label="Minimum Password Length">
                  <input
                    type="number"
                    min={6}
                    max={32}
                    value={securitySettings.minPasswordLength}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        minPasswordLength: parseInt(e.target.value) || 8,
                      })
                    }
                    className="w-20 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </SettingRow>
                <SettingRow label="Require Special Characters">
                  <Toggle
                    enabled={securitySettings.requireSpecialChars}
                    onChange={(value) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireSpecialChars: value,
                      })
                    }
                  />
                </SettingRow>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/50">
              <SettingRow
                label="API Rate Limit"
                description="Requests per minute per user"
              >
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={securitySettings.apiRateLimit}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      apiRateLimit: parseInt(e.target.value) || 100,
                    })
                  }
                  className="w-24 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </SettingRow>
            </div>

            <div className="pt-2 border-t border-slate-700/50">
              <SettingRow
                label="Allowed Domains for Signup"
                description="Comma-separated list (leave empty for all)"
              >
                <input
                  type="text"
                  placeholder="example.com, company.org"
                  value={securitySettings.allowedDomains}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      allowedDomains: e.target.value,
                    })
                  }
                  className="w-64 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </SettingRow>
            </div>
          </SettingsCard>
        )}

        {/* Integrations */}
        <SettingsCard
          title="Integrations"
          description="External service connections and APIs"
          icon={
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
              />
            </svg>
          }
        >
          <SettingRow
            label="Blockchain / SBT Minting"
            description="Polygon blockchain integration for certificates"
          >
            <StatusBadge
              status={integrationSettings.blockchainEnabled ? 'active' : 'inactive'}
              label={integrationSettings.blockchainEnabled ? 'Active' : 'Inactive'}
            />
          </SettingRow>

          <SettingRow
            label="Analytics Integration"
            description="Platform analytics and reporting"
          >
            <StatusBadge
              status={integrationSettings.analyticsEnabled ? 'active' : 'inactive'}
              label={integrationSettings.analyticsEnabled ? 'Active' : 'Inactive'}
            />
          </SettingRow>

          <SettingRow
            label="Payment Gateway"
            description="Stripe payment processing"
          >
            <StatusBadge
              status={
                integrationSettings.paymentGatewayConfigured
                  ? 'configured'
                  : 'not_configured'
              }
              label={
                integrationSettings.paymentGatewayConfigured
                  ? 'Configured'
                  : 'Not Configured'
              }
            />
          </SettingRow>

          <div className="pt-4 border-t border-slate-700/50">
            <button className="w-full px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage API Keys
            </button>
          </div>
        </SettingsCard>
      </div>

      {/* Integration Configurations - Full Width */}
      <div className="mt-6 space-y-6">
        {/* Stripe Configuration */}
        <SettingsCard
          title="Stripe Payment Gateway"
          description="Configure payment processing for course purchases"
          icon={
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingRow label="Publishable Key">
              <input
                type="text"
                placeholder="pk_live_..."
                className="w-56 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </SettingRow>
            <SettingRow label="Secret Key">
              <input
                type="password"
                placeholder="sk_live_..."
                className="w-56 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </SettingRow>
            <SettingRow label="Webhook Secret">
              <input
                type="password"
                placeholder="whsec_..."
                className="w-56 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </SettingRow>
            <SettingRow label="Test Mode">
              <Toggle
                enabled={false}
                onChange={() => {}}
              />
            </SettingRow>
          </div>
          <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
            <StatusBadge status="not_configured" label="Not Configured" />
            <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white text-sm transition">
              Test Connection
            </button>
          </div>
        </SettingsCard>

        {/* Thirdweb / Blockchain Configuration */}
        <SettingsCard
          title="Thirdweb Blockchain"
          description="Configure blockchain integration for SBT certificates"
          icon={
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingRow label="Client ID">
              <input
                type="text"
                placeholder="Enter client ID"
                className="w-56 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </SettingRow>
            <SettingRow label="Secret Key">
              <input
                type="password"
                placeholder="Enter secret key"
                className="w-56 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </SettingRow>
            <SettingRow label="SBT Contract Address">
              <input
                type="text"
                placeholder="0x..."
                className="w-56 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </SettingRow>
            <SettingRow label="Network">
              <select className="w-56 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50">
                <option value="polygon">Polygon Mainnet</option>
                <option value="polygon-mumbai">Polygon Mumbai (Testnet)</option>
                <option value="ethereum">Ethereum Mainnet</option>
                <option value="goerli">Goerli (Testnet)</option>
              </select>
            </SettingRow>
          </div>
          <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between">
            <StatusBadge status="inactive" label="Inactive" />
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition">
                Deploy Contract
              </button>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white text-sm transition">
                Activate
              </button>
            </div>
          </div>
        </SettingsCard>

        {/* AI Configuration */}
        <SettingsCard
          title="AI Configuration"
          description="Configure AI services for the Socratic coach and course generation"
          icon={
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-400 text-xs font-bold">AI</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">OpenAI</p>
                    <p className="text-slate-500 text-xs">GPT-4 for Socratic coaching</p>
                  </div>
                </div>
                <StatusBadge status="not_configured" label="Not Configured" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Model</label>
                  <select className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50">
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 text-xs font-bold">P</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">Pinecone</p>
                    <p className="text-slate-500 text-xs">Vector database for RAG</p>
                  </div>
                </div>
                <StatusBadge status="not_configured" label="Not Configured" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="Enter Pinecone API key"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Index Name</label>
                  <input
                    type="text"
                    placeholder="phazur-knowledge"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <SettingRow
              label="AI Usage Limits"
              description="Monthly token budget for AI services"
            >
              <input
                type="number"
                defaultValue={1000000}
                className="w-32 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </SettingRow>
          </div>
        </SettingsCard>

        {/* Branding & Theming */}
        <SettingsCard
          title="Branding & Theming"
          description="Customize the look and feel of your platform"
          icon={
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Platform Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  P
                </div>
                <div className="space-y-2">
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition">
                    Upload Logo
                  </button>
                  <p className="text-[10px] text-slate-500">PNG, SVG. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Favicon Upload */}
            <div>
              <label className="block text-slate-400 text-sm mb-2">Favicon</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                  <div className="w-8 h-8 bg-cyan-500 rounded-lg"></div>
                </div>
                <div className="space-y-2">
                  <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition">
                    Upload Favicon
                  </button>
                  <p className="text-[10px] text-slate-500">ICO, PNG. 32x32 or 64x64.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <label className="block text-slate-400 text-sm mb-3">Brand Colors</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-500 text-xs mb-1">Primary</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500 border border-slate-700/50"></div>
                  <input
                    type="text"
                    defaultValue="#06b6d4"
                    className="flex-1 px-2 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1">Secondary</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500 border border-slate-700/50"></div>
                  <input
                    type="text"
                    defaultValue="#a855f7"
                    className="flex-1 px-2 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1">Success</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 border border-slate-700/50"></div>
                  <input
                    type="text"
                    defaultValue="#10b981"
                    className="flex-1 px-2 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 text-xs mb-1">Warning</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 border border-slate-700/50"></div>
                  <input
                    type="text"
                    defaultValue="#f59e0b"
                    className="flex-1 px-2 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            <SettingRow
              label="Custom CSS"
              description="Add custom styles to override defaults"
            >
              <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition">
                Edit CSS
              </button>
            </SettingRow>
          </div>
        </SettingsCard>

        {/* Webhooks */}
        <SettingsCard
          title="Webhooks"
          description="Configure webhooks to notify external services of platform events"
          icon={
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          }
        >
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div>
                  <p className="text-slate-300 text-sm">User Registration</p>
                  <p className="text-slate-600 text-xs font-mono">https://api.example.com/webhooks/user</p>
                </div>
              </div>
              <button className="text-slate-500 hover:text-slate-300 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div>
                  <p className="text-slate-300 text-sm">Course Completion</p>
                  <p className="text-slate-600 text-xs font-mono">https://api.example.com/webhooks/completion</p>
                </div>
              </div>
              <button className="text-slate-500 hover:text-slate-300 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-700/50">
            <button className="w-full px-4 py-2.5 border border-dashed border-slate-600 hover:border-slate-500 rounded-lg text-slate-400 hover:text-slate-300 text-sm transition flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Webhook
            </button>
          </div>
        </SettingsCard>
      </div>

      {/* Danger Zone */}
      {canAccessSection(['manage_admins']) && (
        <div className="mt-6">
          <div className="bg-red-500/10 rounded-xl border border-red-500/30">
            <div className="p-5 border-b border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-400 font-semibold">Danger Zone</h3>
                  <p className="text-red-400/70 text-sm">
                    Irreversible and destructive actions
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">
                    Export All Data
                  </div>
                  <div className="text-slate-500 text-sm">
                    Download a complete backup of all platform data
                  </div>
                </div>
                <button className="px-4 py-2 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 text-sm transition">
                  Export
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">
                    Reset Platform Statistics
                  </div>
                  <div className="text-slate-500 text-sm">
                    Clear all analytics and statistics data
                  </div>
                </div>
                <button className="px-4 py-2 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/10 text-sm transition">
                  Reset Stats
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">
                    Delete All User Data
                  </div>
                  <div className="text-slate-500 text-sm">
                    Permanently delete all user accounts and data
                  </div>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm transition">
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
