'use client';

/**
 * REVENUE INTELLIGENCE DASHBOARD
 * Comprehensive revenue analytics for Phazur admin portal
 */

import { useEffect, useState, useMemo } from 'react';

// Types
interface TierBreakdown {
  student: number;
  employee: number;
  owner: number;
}

interface MRROverview {
  currentMRR: number;
  previousMRR: number;
  growthRate: number;
  growthRateMoM: number;
  growthRateYoY: number;
  breakdown: TierBreakdown;
  subscriberCounts: TierBreakdown;
}

interface RevenueTrendPoint {
  date: string;
  total: number;
  student: number;
  employee: number;
  owner: number;
}

interface SubscriptionFlow {
  newSubscriptions: number;
  upgrades: number;
  downgrades: number;
  churns: number;
  reactivations: number;
}

interface CohortLTV {
  cohort: string;
  subscribers: number;
  avgLTV: number;
  avgLifespanMonths: number;
  retentionRate: number;
}

interface ChurnAnalysis {
  overallRate: number;
  byTier: {
    student: { rate: number; count: number };
    employee: { rate: number; count: number };
    owner: { rate: number; count: number };
  };
  topReasons: Array<{ reason: string; percentage: number }>;
}

interface TierTransition {
  from: string;
  to: string;
  count: number;
  percentage: number;
}

interface RevenueData {
  mrr: MRROverview;
  trend: RevenueTrendPoint[];
  flow: SubscriptionFlow;
  distribution: TierBreakdown;
  cohorts: CohortLTV[];
  churn: ChurnAnalysis;
  transitions: TierTransition[];
  period: { start: string; end: string };
}

// Tier configuration
const TIER_CONFIG = {
  student: { price: 49, label: 'Student', color: '#a855f7' },
  employee: { price: 199, label: 'Employee', color: '#3b82f6' },
  owner: { price: 499, label: 'Owner', color: '#10b981' },
};

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
function formatPercent(value: number, includeSign = false): string {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// Stat Card Component
function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  color,
  subValue,
}: {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  subValue?: string;
}) {
  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-slate-400 text-sm mb-1">{label}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {subValue && <div className="text-slate-500 text-xs mt-1">{subValue}</div>}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium ${
                  change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-slate-400'
                }`}
              >
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              {changeLabel && <span className="text-slate-500 text-xs">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// MRR Breakdown Card
function MRRBreakdownCard({ mrr }: { mrr: MRROverview }) {
  const tiers = [
    { key: 'student' as const, ...TIER_CONFIG.student },
    { key: 'employee' as const, ...TIER_CONFIG.employee },
    { key: 'owner' as const, ...TIER_CONFIG.owner },
  ];

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">MRR Overview</h3>
          <p className="text-slate-500 text-sm">Monthly Recurring Revenue</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{formatCurrency(mrr.currentMRR)}</div>
          <div
            className={`text-sm ${mrr.growthRate > 0 ? 'text-emerald-400' : mrr.growthRate < 0 ? 'text-red-400' : 'text-slate-400'}`}
          >
            {formatPercent(mrr.growthRate, true)} MoM
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {tiers.map((tier) => {
          const revenue = mrr.breakdown[tier.key];
          const count = mrr.subscriberCounts[tier.key];
          const percentage = mrr.currentMRR > 0 ? (revenue / mrr.currentMRR) * 100 : 0;

          return (
            <div key={tier.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="text-slate-400">
                    {tier.label} (${tier.price}/mo)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{count} subs</span>
                  <span className="text-white font-medium">{formatCurrency(revenue)}</span>
                </div>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%`, backgroundColor: tier.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between text-sm">
        <div>
          <span className="text-slate-500">YoY Growth</span>
          <span
            className={`ml-2 font-medium ${mrr.growthRateYoY > 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {formatPercent(mrr.growthRateYoY, true)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Total Subscribers</span>
          <span className="ml-2 text-white font-medium">
            {mrr.subscriberCounts.student + mrr.subscriberCounts.employee + mrr.subscriberCounts.owner}
          </span>
        </div>
      </div>
    </div>
  );
}

// Revenue Trend Line Chart
function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { maxValue, points, chartWidth, chartHeight, padding } = useMemo(() => {
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = 800;
    const chartHeight = 300;
    const maxValue = Math.max(...data.map((d) => d.total)) * 1.1;

    const xScale = (chartWidth - padding.left - padding.right) / (data.length - 1 || 1);
    const yScale = (chartHeight - padding.top - padding.bottom) / maxValue;

    const points = {
      total: data.map((d, i) => ({
        x: padding.left + i * xScale,
        y: chartHeight - padding.bottom - d.total * yScale,
        value: d.total,
        date: d.date,
      })),
      student: data.map((d, i) => ({
        x: padding.left + i * xScale,
        y: chartHeight - padding.bottom - d.student * yScale,
        value: d.student,
      })),
      employee: data.map((d, i) => ({
        x: padding.left + i * xScale,
        y: chartHeight - padding.bottom - d.employee * yScale,
        value: d.employee,
      })),
      owner: data.map((d, i) => ({
        x: padding.left + i * xScale,
        y: chartHeight - padding.bottom - d.owner * yScale,
        value: d.owner,
      })),
    };

    return { maxValue, points, chartWidth, chartHeight, padding };
  }, [data]);

  const createPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    return pts.reduce((path, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`), '');
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    value: Math.round(maxValue * t),
    y: chartHeight - padding.bottom - maxValue * t * ((chartHeight - padding.top - padding.bottom) / maxValue),
  }));

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Revenue Trend</h3>
          <p className="text-slate-500 text-sm">MRR over time by tier</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-cyan-400 rounded" />
            <span className="text-slate-400">Total</span>
          </div>
          {Object.entries(TIER_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: config.color }} />
              <span className="text-slate-400">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-h-[200px]">
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={chartWidth - padding.right}
                y2={tick.y}
                stroke="#334155"
                strokeDasharray="4 4"
              />
              <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" className="fill-slate-500 text-xs">
                ${(tick.value / 1000).toFixed(0)}k
              </text>
            </g>
          ))}

          {/* Tier lines */}
          <path d={createPath(points.student)} fill="none" stroke={TIER_CONFIG.student.color} strokeWidth="1.5" strokeOpacity="0.6" />
          <path d={createPath(points.employee)} fill="none" stroke={TIER_CONFIG.employee.color} strokeWidth="1.5" strokeOpacity="0.6" />
          <path d={createPath(points.owner)} fill="none" stroke={TIER_CONFIG.owner.color} strokeWidth="1.5" strokeOpacity="0.6" />

          {/* Total line */}
          <path d={createPath(points.total)} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

          {/* Hover points and labels */}
          {points.total.map((point, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              <circle cx={point.x} cy={point.y} r={hoveredIndex === i ? 6 : 4} className="fill-cyan-400" />
              {hoveredIndex === i && (
                <g>
                  <rect
                    x={point.x - 50}
                    y={point.y - 50}
                    width="100"
                    height="40"
                    rx="4"
                    className="fill-slate-800"
                  />
                  <text x={point.x} y={point.y - 32} textAnchor="middle" className="fill-white text-xs font-medium">
                    {formatCurrency(point.value)}
                  </text>
                  <text x={point.x} y={point.y - 18} textAnchor="middle" className="fill-slate-400 text-xs">
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* X-axis labels */}
          {points.total.filter((_, i) => i % Math.ceil(points.total.length / 6) === 0).map((point, i) => (
            <text
              key={i}
              x={point.x}
              y={chartHeight - 10}
              textAnchor="middle"
              className="fill-slate-500 text-xs"
            >
              {new Date(point.date).toLocaleDateString('en-US', { month: 'short' })}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// Subscription Flow Sankey
function SubscriptionFlowCard({ flow }: { flow: SubscriptionFlow }) {
  const items = [
    { label: 'New Subscriptions', value: flow.newSubscriptions, color: '#10b981', icon: '++' },
    { label: 'Upgrades', value: flow.upgrades, color: '#3b82f6', icon: '+' },
    { label: 'Downgrades', value: flow.downgrades, color: '#f59e0b', icon: '-' },
    { label: 'Churns', value: flow.churns, color: '#ef4444', icon: '--' },
    { label: 'Reactivations', value: flow.reactivations, color: '#8b5cf6', icon: '+' },
  ];

  const netChange =
    flow.newSubscriptions + flow.upgrades + flow.reactivations - flow.downgrades - flow.churns;

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Subscription Flow</h3>
          <p className="text-slate-500 text-sm">This period&apos;s movement</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            netChange > 0 ? 'bg-emerald-500/20 text-emerald-400' : netChange < 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
          }`}
        >
          Net: {netChange > 0 ? '+' : ''}
          {netChange}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: `${item.color}20`, color: item.color }}
            >
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">{item.label}</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((item.value / Math.max(...items.map((i) => i.value), 1)) * 100, 100)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tier Distribution Pie Chart
function TierDistributionChart({ distribution }: { distribution: TierBreakdown }) {
  const total = distribution.student + distribution.employee + distribution.owner;
  const tiers = [
    { key: 'student' as const, ...TIER_CONFIG.student, count: distribution.student },
    { key: 'employee' as const, ...TIER_CONFIG.employee, count: distribution.employee },
    { key: 'owner' as const, ...TIER_CONFIG.owner, count: distribution.owner },
  ];

  // Create pie segments
  const segments = useMemo(() => {
    let currentAngle = -90;
    return tiers.map((tier) => {
      const percentage = total > 0 ? (tier.count / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const largeArc = angle > 180 ? 1 : 0;

      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);

      const path = percentage > 0 ? `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z` : '';

      return { ...tier, percentage, path };
    });
  }, [tiers, total]);

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-white font-semibold mb-4">Tier Distribution</h3>

      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {segments.map(
              (segment) =>
                segment.path && (
                  <path
                    key={segment.key}
                    d={segment.path}
                    fill={segment.color}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                )
            )}
            <circle cx="50" cy="50" r="25" className="fill-slate-800" />
            <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="fill-white text-lg font-bold">
              {total}
            </text>
            <text x="50" y="62" textAnchor="middle" className="fill-slate-500 text-xs">
              subs
            </text>
          </svg>
        </div>

        <div className="flex-1 space-y-3">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="text-slate-400 text-sm">{segment.label}</span>
              </div>
              <div className="text-right">
                <span className="text-white font-medium">{segment.count}</span>
                <span className="text-slate-500 text-sm ml-2">({segment.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Cohort LTV Table
function CohortLTVTable({ cohorts }: { cohorts: CohortLTV[] }) {
  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-5 border-b border-slate-700/50">
        <h3 className="text-white font-semibold">Cohort Lifetime Value</h3>
        <p className="text-slate-500 text-sm">LTV by signup month</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">Cohort</th>
              <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">Subscribers</th>
              <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">Avg LTV</th>
              <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">Avg Lifespan</th>
              <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">Retention</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort, i) => (
              <tr key={cohort.cohort} className={i % 2 === 0 ? 'bg-slate-800/20' : ''}>
                <td className="text-white font-medium px-5 py-3">{cohort.cohort}</td>
                <td className="text-slate-300 text-right px-5 py-3">{cohort.subscribers}</td>
                <td className="text-emerald-400 font-medium text-right px-5 py-3">
                  {formatCurrency(cohort.avgLTV)}
                </td>
                <td className="text-slate-300 text-right px-5 py-3">{cohort.avgLifespanMonths} mo</td>
                <td className="text-right px-5 py-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      cohort.retentionRate >= 90
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : cohort.retentionRate >= 70
                          ? 'bg-blue-500/20 text-blue-400'
                          : cohort.retentionRate >= 50
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {cohort.retentionRate}%
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

// Churn Analysis Card
function ChurnAnalysisCard({ churn }: { churn: ChurnAnalysis }) {
  const tiers = [
    { key: 'student' as const, ...TIER_CONFIG.student, ...churn.byTier.student },
    { key: 'employee' as const, ...TIER_CONFIG.employee, ...churn.byTier.employee },
    { key: 'owner' as const, ...TIER_CONFIG.owner, ...churn.byTier.owner },
  ];

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Churn Analysis</h3>
          <p className="text-slate-500 text-sm">Monthly churn breakdown</p>
        </div>
        <div
          className={`text-2xl font-bold ${
            churn.overallRate <= 3 ? 'text-emerald-400' : churn.overallRate <= 5 ? 'text-yellow-400' : 'text-red-400'
          }`}
        >
          {churn.overallRate.toFixed(1)}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {tiers.map((tier) => (
          <div key={tier.key} className="text-center p-3 bg-slate-800/50 rounded-lg">
            <div className="text-lg font-bold" style={{ color: tier.color }}>
              {tier.rate.toFixed(1)}%
            </div>
            <div className="text-slate-500 text-xs">{tier.label}</div>
            <div className="text-slate-600 text-xs">{tier.count} churned</div>
          </div>
        ))}
      </div>

      {churn.topReasons.length > 0 && (
        <div className="border-t border-slate-700/50 pt-4">
          <div className="text-slate-400 text-sm mb-2">Top Churn Reasons</div>
          <div className="space-y-2">
            {churn.topReasons.map((reason, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{reason.reason}</span>
                <span className="text-slate-500">{reason.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Tier Transitions Card
function TierTransitionsCard({ transitions }: { transitions: TierTransition[] }) {
  const upgrades = transitions.filter(
    (t) =>
      (t.from === 'student' && t.to === 'employee') ||
      (t.from === 'student' && t.to === 'owner') ||
      (t.from === 'employee' && t.to === 'owner')
  );

  const downgrades = transitions.filter(
    (t) =>
      (t.from === 'owner' && t.to === 'employee') ||
      (t.from === 'owner' && t.to === 'student') ||
      (t.from === 'employee' && t.to === 'student')
  );

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-white font-semibold mb-4">Tier Transitions</h3>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-emerald-400 text-sm font-medium mb-3">Upgrades</div>
          <div className="space-y-2">
            {upgrades.length > 0 ? (
              upgrades.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 bg-emerald-500/10 rounded">
                  <span className="text-slate-300">
                    {TIER_CONFIG[t.from as keyof typeof TIER_CONFIG]?.label || t.from} {'->'}
                    {TIER_CONFIG[t.to as keyof typeof TIER_CONFIG]?.label || t.to}
                  </span>
                  <span className="text-emerald-400 font-medium">{t.count}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm">No upgrades this period</div>
            )}
          </div>
        </div>

        <div>
          <div className="text-red-400 text-sm font-medium mb-3">Downgrades</div>
          <div className="space-y-2">
            {downgrades.length > 0 ? (
              downgrades.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 bg-red-500/10 rounded">
                  <span className="text-slate-300">
                    {TIER_CONFIG[t.from as keyof typeof TIER_CONFIG]?.label || t.from} {'->'}
                    {TIER_CONFIG[t.to as keyof typeof TIER_CONFIG]?.label || t.to}
                  </span>
                  <span className="text-red-400 font-medium">{t.count}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-sm">No downgrades this period</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export Button
function ExportButton({ data }: { data: RevenueData }) {
  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      period: data.period,
      mrr: data.mrr,
      distribution: data.distribution,
      flow: data.flow,
      churn: data.churn,
      cohorts: data.cohorts,
      transitions: data.transitions,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:text-white hover:border-cyan-500/50 transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export Report
    </button>
  );
}

// Main Dashboard Component
export default function RevenueIntelligenceDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30');
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          days: dateRange,
          ...(tierFilter !== 'all' && { tier: tierFilter }),
        });

        const response = await fetch(`/api/admin/analytics/revenue?${params}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch revenue data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [dateRange, tierFilter]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-400">Loading revenue analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <div className="text-red-400 font-medium mb-2">Error Loading Data</div>
          <div className="text-slate-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-slate-400 text-center">No revenue data available</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Revenue Intelligence</h1>
          <p className="text-slate-400">
            Comprehensive revenue analytics and subscription insights
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Tiers</option>
            <option value="student">Student ($49)</option>
            <option value="employee">Employee ($199)</option>
            <option value="owner">Owner ($499)</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>

          <ExportButton data={data} />
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Monthly Recurring Revenue"
          value={formatCurrency(data.mrr.currentMRR)}
          change={data.mrr.growthRateMoM}
          changeLabel="vs last month"
          color="bg-emerald-500/20"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Subscribers"
          value={data.mrr.subscriberCounts.student + data.mrr.subscriberCounts.employee + data.mrr.subscriberCounts.owner}
          subValue={`ARPU: ${formatCurrency(data.mrr.currentMRR / Math.max(data.mrr.subscriberCounts.student + data.mrr.subscriberCounts.employee + data.mrr.subscriberCounts.owner, 1))}`}
          color="bg-blue-500/20"
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Net New MRR"
          value={formatCurrency(data.mrr.currentMRR - data.mrr.previousMRR)}
          change={data.mrr.growthRate}
          changeLabel="growth"
          color="bg-cyan-500/20"
          icon={
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatCard
          label="Churn Rate"
          value={`${data.churn.overallRate.toFixed(1)}%`}
          subValue={`${data.churn.byTier.student.count + data.churn.byTier.employee.count + data.churn.byTier.owner.count} churned this period`}
          color="bg-red-500/20"
          icon={
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          }
        />
      </div>

      {/* MRR Overview and Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <MRRBreakdownCard mrr={data.mrr} />
        <div className="lg:col-span-2">
          <RevenueTrendChart data={data.trend} />
        </div>
      </div>

      {/* Flow and Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SubscriptionFlowCard flow={data.flow} />
        <TierDistributionChart distribution={data.distribution} />
      </div>

      {/* Cohort LTV Table */}
      <div className="mb-8">
        <CohortLTVTable cohorts={data.cohorts} />
      </div>

      {/* Churn and Transitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChurnAnalysisCard churn={data.churn} />
        <TierTransitionsCard transitions={data.transitions} />
      </div>
    </div>
  );
}
