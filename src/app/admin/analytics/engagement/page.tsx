'use client';

/**
 * ENGAGEMENT & RETENTION DASHBOARD
 * Comprehensive engagement analytics for admin portal
 */

import { useEffect, useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ActiveUsersMetric {
  dau: number;
  wau: number;
  mau: number;
  dauTrend: number;
  wauTrend: number;
  mauTrend: number;
}

interface RetentionCohort {
  cohort: string;
  cohortSize: number;
  day1: number;
  day7: number;
  day14: number;
  day30: number;
}

interface HeatmapCell {
  day: number;
  hour: number;
  value: number;
}

interface AtRiskUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastActive: string;
  activityDecline: number;
  previousAvgSessions: number;
  recentSessions: number;
  churnRisk: 'high' | 'medium' | 'low';
  tier: string;
}

interface FeatureUsage {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  avgSessionTime: number;
  trend: number;
  category: string;
}

interface EngagementAnalytics {
  activeUsers: ActiveUsersMetric;
  retentionCohorts: RetentionCohort[];
  engagementHeatmap: HeatmapCell[];
  atRiskUsers: AtRiskUser[];
  featureAdoption: FeatureUsage[];
  dateRange: {
    start: string;
    end: string;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getRetentionColor(percentage: number): string {
  if (percentage >= 70) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-emerald-400';
  if (percentage >= 35) return 'bg-yellow-500';
  if (percentage >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getHeatmapColor(value: number, maxValue: number): string {
  const intensity = value / maxValue;
  if (intensity >= 0.8) return 'bg-cyan-500';
  if (intensity >= 0.6) return 'bg-cyan-400';
  if (intensity >= 0.4) return 'bg-cyan-300/60';
  if (intensity >= 0.2) return 'bg-cyan-200/40';
  if (intensity > 0) return 'bg-cyan-100/20';
  return 'bg-slate-800/50';
}

function getRiskBadgeColor(risk: 'high' | 'medium' | 'low'): string {
  switch (risk) {
    case 'high': return 'bg-red-500/20 text-red-400';
    case 'medium': return 'bg-orange-500/20 text-orange-400';
    case 'low': return 'bg-yellow-500/20 text-yellow-400';
  }
}

function getTierBadgeColor(tier: string): string {
  switch (tier) {
    case 'owner': return 'bg-emerald-500/20 text-emerald-400';
    case 'employee': return 'bg-blue-500/20 text-blue-400';
    case 'student': return 'bg-purple-500/20 text-purple-400';
    default: return 'bg-slate-500/20 text-slate-400';
  }
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function CardSkeleton() {
  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 animate-pulse">
      <div className="h-4 bg-slate-700/50 rounded w-24 mb-3" />
      <div className="h-8 bg-slate-700/50 rounded w-20 mb-2" />
      <div className="h-3 bg-slate-700/50 rounded w-16" />
    </div>
  );
}

function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 animate-pulse ${height}`}>
      <div className="h-5 bg-slate-700/50 rounded w-40 mb-4" />
      <div className="flex-1 bg-slate-700/30 rounded" style={{ height: 'calc(100% - 40px)' }} />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 animate-pulse">
      <div className="p-4 border-b border-slate-700/50">
        <div className="h-5 bg-slate-700/50 rounded w-40" />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="w-10 h-10 bg-slate-700/50 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-slate-700/50 rounded w-32 mb-2" />
              <div className="h-3 bg-slate-700/50 rounded w-24" />
            </div>
            <div className="h-6 bg-slate-700/50 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
        {icon}
      </div>
      <p className="text-slate-400">{message}</p>
    </div>
  );
}

// ============================================================================
// ACTIVE USERS CARD
// ============================================================================

function ActiveUsersCard({ data }: { data: ActiveUsersMetric }) {
  const metrics = [
    { label: 'DAU', value: data.dau, trend: data.dauTrend, description: 'Daily Active Users' },
    { label: 'WAU', value: data.wau, trend: data.wauTrend, description: 'Weekly Active Users' },
    { label: 'MAU', value: data.mau, trend: data.mauTrend, description: 'Monthly Active Users' },
  ];

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Active Users
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center p-4 bg-slate-800/50 rounded-lg">
              <div className="text-slate-400 text-xs mb-1">{metric.label}</div>
              <div className="text-2xl font-bold text-white mb-1">{formatNumber(metric.value)}</div>
              <div className={`text-xs flex items-center justify-center gap-1 ${
                metric.trend >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {metric.trend >= 0 ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {Math.abs(metric.trend)}%
              </div>
              <div className="text-slate-500 text-[10px] mt-1">{metric.description}</div>
            </div>
          ))}
        </div>
        {/* DAU/MAU Ratio */}
        <div className="mt-4 p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-sm">Stickiness (DAU/MAU)</div>
              <div className="text-white text-lg font-semibold">
                {((data.dau / data.mau) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-xs">Industry avg: 10-20%</div>
              <div className={`text-sm font-medium ${
                (data.dau / data.mau) > 0.2 ? 'text-emerald-400' :
                (data.dau / data.mau) > 0.1 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {(data.dau / data.mau) > 0.2 ? 'Excellent' :
                 (data.dau / data.mau) > 0.1 ? 'Good' : 'Needs improvement'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RETENTION CURVE CHART
// ============================================================================

function RetentionCurveChart({ data }: { data: RetentionCohort[] }) {
  if (!data.length) {
    return (
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 h-full">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">Retention Cohorts</h3>
        </div>
        <EmptyState
          message="No retention data available"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Retention Cohorts
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-400">&gt;70%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-slate-400">35-70%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-slate-400">&lt;35%</span>
          </div>
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="text-slate-400 text-xs">
              <th className="text-left py-2 px-3 font-medium">Cohort</th>
              <th className="text-center py-2 px-3 font-medium">Size</th>
              <th className="text-center py-2 px-3 font-medium">Day 1</th>
              <th className="text-center py-2 px-3 font-medium">Day 7</th>
              <th className="text-center py-2 px-3 font-medium">Day 14</th>
              <th className="text-center py-2 px-3 font-medium">Day 30</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cohort, index) => (
              <tr key={index} className="border-t border-slate-700/30">
                <td className="py-2 px-3 text-white text-sm font-medium">{cohort.cohort}</td>
                <td className="py-2 px-3 text-center text-slate-300 text-sm">{cohort.cohortSize}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.day1)} text-white`}>
                      {cohort.day1}%
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.day7)} text-white`}>
                      {cohort.day7}%
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.day14)} text-white`}>
                      {cohort.day14}%
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRetentionColor(cohort.day30)} text-white`}>
                      {cohort.day30}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Average retention summary */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <div className="text-slate-400 text-xs mb-2">Average Retention</div>
          <div className="flex items-center gap-4">
            {[
              { label: 'D1', values: data.map(d => d.day1) },
              { label: 'D7', values: data.map(d => d.day7) },
              { label: 'D14', values: data.map(d => d.day14) },
              { label: 'D30', values: data.map(d => d.day30) },
            ].map((item) => {
              const avg = Math.round(item.values.reduce((a, b) => a + b, 0) / item.values.length);
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">{item.label}:</span>
                  <span className={`text-sm font-medium ${
                    avg >= 50 ? 'text-emerald-400' : avg >= 30 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{avg}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENGAGEMENT HEATMAP
// ============================================================================

function EngagementHeatmap({ data }: { data: HeatmapCell[] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxValue = Math.max(...data.map(d => d.value));

  if (!data.length) {
    return (
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">Activity Heatmap</h3>
        </div>
        <EmptyState
          message="No activity data available"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          }
        />
      </div>
    );
  }

  // Group data by day and hour
  const heatmapData: Record<number, Record<number, number>> = {};
  data.forEach(cell => {
    if (!heatmapData[cell.day]) heatmapData[cell.day] = {};
    heatmapData[cell.day][cell.hour] = cell.value;
  });

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Activity Heatmap
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Low</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded bg-cyan-100/20" />
            <div className="w-4 h-4 rounded bg-cyan-200/40" />
            <div className="w-4 h-4 rounded bg-cyan-300/60" />
            <div className="w-4 h-4 rounded bg-cyan-400" />
            <div className="w-4 h-4 rounded bg-cyan-500" />
          </div>
          <span>High</span>
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-12" />
            {hours.map((hour) => (
              <div
                key={hour}
                className="flex-1 text-center text-[10px] text-slate-500"
              >
                {hour % 3 === 0 ? `${hour}:00` : ''}
              </div>
            ))}
          </div>
          {/* Heatmap grid */}
          {days.map((day, dayIndex) => (
            <div key={day} className="flex items-center gap-1 mb-1">
              <div className="w-12 text-xs text-slate-400 text-right pr-2">{day}</div>
              {hours.map((hour) => {
                const value = heatmapData[dayIndex]?.[hour] || 0;
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={`flex-1 h-6 rounded-sm ${getHeatmapColor(value, maxValue)} hover:ring-2 hover:ring-white/30 transition cursor-pointer`}
                    title={`${day} ${hour}:00 - ${value} activities`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Peak activity summary */}
      <div className="px-4 pb-4">
        <div className="p-3 bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-slate-400">Peak Activity: </span>
              <span className="text-white font-medium">Tuesday - Thursday, 9AM - 12PM</span>
            </div>
            <div>
              <span className="text-slate-400">Lowest Activity: </span>
              <span className="text-white font-medium">Sunday, 2AM - 5AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AT-RISK USERS TABLE
// ============================================================================

function AtRiskUsersTable({ data }: { data: AtRiskUser[] }) {
  if (!data.length) {
    return (
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">At-Risk Users</h3>
        </div>
        <EmptyState
          message="No at-risk users detected"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          At-Risk Users
          <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
            {data.filter(u => u.churnRisk === 'high').length} high risk
          </span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-700/30">
              <th className="text-left py-3 px-4 font-medium">User</th>
              <th className="text-left py-3 px-4 font-medium">Last Active</th>
              <th className="text-center py-3 px-4 font-medium">Activity Decline</th>
              <th className="text-center py-3 px-4 font-medium">Sessions</th>
              <th className="text-center py-3 px-4 font-medium">Tier</th>
              <th className="text-center py-3 px-4 font-medium">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user) => (
              <tr key={user.id} className="border-b border-slate-700/20 hover:bg-slate-800/30 transition">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-medium">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{user.name}</div>
                      <div className="text-slate-500 text-xs">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-slate-300 text-sm">
                    {new Date(user.lastActive).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {Math.floor((Date.now() - new Date(user.lastActive).getTime()) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="font-medium">{user.activityDecline}%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="text-slate-300 text-sm">
                    {user.recentSessions} <span className="text-slate-500">/ {user.previousAvgSessions} avg</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getTierBadgeColor(user.tier)}`}>
                    {user.tier}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getRiskBadgeColor(user.churnRisk)}`}>
                    {user.churnRisk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// FEATURE ADOPTION COMPONENT
// ============================================================================

function FeatureAdoptionChart({ data }: { data: FeatureUsage[] }) {
  const maxUsage = Math.max(...data.map(d => d.usageCount));

  if (!data.length) {
    return (
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">Feature Adoption</h3>
        </div>
        <EmptyState
          message="No feature usage data available"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    'Learning': 'from-cyan-500 to-blue-500',
    'Live': 'from-purple-500 to-pink-500',
    'Analytics': 'from-emerald-500 to-teal-500',
    'Achievements': 'from-yellow-500 to-orange-500',
    'Social': 'from-pink-500 to-rose-500',
    'Resources': 'from-indigo-500 to-purple-500',
    'Admin': 'from-slate-500 to-slate-600',
    'System': 'from-gray-500 to-gray-600',
  };

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Feature Adoption
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {data.map((feature) => (
          <div key={feature.feature} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium text-sm">{feature.feature}</span>
                <span className={`px-2 py-0.5 text-[10px] rounded-full bg-gradient-to-r ${categoryColors[feature.category] || 'from-slate-500 to-slate-600'} text-white`}>
                  {feature.category}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-400">{formatNumber(feature.uniqueUsers)} users</span>
                <span className="text-slate-400">{feature.avgSessionTime}m avg</span>
                <span className={`flex items-center gap-0.5 ${
                  feature.trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {feature.trend >= 0 ? '+' : ''}{feature.trend}%
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${categoryColors[feature.category] || 'from-slate-500 to-slate-600'} transition-all group-hover:opacity-80`}
                style={{ width: `${(feature.usageCount / maxUsage) * 100}%` }}
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-slate-500 text-xs">{formatNumber(feature.usageCount)} total uses</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// DATE RANGE SELECTOR
// ============================================================================

function DateRangeSelector({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onPresetSelect,
}: {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  onPresetSelect: (preset: string) => void;
}) {
  const presets = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Preset buttons */}
      <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onPresetSelect(preset.value)}
            className="px-3 py-1.5 text-sm rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
          >
            {preset.label}
          </button>
        ))}
      </div>
      {/* Custom date inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
        />
        <span className="text-slate-500">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
        />
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT TO CSV
// ============================================================================

function ExportButton({ data, filename }: { data: EngagementAnalytics | null; filename: string }) {
  const handleExport = () => {
    if (!data) return;

    // Prepare CSV content
    let csvContent = '';

    // Active Users section
    csvContent += 'ACTIVE USERS\n';
    csvContent += 'Metric,Value,Trend\n';
    csvContent += `DAU,${data.activeUsers.dau},${data.activeUsers.dauTrend}%\n`;
    csvContent += `WAU,${data.activeUsers.wau},${data.activeUsers.wauTrend}%\n`;
    csvContent += `MAU,${data.activeUsers.mau},${data.activeUsers.mauTrend}%\n`;
    csvContent += '\n';

    // Retention Cohorts section
    csvContent += 'RETENTION COHORTS\n';
    csvContent += 'Cohort,Size,Day 1,Day 7,Day 14,Day 30\n';
    data.retentionCohorts.forEach((cohort) => {
      csvContent += `${cohort.cohort},${cohort.cohortSize},${cohort.day1}%,${cohort.day7}%,${cohort.day14}%,${cohort.day30}%\n`;
    });
    csvContent += '\n';

    // At-Risk Users section
    csvContent += 'AT-RISK USERS\n';
    csvContent += 'Name,Email,Last Active,Activity Decline,Risk Level,Tier\n';
    data.atRiskUsers.forEach((user) => {
      csvContent += `${user.name},${user.email},${user.lastActive},${user.activityDecline}%,${user.churnRisk},${user.tier}\n`;
    });
    csvContent += '\n';

    // Feature Adoption section
    csvContent += 'FEATURE ADOPTION\n';
    csvContent += 'Feature,Category,Usage Count,Unique Users,Avg Session Time (min),Trend\n';
    data.featureAdoption.forEach((feature) => {
      csvContent += `${feature.feature},${feature.category},${feature.usageCount},${feature.uniqueUsers},${feature.avgSessionTime},${feature.trend}%\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!data}
      className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:text-white hover:border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Export CSV
    </button>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function EngagementDashboardPage() {
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/analytics/engagement?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePresetSelect = (preset: string) => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Engagement & Retention</h1>
          <p className="text-slate-400">Track user engagement patterns and identify retention opportunities.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            onPresetSelect={handlePresetSelect}
          />
          <ExportButton data={analytics} filename="engagement-analytics" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton height="h-96" />
            <ChartSkeleton height="h-96" />
          </div>
          <TableSkeleton />
          <ChartSkeleton height="h-80" />
        </div>
      )}

      {/* Main content */}
      {!loading && analytics && (
        <div className="space-y-6">
          {/* Active Users Card - Full width */}
          <ActiveUsersCard data={analytics.activeUsers} />

          {/* Two column layout for retention and heatmap */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <RetentionCurveChart data={analytics.retentionCohorts} />
            <EngagementHeatmap data={analytics.engagementHeatmap} />
          </div>

          {/* At-Risk Users Table */}
          <AtRiskUsersTable data={analytics.atRiskUsers} />

          {/* Feature Adoption */}
          <FeatureAdoptionChart data={analytics.featureAdoption} />
        </div>
      )}
    </div>
  );
}
