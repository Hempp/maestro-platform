'use client';

/**
 * ADMIN ANALYTICS PAGE
 * Platform-wide analytics and insights
 */

import { useEffect, useState } from 'react';

interface Analytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersInPeriod: number;
    totalCertificates: number;
    totalAkusCompleted: number;
    totalLearningHours: number;
    avgStruggleScore: number;
  };
  courses: {
    totalCourses: number;
    totalSessions: number;
    upcomingSessions: number;
  };
  breakdown: {
    usersByTier: { student: number; employee: number; owner: number };
    certificatesByType: { student: number; employee: number; owner: number };
  };
  trends: {
    signupsByDay: Record<string, number>;
  };
  insights: {
    topPerformers: Array<{
      current_streak: number;
      total_learning_time: number;
      user: { id: string; full_name: string; email: string; tier: string };
    }>;
    strugglingStudents: Array<{
      struggle_score: number;
      last_activity_at: string;
      user: { id: string; full_name: string; email: string };
    }>;
  };
}

function StatCard({ label, value, change, icon, color }: {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-slate-400 text-sm mb-1">{label}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {change && (
            <div className={`text-xs mt-1 ${change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
              {change}
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

function SimpleBarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const entries = Object.entries(data).slice(-14); // Last 14 days
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-white font-semibold mb-4">{label}</h3>
      <div className="flex items-end gap-1 h-32">
        {entries.map(([date, value]) => (
          <div
            key={date}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full bg-cyan-500/50 rounded-t hover:bg-cyan-500/70 transition"
              style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
              title={`${date}: ${value}`}
            />
            <span className="text-[9px] text-slate-500 -rotate-45 origin-center">
              {new Date(date).getDate()}
            </span>
          </div>
        ))}
      </div>
      <div className="text-center text-slate-500 text-xs mt-2">Last 14 days</div>
    </div>
  );
}

function TierDistribution({ data }: { data: { student: number; employee: number; owner: number } }) {
  const total = data.student + data.employee + data.owner;
  const percentages = {
    student: total ? Math.round((data.student / total) * 100) : 0,
    employee: total ? Math.round((data.employee / total) * 100) : 0,
    owner: total ? Math.round((data.owner / total) * 100) : 0,
  };

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
      <h3 className="text-white font-semibold mb-4">User Distribution</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Student</span>
            <span className="text-purple-400">{data.student} ({percentages.student}%)</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${percentages.student}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Employee</span>
            <span className="text-blue-400">{data.employee} ({percentages.employee}%)</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percentages.employee}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Owner</span>
            <span className="text-emerald-400">{data.owner} ({percentages.owner}%)</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percentages.owner}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/analytics?days=${days}`);
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
      setLoading(false);
    }

    fetchAnalytics();
  }, [days]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Failed to load analytics</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-slate-400">Platform performance and insights.</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={analytics.overview.totalUsers}
          change={`+${analytics.overview.newUsersInPeriod} this period`}
          color="bg-blue-500/20"
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Active Users"
          value={analytics.overview.activeUsers}
          change="Last 7 days"
          color="bg-emerald-500/20"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          }
        />
        <StatCard
          label="Certificates"
          value={analytics.overview.totalCertificates}
          color="bg-purple-500/20"
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <StatCard
          label="Learning Hours"
          value={analytics.overview.totalLearningHours}
          color="bg-cyan-500/20"
          icon={
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SimpleBarChart data={analytics.trends.signupsByDay} label="New Signups" />
        <TierDistribution data={analytics.breakdown.usersByTier} />
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 text-center">
          <div className="text-3xl font-bold text-white">{analytics.courses.totalCourses}</div>
          <div className="text-slate-400 text-sm">Active Courses</div>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 text-center">
          <div className="text-3xl font-bold text-white">{analytics.courses.totalSessions}</div>
          <div className="text-slate-400 text-sm">Total Sessions</div>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 text-center">
          <div className="text-3xl font-bold text-cyan-400">{analytics.courses.upcomingSessions}</div>
          <div className="text-slate-400 text-sm">Upcoming Sessions</div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-white font-semibold">Top Performers</h3>
            <p className="text-slate-500 text-sm">Highest learning streaks</p>
          </div>
          <div className="p-4">
            {analytics.insights.topPerformers.length === 0 ? (
              <div className="text-slate-500 text-center py-4">No data yet</div>
            ) : (
              <div className="space-y-3">
                {analytics.insights.topPerformers.map((performer, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                      {performer.user?.full_name?.[0] || performer.user?.email?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {performer.user?.full_name || performer.user?.email}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {Math.round(performer.total_learning_time / 60)}h learning time
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-semibold">{performer.current_streak}</div>
                      <div className="text-slate-500 text-xs">day streak</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-white font-semibold">Needs Attention</h3>
            <p className="text-slate-500 text-sm">High struggle scores</p>
          </div>
          <div className="p-4">
            {analytics.insights.strugglingStudents.length === 0 ? (
              <div className="text-slate-500 text-center py-4">All students on track!</div>
            ) : (
              <div className="space-y-3">
                {analytics.insights.strugglingStudents.map((student, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm font-medium">
                      {student.user?.full_name?.[0] || student.user?.email?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {student.user?.full_name || student.user?.email}
                      </div>
                      <div className="text-slate-500 text-xs">
                        Last active: {student.last_activity_at
                          ? new Date(student.last_activity_at).toLocaleDateString()
                          : 'Never'}
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-sm">
                      {student.struggle_score}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-8 bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <h3 className="text-white font-semibold mb-4">Certificates by Type</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400">{analytics.breakdown.certificatesByType.student}</div>
            <div className="text-slate-400 text-sm">AI Associate</div>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-3xl font-bold text-blue-400">{analytics.breakdown.certificatesByType.employee}</div>
            <div className="text-slate-400 text-sm">Efficiency Lead</div>
          </div>
          <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="text-3xl font-bold text-emerald-400">{analytics.breakdown.certificatesByType.owner}</div>
            <div className="text-slate-400 text-sm">Operations Master</div>
          </div>
        </div>
      </div>
    </div>
  );
}
