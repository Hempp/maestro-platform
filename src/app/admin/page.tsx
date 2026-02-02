'use client';

/**
 * ADMIN DASHBOARD HOME
 * Overview stats and quick actions
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  insights: {
    topPerformers: Array<{
      current_streak: number;
      user: { full_name: string; email: string; tier: string };
    }>;
    strugglingStudents: Array<{
      struggle_score: number;
      user: { full_name: string; email: string };
    }>;
  };
}

interface Session {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  google_meet_link: string;
  course: { title: string };
  enrollmentCount: number;
}

function StatCard({ label, value, subtext, icon, color }: {
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
          {subtext && <div className="text-slate-500 text-xs mt-1">{subtext}</div>}
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsRes, sessionsRes] = await Promise.all([
          fetch('/api/admin/analytics'),
          fetch('/api/admin/sessions?upcoming=true'),
        ]);

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data);
        }

        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setUpcomingSessions(data.sessions?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Welcome back. Here&apos;s what&apos;s happening on your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Students"
          value={analytics?.overview.totalUsers || 0}
          subtext={`${analytics?.overview.activeUsers || 0} active this week`}
          color="bg-blue-500/20"
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Certificates Issued"
          value={analytics?.overview.totalCertificates || 0}
          subtext="All time"
          color="bg-emerald-500/20"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <StatCard
          label="Live Courses"
          value={analytics?.courses.totalCourses || 0}
          subtext={`${analytics?.courses.upcomingSessions || 0} upcoming sessions`}
          color="bg-purple-500/20"
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Learning Hours"
          value={analytics?.overview.totalLearningHours || 0}
          subtext="Total platform hours"
          color="bg-cyan-500/20"
          icon={
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/live"
          className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl p-6 border border-cyan-500/30 hover:border-cyan-500/50 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold">Schedule Session</div>
              <div className="text-slate-400 text-sm">Create a new live class</div>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/students"
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold">View Students</div>
              <div className="text-slate-400 text-sm">Monitor progress & activity</div>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/analytics"
          className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-emerald-500/30 hover:border-emerald-500/50 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold">View Analytics</div>
              <div className="text-slate-400 text-sm">Platform insights & trends</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-white font-semibold">Upcoming Sessions</h2>
            <Link href="/admin/live" className="text-cyan-400 text-sm hover:text-cyan-300">
              View all
            </Link>
          </div>
          <div className="p-4">
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-500 mb-2">No upcoming sessions</div>
                <Link href="/admin/live" className="text-cyan-400 text-sm hover:text-cyan-300">
                  Schedule your first session
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <div className="text-white font-medium">{session.title}</div>
                      <div className="text-slate-400 text-sm">
                        {new Date(session.scheduled_at).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-sm">{session.enrollmentCount} enrolled</span>
                      {session.google_meet_link && (
                        <a
                          href={session.google_meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Students Needing Help */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-white font-semibold">Students Needing Help</h2>
            <Link href="/admin/students" className="text-cyan-400 text-sm hover:text-cyan-300">
              View all
            </Link>
          </div>
          <div className="p-4">
            {!analytics?.insights.strugglingStudents?.length ? (
              <div className="text-center py-8">
                <div className="text-slate-500">All students are on track!</div>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.insights.strugglingStudents.map((student, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm font-medium">
                        {student.user?.full_name?.[0] || student.user?.email?.[0] || '?'}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {student.user?.full_name || student.user?.email}
                        </div>
                        <div className="text-slate-400 text-sm">Struggle score: {student.struggle_score}</div>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                      Needs attention
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="mt-6 bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <h2 className="text-white font-semibold mb-4">Students by Tier</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400">{analytics?.breakdown.usersByTier.student || 0}</div>
            <div className="text-slate-400 text-sm">Students</div>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-3xl font-bold text-blue-400">{analytics?.breakdown.usersByTier.employee || 0}</div>
            <div className="text-slate-400 text-sm">Employees</div>
          </div>
          <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="text-3xl font-bold text-emerald-400">{analytics?.breakdown.usersByTier.owner || 0}</div>
            <div className="text-slate-400 text-sm">Owners</div>
          </div>
        </div>
      </div>
    </div>
  );
}
