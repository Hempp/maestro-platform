'use client';

/**
 * CONTENT HEALTH DASHBOARD
 * Analytics for AKU content performance, engagement, and health metrics
 */

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

// Types
interface ContentItem {
  id: string;
  title: string;
  type: 'video' | 'interactive' | 'text' | 'project';
  tier: 'student' | 'employee' | 'owner';
  course: string;
  module: string;
  completionRate: number;
  avgTimeSpent: number; // in minutes
  dropOffRate: number;
  struggleScore: number;
  engagementScore: number;
  totalAttempts: number;
  lastUpdated: string;
  createdAt: string;
  status: 'healthy' | 'warning' | 'critical';
  flaggedForReview: boolean;
}

interface ContentStats {
  totalAkus: number;
  avgCompletionRate: number;
  contentWithIssues: number;
  totalLearners: number;
}

interface ContentGap {
  topic: string;
  strugglePercentage: number;
  affectedLearners: number;
  suggestedAction: string;
}

interface EngagementByType {
  type: string;
  avgEngagement: number;
  avgCompletion: number;
  count: number;
}

type SortField = 'title' | 'completionRate' | 'dropOffRate' | 'struggleScore' | 'engagementScore' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

// Stat Card Component
function StatCard({
  label,
  value,
  subtext,
  icon,
  color
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-slate-400 text-sm mb-1">{label}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {subtext && (
            <div className="text-xs mt-1 text-slate-500">{subtext}</div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Health Status Badge
function HealthBadge({ status }: { status: 'healthy' | 'warning' | 'critical' }) {
  const config = {
    healthy: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Healthy' },
    warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Warning' },
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Critical' },
  };

  const { bg, text, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'healthy' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-red-400'}`} />
      {label}
    </span>
  );
}

// Content Type Badge
function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    video: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    interactive: {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      )
    },
    text: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    project: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
  };

  const { bg, text, icon } = config[type] || config.text;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs capitalize ${bg} ${text}`}>
      {icon}
      {type}
    </span>
  );
}

// Sortable Table Header
function SortableHeader({
  label,
  field,
  currentSort,
  currentDirection,
  onSort,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider ${
        isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
      <svg
        className={`w-3 h-3 transition-transform ${isActive && currentDirection === 'desc' ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}

// Engagement Bar Chart
function EngagementChart({ data }: { data: EngagementByType[] }) {
  const maxEngagement = Math.max(...data.map(d => d.avgEngagement), 1);

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-white font-semibold mb-4">Engagement by Content Type</h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.type}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300 capitalize">{item.type}</span>
              <span className="text-slate-400">{item.avgEngagement}% avg engagement</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  item.type === 'video' ? 'bg-purple-500' :
                  item.type === 'interactive' ? 'bg-cyan-500' :
                  item.type === 'text' ? 'bg-blue-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${(item.avgEngagement / maxEngagement) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{item.count} items</span>
              <span>{item.avgCompletion}% completion</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Fresh vs Stale Content Chart
function FreshnessChart({ content }: { content: ContentItem[] }) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const fresh = content.filter(c => new Date(c.lastUpdated) > thirtyDaysAgo).length;
  const recent = content.filter(c => {
    const date = new Date(c.lastUpdated);
    return date <= thirtyDaysAgo && date > ninetyDaysAgo;
  }).length;
  const aging = content.filter(c => {
    const date = new Date(c.lastUpdated);
    return date <= ninetyDaysAgo && date > oneYearAgo;
  }).length;
  const stale = content.filter(c => new Date(c.lastUpdated) <= oneYearAgo).length;

  const total = content.length || 1;

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-white font-semibold mb-4">Content Freshness</h3>
      <div className="h-4 flex rounded-full overflow-hidden mb-4">
        <div
          className="bg-emerald-500 transition-all"
          style={{ width: `${(fresh / total) * 100}%` }}
          title={`Fresh: ${fresh}`}
        />
        <div
          className="bg-cyan-500 transition-all"
          style={{ width: `${(recent / total) * 100}%` }}
          title={`Recent: ${recent}`}
        />
        <div
          className="bg-amber-500 transition-all"
          style={{ width: `${(aging / total) * 100}%` }}
          title={`Aging: ${aging}`}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${(stale / total) * 100}%` }}
          title={`Stale: ${stale}`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-sm text-slate-400">Fresh (&lt;30d): {fresh}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-cyan-500" />
          <span className="text-sm text-slate-400">Recent (30-90d): {recent}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-sm text-slate-400">Aging (90d-1y): {aging}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-sm text-slate-400">Stale (&gt;1y): {stale}</span>
        </div>
      </div>
    </div>
  );
}

// Action Button
function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const variants = {
    default: 'text-slate-400 hover:text-white hover:bg-slate-700/50',
    warning: 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10',
    danger: 'text-red-400 hover:text-red-300 hover:bg-red-500/10',
  };

  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition ${variants[variant]}`}
      title={label}
    >
      {icon}
    </button>
  );
}

export default function ContentHealthDashboard() {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [engagementByType, setEngagementByType] = useState<EngagementByType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('struggleScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Tab state
  const [activeTab, setActiveTab] = useState<'problem' | 'top'>('problem');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          type: typeFilter,
          status: statusFilter,
          tier: tierFilter,
          sortField,
          sortDirection,
        });

        const response = await fetch(`/api/admin/analytics/content?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch content health data');
        }

        const data = await response.json();
        setStats(data.stats);
        setContent(data.content);
        setGaps(data.gaps);
        setEngagementByType(data.engagementByType);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }

      setLoading(false);
    }

    fetchData();
  }, [typeFilter, statusFilter, tierFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort content
  const filteredContent = useMemo(() => {
    return content.filter(item => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (tierFilter !== 'all' && item.tier !== tierFilter) return false;
      return true;
    });
  }, [content, typeFilter, statusFilter, tierFilter]);

  const problemContent = useMemo(() => {
    return filteredContent
      .filter(item => item.status === 'warning' || item.status === 'critical' || item.flaggedForReview)
      .sort((a, b) => b.struggleScore - a.struggleScore);
  }, [filteredContent]);

  const topContent = useMemo(() => {
    return [...filteredContent]
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10);
  }, [filteredContent]);

  // Action handlers
  const handleEditContent = (id: string) => {
    // TODO: Navigate to content editor
    console.log('Edit content:', id);
    alert(`Edit content: ${id}`);
  };

  const handleArchiveContent = (id: string) => {
    // TODO: Archive content
    console.log('Archive content:', id);
    alert(`Archive content: ${id}`);
  };

  const handleFlagForReview = (id: string) => {
    // TODO: Flag content for review
    console.log('Flag for review:', id);
    alert(`Flagged for review: ${id}`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Loading content health data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/analytics"
              className="text-slate-400 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-white">Content Health Dashboard</h1>
          </div>
          <p className="text-slate-400">Monitor AKU performance, engagement, and identify content that needs attention.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-white transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Report
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total AKUs"
          value={stats?.totalAkus || 0}
          subtext="Active learning units"
          color="bg-blue-500/20"
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatCard
          label="Avg Completion Rate"
          value={`${stats?.avgCompletionRate || 0}%`}
          subtext="Across all content"
          color="bg-emerald-500/20"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Content with Issues"
          value={stats?.contentWithIssues || 0}
          subtext="Needs attention"
          color="bg-amber-500/20"
          icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Active Learners"
          value={stats?.totalLearners || 0}
          subtext="This month"
          color="bg-purple-500/20"
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <EngagementChart data={engagementByType} />
        <FreshnessChart content={content} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Types</option>
            <option value="video">Video</option>
            <option value="interactive">Interactive</option>
            <option value="text">Text</option>
            <option value="project">Project</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Tier:</label>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Tiers</option>
            <option value="student">Student</option>
            <option value="employee">Employee</option>
            <option value="owner">Owner</option>
          </select>
        </div>
      </div>

      {/* Content Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Problem Content Table */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Problem Content
            </h3>
            <p className="text-slate-500 text-sm">High drop-off or struggle scores</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-4">
                    <SortableHeader
                      label="Content"
                      field="title"
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="text-left p-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Type</span>
                  </th>
                  <th className="text-left p-4">
                    <SortableHeader
                      label="Struggle"
                      field="struggleScore"
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="text-left p-4">
                    <SortableHeader
                      label="Drop-off"
                      field="dropOffRate"
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="text-left p-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Status</span>
                  </th>
                  <th className="text-left p-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {problemContent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No problem content found. Great job!
                    </td>
                  </tr>
                ) : (
                  problemContent.slice(0, 10).map((item) => (
                    <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                      <td className="p-4">
                        <div>
                          <div className="text-white font-medium text-sm truncate max-w-[200px]">{item.title}</div>
                          <div className="text-slate-500 text-xs">{item.course}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <TypeBadge type={item.type} />
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold text-sm ${
                          item.struggleScore >= 70 ? 'text-red-400' :
                          item.struggleScore >= 50 ? 'text-amber-400' :
                          'text-slate-400'
                        }`}>
                          {item.struggleScore}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold text-sm ${
                          item.dropOffRate >= 40 ? 'text-red-400' :
                          item.dropOffRate >= 25 ? 'text-amber-400' :
                          'text-slate-400'
                        }`}>
                          {item.dropOffRate}%
                        </span>
                      </td>
                      <td className="p-4">
                        <HealthBadge status={item.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <ActionButton
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            }
                            label="Edit"
                            onClick={() => handleEditContent(item.id)}
                          />
                          <ActionButton
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                              </svg>
                            }
                            label="Flag for Review"
                            onClick={() => handleFlagForReview(item.id)}
                            variant="warning"
                          />
                          <ActionButton
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            }
                            label="Archive"
                            onClick={() => handleArchiveContent(item.id)}
                            variant="danger"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performing Content Table */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Top Performing Content
            </h3>
            <p className="text-slate-500 text-sm">Highest engagement and completion rates</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Content</span>
                  </th>
                  <th className="text-left p-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Type</span>
                  </th>
                  <th className="text-left p-4">
                    <SortableHeader
                      label="Engagement"
                      field="engagementScore"
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="text-left p-4">
                    <SortableHeader
                      label="Completion"
                      field="completionRate"
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="text-left p-4">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {topContent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No content data available
                    </td>
                  </tr>
                ) : (
                  topContent.map((item) => (
                    <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                      <td className="p-4">
                        <div>
                          <div className="text-white font-medium text-sm truncate max-w-[200px]">{item.title}</div>
                          <div className="text-slate-500 text-xs">{item.course}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <TypeBadge type={item.type} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${item.engagementScore}%` }}
                            />
                          </div>
                          <span className="text-emerald-400 font-semibold text-sm">{item.engagementScore}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-cyan-400 font-semibold text-sm">{item.completionRate}%</span>
                      </td>
                      <td className="p-4">
                        <HealthBadge status={item.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Content Gap Analysis */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Content Gap Analysis
          </h3>
          <p className="text-slate-500 text-sm">Areas where learners struggle most</p>
        </div>
        <div className="p-4">
          {gaps.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No significant content gaps identified
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gaps.map((gap, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-white font-medium">{gap.topic}</h4>
                    <span className="text-red-400 font-semibold text-sm">{gap.strugglePercentage}%</span>
                  </div>
                  <div className="text-slate-400 text-sm mb-3">
                    {gap.affectedLearners} learners affected
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-700/30 rounded px-2 py-1.5">
                    Suggested: {gap.suggestedAction}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
