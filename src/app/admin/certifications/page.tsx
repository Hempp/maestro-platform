'use client';

/**
 * ADMIN CERTIFICATIONS DASHBOARD
 * List and filter certification submissions for review
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Submission {
  id: string;
  user_id: string;
  path: 'student' | 'employee' | 'owner';
  status: 'submitted' | 'under_review' | 'passed' | 'failed';
  project_title: string;
  project_description: string | null;
  total_score: number | null;
  submitted_at: string;
  reviewed_at: string | null;
  user: User | null;
  reviewer: User | null;
}

interface Stats {
  statusCounts: {
    submitted: number;
    under_review: number;
    passed: number;
    failed: number;
  };
  pathCounts: {
    student: number;
    employee: number;
    owner: number;
  };
}

const PATH_COLORS = {
  student: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  employee: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  owner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const PATH_LABELS = {
  student: 'AI Associate',
  employee: 'Workflow Lead',
  owner: 'AI Operations',
};

const STATUS_COLORS = {
  submitted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  under_review: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  passed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_LABELS = {
  submitted: 'Pending Review',
  under_review: 'Under Review',
  passed: 'Passed',
  failed: 'Failed',
};

function StatCard({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all text-left w-full ${
        active
          ? `${color} border-current`
          : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
      }`}
    >
      <div className={`text-2xl font-bold ${active ? '' : 'text-white'}`}>{value}</div>
      <div className={`text-sm ${active ? '' : 'text-slate-400'}`}>{label}</div>
    </button>
  );
}

export default function AdminCertificationsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pathFilter, setPathFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSubmissions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (pathFilter) params.set('path', pathFilter);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/submissions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
    setLoading(false);
  }, [search, pathFilter, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleStartReview = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'under_review' }),
      });

      if (response.ok) {
        // Navigate to review page
        window.location.href = `/admin/certifications/review/${id}`;
      }
    } catch (error) {
      console.error('Failed to start review:', error);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setPathFilter('');
    setStatusFilter('');
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Certification Reviews</h1>
        <p className="text-slate-400">Review and score final project submissions for certification.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending Review"
          value={stats?.statusCounts.submitted || 0}
          color={STATUS_COLORS.submitted}
          active={statusFilter === 'submitted'}
          onClick={() => setStatusFilter(statusFilter === 'submitted' ? '' : 'submitted')}
        />
        <StatCard
          label="Under Review"
          value={stats?.statusCounts.under_review || 0}
          color={STATUS_COLORS.under_review}
          active={statusFilter === 'under_review'}
          onClick={() => setStatusFilter(statusFilter === 'under_review' ? '' : 'under_review')}
        />
        <StatCard
          label="Passed"
          value={stats?.statusCounts.passed || 0}
          color={STATUS_COLORS.passed}
          active={statusFilter === 'passed'}
          onClick={() => setStatusFilter(statusFilter === 'passed' ? '' : 'passed')}
        />
        <StatCard
          label="Failed"
          value={stats?.statusCounts.failed || 0}
          color={STATUS_COLORS.failed}
          active={statusFilter === 'failed'}
          onClick={() => setStatusFilter(statusFilter === 'failed' ? '' : 'failed')}
        />
      </div>

      {/* Filters */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, email, or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Path Filter */}
          <div className="flex gap-2">
            {(['student', 'employee', 'owner'] as const).map((path) => (
              <button
                key={path}
                onClick={() => setPathFilter(pathFilter === path ? '' : path)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  pathFilter === path
                    ? PATH_COLORS[path]
                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                {PATH_LABELS[path]}
              </button>
            ))}
          </div>

          {/* Clear Filters */}
          {(search || pathFilter || statusFilter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-slate-400 hover:text-white text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-slate-500 mb-2">No submissions found</div>
            {(search || pathFilter || statusFilter) && (
              <button
                onClick={clearFilters}
                className="text-cyan-400 text-sm hover:text-cyan-300"
              >
                Clear filters to see all submissions
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">Student</th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">Project</th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">Path</th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">Score</th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">Submitted</th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {submission.user?.full_name?.[0] ||
                            submission.user?.email?.[0]?.toUpperCase() ||
                            '?'}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {submission.user?.full_name || 'Unknown'}
                          </div>
                          <div className="text-slate-500 text-sm">
                            {submission.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-medium">{submission.project_title}</div>
                      {submission.project_description && (
                        <div className="text-slate-500 text-sm truncate max-w-[200px]">
                          {submission.project_description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${PATH_COLORS[submission.path]}`}>
                        {PATH_LABELS[submission.path]}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${STATUS_COLORS[submission.status]}`}>
                        {STATUS_LABELS[submission.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      {submission.total_score !== null ? (
                        <span className={`font-medium ${submission.total_score >= 70 ? 'text-green-400' : 'text-red-400'}`}>
                          {submission.total_score}/100
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-4">
                      {submission.status === 'submitted' ? (
                        <button
                          onClick={() => handleStartReview(submission.id)}
                          className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition"
                        >
                          Start Review
                        </button>
                      ) : (
                        <Link
                          href={`/admin/certifications/review/${submission.id}`}
                          className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition inline-block"
                        >
                          {submission.status === 'under_review' ? 'Continue' : 'View'}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
