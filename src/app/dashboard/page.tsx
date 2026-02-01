'use client';

/**
 * PROGRESS TRANSPARENCY DASHBOARD
 * Real-time learning journey tracking
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ProgressDashboard as DashboardType } from '@/types';

interface DashboardData {
  dashboard: DashboardType;
  insights: string[];
  lastUpdated: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        // Use a demo learner ID for now
        const response = await fetch('/api/progress?learnerId=demo-learner');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const dashboard = data?.dashboard;
  const insights = data?.insights || [];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-white">
              MAESTRO
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Progress Dashboard</span>
          </div>
          <Link
            href="/learn"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition"
          >
            Continue Learning
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Insights Banner */}
        {insights.length > 0 && (
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-xl">
            <h2 className="text-sm font-semibold text-blue-400 mb-2">Insights</h2>
            <div className="space-y-1">
              {insights.map((insight, i) => (
                <p key={i} className="text-slate-300 text-sm">{insight}</p>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Learning Time"
            value={`${dashboard?.totalLearningTime.toFixed(1) || 0}h`}
            icon="⏱️"
            color="blue"
          />
          <StatCard
            label="Current Streak"
            value={`${dashboard?.currentStreak || 0} days`}
            icon="🔥"
            color="orange"
          />
          <StatCard
            label="AKUs Completed"
            value={`${dashboard?.akusCompleted || 0}/${dashboard?.akusTotal || 0}`}
            icon="✅"
            color="green"
          />
          <StatCard
            label="Struggle Score"
            value={dashboard?.averageStruggleScore || 0}
            icon="💪"
            color="purple"
            subtitle={getStruggleLabel(dashboard?.averageStruggleScore || 0)}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Weekly Activity */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Activity</h3>
            <div className="flex items-end gap-2 h-40">
              {dashboard?.weeklyActivity.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-emerald-500/30 rounded-t transition-all hover:bg-emerald-500/50"
                    style={{
                      height: `${Math.max(day.minutesLearned / 60 * 100, 4)}%`,
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-xs text-slate-500 mt-2">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  {day.akusCompleted > 0 && (
                    <span className="text-xs text-emerald-400">{day.akusCompleted} AKU</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
            <div className="space-y-4">
              <ProgressItem
                label="First-Try Success"
                value={dashboard?.firstTrySuccessRate || 0}
                max={100}
                suffix="%"
              />
              <ProgressItem
                label="Hints Used"
                value={dashboard?.hintsUsedTotal || 0}
                max={50}
              />
              <ProgressItem
                label="Verification Attempts"
                value={dashboard?.verificationAttempts || 0}
                max={dashboard?.akusTotal || 12}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="text-sm text-slate-400">Average Time per AKU</div>
              <div className="text-2xl font-bold text-white">
                {dashboard?.averageTimePerAKU || 0} min
              </div>
            </div>
          </div>

          {/* Competency Radar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Competencies</h3>
            <div className="space-y-3">
              {dashboard?.competencyLevels.map((comp) => (
                <div key={comp.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400 capitalize">
                      {comp.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-300">
                      {comp.currentLevel}/{comp.targetLevel}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${(comp.currentLevel / comp.targetLevel) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Milestones</h3>
            <div className="space-y-4">
              {dashboard?.milestones.map((milestone, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    milestone.achievedAt
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {milestone.achievedAt ? '✓' : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className={milestone.achievedAt ? 'text-white' : 'text-slate-400'}>
                        {milestone.name}
                      </span>
                      <span className="text-sm text-slate-500">
                        {milestone.progress}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{milestone.description}</p>
                    <div className="h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${milestone.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estimated Completion */}
        {dashboard?.estimatedCertificationDate && (
          <div className="mt-8 p-6 bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-700/50 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-emerald-400 mb-2">
              Estimated Certification Date
            </h3>
            <p className="text-3xl font-bold text-white">
              {new Date(dashboard.estimatedCertificationDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-slate-400 mt-2">
              Keep up the pace and you'll earn your certificate!
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Link
            href="/learn"
            className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-emerald-500/50 transition group"
          >
            <div className="text-2xl mb-2">📚</div>
            <h4 className="font-semibold text-white group-hover:text-emerald-400 transition">
              Continue Learning
            </h4>
            <p className="text-sm text-slate-500">Pick up where you left off</p>
          </Link>

          <Link
            href="/support"
            className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/50 transition group"
          >
            <div className="text-2xl mb-2">💬</div>
            <h4 className="font-semibold text-white group-hover:text-blue-400 transition">
              Get Support
            </h4>
            <p className="text-sm text-slate-500">AI help or human advisor</p>
          </Link>

          <Link
            href="/mentor"
            className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500/50 transition group"
          >
            <div className="text-2xl mb-2">👤</div>
            <h4 className="font-semibold text-white group-hover:text-purple-400 transition">
              Schedule Mentor Call
            </h4>
            <p className="text-sm text-slate-500">Weekly 1:1 check-in</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'orange' | 'green' | 'purple';
  subtitle?: string;
}) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    green: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  };

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}

function ProgressItem({
  label,
  value,
  max,
  suffix = '',
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{value}{suffix}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function getStruggleLabel(score: number): string {
  if (score <= 20) return 'Elite';
  if (score <= 40) return 'Strong';
  if (score <= 60) return 'Solid';
  return 'Persistent';
}
