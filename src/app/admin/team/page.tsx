'use client';

/**
 * ADMIN TEAM PAGE
 * Manage admin users and teachers
 */

import { useEffect, useState } from 'react';
import {
  AdminTier,
  ADMIN_TIER_INFO,
  AdminUser,
  AdminPermission,
  TIER_PERMISSIONS,
  tierHasPermission,
} from '@/types';

// Tier color mapping for badges
const tierColorClasses: Record<AdminTier, string> = {
  super_admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  content_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  analytics_admin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  support_admin: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  teacher: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

// Permission labels for display
const permissionLabels: Record<AdminPermission, string> = {
  manage_users: 'Manage Users',
  view_users: 'View Users',
  manage_courses: 'Manage Courses',
  view_courses: 'View Courses',
  manage_sessions: 'Manage Sessions',
  view_sessions: 'View Sessions',
  view_analytics: 'View Analytics',
  manage_curriculum: 'Manage Curriculum',
  manage_support: 'Manage Support',
  manage_admins: 'Manage Admins',
};

// Admin User Card Component
function AdminCard({
  admin,
  onEdit,
  onRemove,
}: {
  admin: AdminUser;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const tier = admin.admin_tier;
  const permissions = tier ? TIER_PERMISSIONS[tier] : [];
  const tierInfo = tier ? ADMIN_TIER_INFO[tier] : null;
  const colorClass = tier ? tierColorClasses[tier] : 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          {admin.avatar_url ? (
            <img
              src={admin.avatar_url}
              alt={admin.full_name || 'Admin'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
              {(admin.full_name?.[0] || admin.email[0]).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium truncate">
              {admin.full_name || 'No name'}
            </span>
            {tier && tierInfo && (
              <span className={`px-2 py-0.5 rounded text-xs border ${colorClass}`}>
                {tierInfo.label}
              </span>
            )}
          </div>
          <div className="text-slate-400 text-sm truncate">{admin.email}</div>
          <div className="text-slate-500 text-xs mt-1">
            Last active: {formatDate(admin.last_active_at)}
          </div>
        </div>
      </div>

      {/* Permissions */}
      {permissions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="text-slate-500 text-xs mb-2">Permissions:</div>
          <div className="flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <span
                key={permission}
                className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded"
              >
                {permissionLabels[permission]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 text-sm transition"
        >
          Edit Tier
        </button>
        <button
          onClick={onRemove}
          className="flex-1 px-3 py-2 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/10 text-sm transition"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// Invite Admin Modal
function InviteModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedTier, setSelectedTier] = useState<AdminTier>('teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tiers = Object.keys(ADMIN_TIER_INFO) as AdminTier[];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName || null,
          admin_tier: selectedTier,
          role: selectedTier === 'teacher' ? 'teacher' : 'admin',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to invite admin');
      }

      onInvited();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite admin');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d21] rounded-xl border border-slate-700/50 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-[#1a1d21]">
          <h2 className="text-lg font-semibold text-white">Invite Admin</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as AdminTier)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              {tiers.map((tier) => (
                <option key={tier} value={tier}>
                  {ADMIN_TIER_INFO[tier].label}
                </option>
              ))}
            </select>
            <p className="text-slate-500 text-xs mt-1.5">{ADMIN_TIER_INFO[selectedTier].description}</p>
          </div>

          {/* Permission Preview */}
          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <div className="text-slate-400 text-xs font-medium mb-2">Permissions for {ADMIN_TIER_INFO[selectedTier].label}:</div>
            <div className="flex flex-wrap gap-1.5">
              {TIER_PERMISSIONS[selectedTier].map((permission) => (
                <span
                  key={permission}
                  className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded"
                >
                  {permissionLabels[permission]}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition disabled:opacity-50"
            >
              {loading ? 'Inviting...' : 'Invite Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Tier Modal
function EditTierModal({
  admin,
  onClose,
  onSaved,
}: {
  admin: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selectedTier, setSelectedTier] = useState<AdminTier>(admin.admin_tier || 'teacher');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tiers = Object.keys(ADMIN_TIER_INFO) as AdminTier[];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: admin.id,
          admin_tier: selectedTier,
          role: selectedTier === 'teacher' ? 'teacher' : 'admin',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tier');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tier');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d21] rounded-xl border border-slate-700/50 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-[#1a1d21]">
          <h2 className="text-lg font-semibold text-white">Edit Admin Tier</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
            {admin.avatar_url ? (
              <img
                src={admin.avatar_url}
                alt={admin.full_name || 'Admin'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                {(admin.full_name?.[0] || admin.email[0]).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">{admin.full_name || 'No name'}</div>
              <div className="text-slate-400 text-sm truncate">{admin.email}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Current Tier: <span className="text-cyan-400">{admin.admin_tier ? ADMIN_TIER_INFO[admin.admin_tier].label : 'None'}</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">New Admin Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as AdminTier)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              {tiers.map((tier) => (
                <option key={tier} value={tier}>
                  {ADMIN_TIER_INFO[tier].label}
                </option>
              ))}
            </select>
            <p className="text-slate-500 text-xs mt-1.5">{ADMIN_TIER_INFO[selectedTier].description}</p>
          </div>

          {/* Permission Preview */}
          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
            <div className="text-slate-400 text-xs font-medium mb-2">New Permissions:</div>
            <div className="flex flex-wrap gap-1.5">
              {TIER_PERMISSIONS[selectedTier].map((permission) => (
                <span
                  key={permission}
                  className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded"
                >
                  {permissionLabels[permission]}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Remove Confirmation Modal
function RemoveModal({
  admin,
  onClose,
  onRemoved,
}: {
  admin: AdminUser;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRemove() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: admin.id,
          admin_tier: null,
          role: 'learner',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove admin');
      }

      onRemoved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d21] rounded-xl border border-slate-700/50 w-full max-w-md">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Remove Admin Access</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="text-slate-300">
            Are you sure you want to remove admin access for this user?
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
            {admin.avatar_url ? (
              <img
                src={admin.avatar_url}
                alt={admin.full_name || 'Admin'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                {(admin.full_name?.[0] || admin.email[0]).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">{admin.full_name || 'No name'}</div>
              <div className="text-slate-400 text-sm truncate">{admin.email}</div>
              {admin.admin_tier && (
                <div className="text-slate-500 text-xs mt-0.5">{ADMIN_TIER_INFO[admin.admin_tier].label}</div>
              )}
            </div>
          </div>

          <div className="text-slate-500 text-sm">
            This will revoke all admin permissions and convert them to a regular learner account.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleRemove}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition disabled:opacity-50"
            >
              {loading ? 'Removing...' : 'Remove Access'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Access Denied Component
function AccessDenied() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 max-w-md">
          You do not have permission to manage team members. This page requires the &quot;manage_admins&quot; permission.
        </p>
      </div>
    </div>
  );
}

// Main Page Component
export default function TeamPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [removingAdmin, setRemovingAdmin] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  // Check current user's permissions
  useEffect(() => {
    async function checkPermissions() {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          const userTier = data.user?.admin_tier as AdminTier | null;
          setHasPermission(tierHasPermission(userTier, 'manage_admins'));
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Failed to check permissions:', error);
        setHasPermission(false);
      }
    }
    checkPermissions();
  }, []);

  // Fetch admin users
  async function fetchAdmins() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users?role=admin&role=teacher');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (hasPermission) {
      fetchAdmins();
    }
  }, [hasPermission]);

  // Filter admins based on search and tier
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      !search ||
      admin.email.toLowerCase().includes(search.toLowerCase()) ||
      admin.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTier = !tierFilter || admin.admin_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Show loading while checking permissions
  if (hasPermission === null) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Checking permissions...</div>
      </div>
    );
  }

  // Show access denied if no permission
  if (!hasPermission) {
    return <AccessDenied />;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Team Management</h1>
          <p className="text-slate-400">Manage administrators and teachers.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite Admin
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="">All Tiers</option>
          {(Object.keys(ADMIN_TIER_INFO) as AdminTier[]).map((tier) => (
            <option key={tier} value={tier}>
              {ADMIN_TIER_INFO[tier].label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-slate-400 text-sm mb-4">
        {filteredAdmins.length} team member{filteredAdmins.length !== 1 ? 's' : ''} found
      </div>

      {/* Admins Grid */}
      {loading ? (
        <div className="text-slate-400">Loading team members...</div>
      ) : filteredAdmins.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/20 rounded-xl border border-slate-700/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">No team members found</h3>
          <p className="text-slate-500 mb-4">
            {search || tierFilter ? 'Try adjusting your search or filters.' : 'Invite your first admin to get started.'}
          </p>
          {!search && !tierFilter && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition"
            >
              Invite Admin
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAdmins.map((admin) => (
            <AdminCard
              key={admin.id}
              admin={admin}
              onEdit={() => setEditingAdmin(admin)}
              onRemove={() => setRemovingAdmin(admin)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvited={fetchAdmins}
        />
      )}

      {editingAdmin && (
        <EditTierModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={fetchAdmins}
        />
      )}

      {removingAdmin && (
        <RemoveModal
          admin={removingAdmin}
          onClose={() => setRemovingAdmin(null)}
          onRemoved={fetchAdmins}
        />
      )}
    </div>
  );
}
