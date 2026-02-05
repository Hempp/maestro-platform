'use client';

/**
 * LEARNING EFFECTIVENESS DASHBOARD
 * Comprehensive analytics for learning outcomes, struggle patterns, and AI coaching
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CompletionMetrics {
  overallCompletionRate: number;
  avgTimeToComplete: number; // hours
  totalEnrollments: number;
  totalCompletions: number;
  previousPeriod: {
    completionRate: number;
    avgTimeToComplete: number;
  };
}

interface StruggleDistribution {
  ranges: {
    label: string;
    min: number;
    max: number;
    count: number;
    percentage: number;
  }[];
  average: number;
  median: number;
}

interface ModulePerformance {
  id: string;
  title: string;
  category: string;
  completionRate: number;
  avgStruggleScore: number;
  dropOffRate: number;
  avgTimeMinutes: number;
  totalAttempts: number;
  hintsUsedAvg: number;
}

interface CertificateVelocity {
  path: string;
  pathLabel: string;
  avgDaysToComplete: number;
  medianDaysToComplete: number;
  fastestCompletion: number;
  slowestCompletion: number;
  totalCertificates: number;
  previousPeriodAvg: number;
}

interface FunnelStage {
  stage: string;
  stageLabel: string;
  count: number;
  percentage: number;
  dropOffFromPrevious: number;
}

interface LearningPathFunnel {
  path: string;
  pathLabel: string;
  stages: FunnelStage[];
}

interface AICoachingStats {
  totalInteractions: number;
  uniqueUsers: number;
  avgInteractionsPerUser: number;
  topTopics: { topic: string; count: number; percentage: number }[];
  effectivenessRate: number;
  avgResponseHelpfulness: number;
  escalationRate: number;
  previousPeriod: {
    totalInteractions: number;
    effectivenessRate: number;
  };
}

interface LearningAnalytics {
  completion: CompletionMetrics;
  struggleDistribution: StruggleDistribution;
  modulePerformance: ModulePerformance[];
  certificateVelocity: CertificateVelocity[];
  learningPathFunnels: LearningPathFunnel[];
  aiCoaching: AICoachingStats;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-slate-700/50 rounded w-1/4 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
            <div className="h-4 bg-slate-700/50 rounded w-1/2 mb-3" />
            <div className="h-8 bg-slate-700/50 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate-700/50 rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 h-64" />
        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 h-64" />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  previousValue,
  unit = '',
  icon,
  color,
  trend
}: {
  label: string;
  value: string | number;
  previousValue?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const change = previousValue !== undefined && typeof value === 'number'
    ? ((value - previousValue) / (previousValue || 1) * 100).toFixed(1)
    : null;

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-slate-400 text-sm mb-1">{label}</div>
          <div className="text-2xl font-bold text-white">
            {value}{unit}
          </div>
          {change !== null && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${
              trend === 'up' ? 'text-emerald-400' :
              trend === 'down' ? 'text-red-400' :
              'text-slate-400'
            }`}>
              {trend === 'up' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {parseFloat(change) >= 0 ? '+' : ''}{change}% vs last period
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StruggleHistogram({ data }: { data: StruggleDistribution }) {
  const maxCount = Math.max(...data.ranges.map(r => r.count), 1);

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Struggle Score Distribution</h3>
          <p className="text-slate-500 text-sm">How learners are performing across the platform</p>
        </div>
        <div className="text-right">
          <div className="text-slate-400 text-sm">Average</div>
          <div className={`text-lg font-bold ${
            data.average <= 30 ? 'text-emerald-400' :
            data.average <= 60 ? 'text-yellow-400' :
            'text-red-400'
          }`}>{data.average}</div>
        </div>
      </div>

      <div className="flex items-end gap-2 h-40 mt-6">
        {data.ranges.map((range, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="text-xs text-slate-400">{range.count}</div>
            <div
              className={`w-full rounded-t transition-all hover:opacity-80 ${
                range.max <= 30 ? 'bg-emerald-500/70' :
                range.max <= 60 ? 'bg-yellow-500/70' :
                range.max <= 80 ? 'bg-orange-500/70' :
                'bg-red-500/70'
              }`}
              style={{ height: `${(range.count / maxCount) * 100}%`, minHeight: range.count > 0 ? '8px' : '0' }}
              title={`${range.label}: ${range.count} learners (${range.percentage}%)`}
            />
            <span className="text-[10px] text-slate-500 whitespace-nowrap">
              {range.label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500/70" />
          <span className="text-slate-400">Low struggle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500/70" />
          <span className="text-slate-400">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500/70" />
          <span className="text-slate-400">High struggle</span>
        </div>
      </div>
    </div>
  );
}

function ModulePerformanceTable({
  modules,
  onModuleClick
}: {
  modules: ModulePerformance[];
  onModuleClick: (module: ModulePerformance) => void;
}) {
  const [sortBy, setSortBy] = useState<keyof ModulePerformance>('dropOffRate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...modules].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const handleSort = (column: keyof ModulePerformance) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ column, label }: { column: keyof ModulePerformance; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === column && (
          <svg className={`w-3 h-3 ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="text-white font-semibold">Module Performance</h3>
        <p className="text-slate-500 text-sm">Click any row to see detailed analytics</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Module</th>
              <SortHeader column="completionRate" label="Completion" />
              <SortHeader column="avgStruggleScore" label="Avg Struggle" />
              <SortHeader column="dropOffRate" label="Drop-off" />
              <SortHeader column="avgTimeMinutes" label="Avg Time" />
              <SortHeader column="hintsUsedAvg" label="Hints Used" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sorted.map((module) => (
              <tr
                key={module.id}
                className="hover:bg-slate-800/50 cursor-pointer transition"
                onClick={() => onModuleClick(module)}
              >
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{module.title}</div>
                  <div className="text-slate-500 text-xs">{module.category}</div>
                </td>
                <td className="px-4 py-3">
                  <div className={`font-medium ${
                    module.completionRate >= 80 ? 'text-emerald-400' :
                    module.completionRate >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {module.completionRate}%
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`font-medium ${
                    module.avgStruggleScore <= 30 ? 'text-emerald-400' :
                    module.avgStruggleScore <= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {module.avgStruggleScore}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`font-medium ${
                    module.dropOffRate <= 10 ? 'text-emerald-400' :
                    module.dropOffRate <= 25 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {module.dropOffRate}%
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">{module.avgTimeMinutes}m</td>
                <td className="px-4 py-3 text-slate-300">{module.hintsUsedAvg.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CertificateVelocityChart({ data }: { data: CertificateVelocity[] }) {
  const maxDays = Math.max(...data.map(d => d.slowestCompletion), 1);

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-white font-semibold mb-1">Certificate Velocity</h3>
      <p className="text-slate-500 text-sm mb-6">Time from enrollment to certificate by path</p>

      <div className="space-y-6">
        {data.map((item) => {
          const change = ((item.avgDaysToComplete - item.previousPeriodAvg) / (item.previousPeriodAvg || 1) * 100);
          const isImproved = change < 0;

          return (
            <div key={item.path}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-white font-medium">{item.pathLabel}</span>
                  <span className="text-slate-500 text-sm ml-2">({item.totalCertificates} certs)</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{item.avgDaysToComplete}d</span>
                  <span className="text-slate-500 text-sm ml-1">avg</span>
                  <div className={`text-xs ${isImproved ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isImproved ? '' : '+'}{change.toFixed(0)}% vs last period
                  </div>
                </div>
              </div>

              <div className="relative h-6 bg-slate-700/30 rounded-full overflow-hidden">
                {/* Fastest marker */}
                <div
                  className="absolute top-0 h-full w-1 bg-emerald-500"
                  style={{ left: `${(item.fastestCompletion / maxDays) * 100}%` }}
                  title={`Fastest: ${item.fastestCompletion} days`}
                />
                {/* Average bar */}
                <div
                  className={`absolute top-1 h-4 rounded-full ${
                    item.path === 'student' ? 'bg-purple-500/70' :
                    item.path === 'employee' ? 'bg-blue-500/70' :
                    'bg-emerald-500/70'
                  }`}
                  style={{
                    left: `${(item.fastestCompletion / maxDays) * 100}%`,
                    width: `${((item.avgDaysToComplete - item.fastestCompletion) / maxDays) * 100}%`
                  }}
                />
                {/* Slowest marker */}
                <div
                  className="absolute top-0 h-full w-1 bg-red-500"
                  style={{ left: `${Math.min((item.slowestCompletion / maxDays) * 100, 100)}%` }}
                  title={`Slowest: ${item.slowestCompletion} days`}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Fastest: {item.fastestCompletion}d</span>
                <span>Median: {item.medianDaysToComplete}d</span>
                <span>Slowest: {item.slowestCompletion}d</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LearningFunnel({ funnels, selectedPath, onPathChange }: {
  funnels: LearningPathFunnel[];
  selectedPath: string;
  onPathChange: (path: string) => void;
}) {
  const funnel = funnels.find(f => f.path === selectedPath) || funnels[0];
  if (!funnel) return null;

  const maxCount = Math.max(...funnel.stages.map(s => s.count), 1);

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Learning Path Funnel</h3>
          <p className="text-slate-500 text-sm">Drop-off at each stage</p>
        </div>
        <select
          value={selectedPath}
          onChange={(e) => onPathChange(e.target.value)}
          className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
        >
          {funnels.map((f) => (
            <option key={f.path} value={f.path}>{f.pathLabel}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {funnel.stages.map((stage, i) => (
          <div key={stage.stage}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300 text-sm">{stage.stageLabel}</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{stage.count}</span>
                <span className="text-slate-500 text-sm">({stage.percentage}%)</span>
                {i > 0 && stage.dropOffFromPrevious > 0 && (
                  <span className="text-red-400 text-xs">-{stage.dropOffFromPrevious}%</span>
                )}
              </div>
            </div>
            <div className="h-8 bg-slate-700/30 rounded-lg overflow-hidden relative">
              <div
                className={`h-full transition-all ${
                  i === 0 ? 'bg-cyan-500/70' :
                  i === funnel.stages.length - 1 ? 'bg-emerald-500/70' :
                  'bg-blue-500/70'
                }`}
                style={{ width: `${(stage.count / maxCount) * 100}%` }}
              />
              {i < funnel.stages.length - 1 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Overall Conversion</span>
          <span className={`font-bold ${
            funnel.stages[funnel.stages.length - 1]?.percentage >= 50 ? 'text-emerald-400' :
            funnel.stages[funnel.stages.length - 1]?.percentage >= 25 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {funnel.stages[funnel.stages.length - 1]?.percentage || 0}%
          </span>
        </div>
      </div>
    </div>
  );
}

function AICoachingCard({ stats }: { stats: AICoachingStats }) {
  const interactionChange = ((stats.totalInteractions - stats.previousPeriod.totalInteractions) / (stats.previousPeriod.totalInteractions || 1) * 100);
  const effectivenessChange = stats.effectivenessRate - stats.previousPeriod.effectivenessRate;

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-white font-semibold mb-1">AI Coaching Stats</h3>
      <p className="text-slate-500 text-sm mb-6">Socratic tutor performance metrics</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Total Interactions</div>
          <div className="text-xl font-bold text-white">{stats.totalInteractions.toLocaleString()}</div>
          <div className={`text-xs ${interactionChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {interactionChange >= 0 ? '+' : ''}{interactionChange.toFixed(0)}%
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Effectiveness Rate</div>
          <div className="text-xl font-bold text-emerald-400">{stats.effectivenessRate}%</div>
          <div className={`text-xs ${effectivenessChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {effectivenessChange >= 0 ? '+' : ''}{effectivenessChange.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Avg per User</div>
          <div className="text-xl font-bold text-white">{stats.avgInteractionsPerUser.toFixed(1)}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Escalation Rate</div>
          <div className={`text-xl font-bold ${stats.escalationRate <= 10 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {stats.escalationRate}%
          </div>
        </div>
      </div>

      <div>
        <div className="text-slate-400 text-sm mb-3">Top Topics</div>
        <div className="space-y-2">
          {stats.topTopics.slice(0, 5).map((topic, i) => (
            <div key={topic.topic} className="flex items-center gap-3">
              <span className="text-slate-500 text-sm w-4">{i + 1}.</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 text-sm">{topic.topic}</span>
                  <span className="text-slate-400 text-xs">{topic.count} ({topic.percentage}%)</span>
                </div>
                <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500/70 rounded-full"
                    style={{ width: `${topic.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleDetailModal({
  module,
  onClose
}: {
  module: ModulePerformance;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d21] rounded-xl border border-slate-700/50 max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-slate-700/50 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{module.title}</h2>
            <p className="text-slate-400 text-sm">{module.category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Completion Rate</div>
              <div className={`text-2xl font-bold ${
                module.completionRate >= 80 ? 'text-emerald-400' :
                module.completionRate >= 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>{module.completionRate}%</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Avg Struggle Score</div>
              <div className={`text-2xl font-bold ${
                module.avgStruggleScore <= 30 ? 'text-emerald-400' :
                module.avgStruggleScore <= 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>{module.avgStruggleScore}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Drop-off Rate</div>
              <div className={`text-2xl font-bold ${
                module.dropOffRate <= 10 ? 'text-emerald-400' :
                module.dropOffRate <= 25 ? 'text-yellow-400' :
                'text-red-400'
              }`}>{module.dropOffRate}%</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Avg Time</div>
              <div className="text-2xl font-bold text-white">{module.avgTimeMinutes}m</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Total Attempts</div>
              <div className="text-2xl font-bold text-white">{module.totalAttempts}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm mb-1">Avg Hints Used</div>
              <div className="text-2xl font-bold text-white">{module.hintsUsedAvg.toFixed(1)}</div>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
            <h4 className="text-white font-medium mb-3">Recommendations</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              {module.dropOffRate > 25 && (
                <li className="flex items-start gap-2">
                  <span className="text-red-400">*</span>
                  High drop-off detected. Consider simplifying the content or adding more scaffolding.
                </li>
              )}
              {module.avgStruggleScore > 60 && (
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">*</span>
                  Learners are struggling. Review prerequisite knowledge requirements.
                </li>
              )}
              {module.hintsUsedAvg > 2 && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">*</span>
                  High hint usage suggests content may need clearer explanations.
                </li>
              )}
              {module.avgTimeMinutes > 30 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">*</span>
                  Module taking longer than expected. Consider breaking into smaller units.
                </li>
              )}
              {module.completionRate >= 80 && module.avgStruggleScore <= 30 && (
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">*</span>
                  This module is performing well! Consider using it as a template.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LearningEffectivenessDashboard() {
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState(30);
  const [selectedPath, setSelectedPath] = useState('all');
  const [selectedFunnelPath, setSelectedFunnelPath] = useState('student');

  // Module detail modal
  const [selectedModule, setSelectedModule] = useState<ModulePerformance | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        days: dateRange.toString(),
        ...(selectedPath !== 'all' && { path: selectedPath }),
      });

      const response = await fetch(`/api/admin/analytics/learning?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch learning analytics');
      }

      const data = await response.json();
      setAnalytics(data);

      // Set default funnel path if available
      if (data.learningPathFunnels?.length > 0 && !data.learningPathFunnels.find((f: LearningPathFunnel) => f.path === selectedFunnelPath)) {
        setSelectedFunnelPath(data.learningPathFunnels[0].path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedPath, selectedFunnelPath]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <div className="text-red-400 mb-2">{error}</div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-slate-400 text-center">No data available</div>
      </div>
    );
  }

  const completionTrend = analytics.completion.overallCompletionRate >= analytics.completion.previousPeriod.completionRate ? 'up' : 'down';
  const timeTrend = analytics.completion.avgTimeToComplete <= analytics.completion.previousPeriod.avgTimeToComplete ? 'up' : 'down';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/analytics" className="text-slate-400 hover:text-white transition">
              Analytics
            </Link>
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white">Learning Effectiveness</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Learning Effectiveness Dashboard</h1>
          <p className="text-slate-400">Monitor learning outcomes, identify struggling learners, and optimize content.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Paths</option>
            <option value="student">AI Associate</option>
            <option value="employee">Efficiency Lead</option>
            <option value="owner">Operations Master</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>

          <button
            onClick={fetchAnalytics}
            className="p-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white hover:border-slate-600/50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Completion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Overall Completion Rate"
          value={analytics.completion.overallCompletionRate}
          previousValue={analytics.completion.previousPeriod.completionRate}
          unit="%"
          trend={completionTrend}
          color="bg-emerald-500/20"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Avg Time to Complete"
          value={analytics.completion.avgTimeToComplete}
          previousValue={analytics.completion.previousPeriod.avgTimeToComplete}
          unit="h"
          trend={timeTrend}
          color="bg-blue-500/20"
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Total Enrollments"
          value={analytics.completion.totalEnrollments.toLocaleString()}
          color="bg-purple-500/20"
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        <MetricCard
          label="Total Completions"
          value={analytics.completion.totalCompletions.toLocaleString()}
          color="bg-cyan-500/20"
          icon={
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
      </div>

      {/* Row: Struggle Distribution + Certificate Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <StruggleHistogram data={analytics.struggleDistribution} />
        <CertificateVelocityChart data={analytics.certificateVelocity} />
      </div>

      {/* Module Performance Table */}
      <div className="mb-8">
        <ModulePerformanceTable
          modules={analytics.modulePerformance}
          onModuleClick={setSelectedModule}
        />
      </div>

      {/* Row: Learning Funnel + AI Coaching */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LearningFunnel
          funnels={analytics.learningPathFunnels}
          selectedPath={selectedFunnelPath}
          onPathChange={setSelectedFunnelPath}
        />
        <AICoachingCard stats={analytics.aiCoaching} />
      </div>

      {/* Module Detail Modal */}
      {selectedModule && (
        <ModuleDetailModal
          module={selectedModule}
          onClose={() => setSelectedModule(null)}
        />
      )}
    </div>
  );
}
