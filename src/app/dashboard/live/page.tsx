'use client';

/**
 * STUDENT LIVE EVENTS PAGE
 * View and join live sessions based on tier access
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Session {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  platform: 'google_meet' | 'zoom';
  target_tier: 'student' | 'employee' | 'owner';
  seat_price: number;
  max_seats: number;
  status: string;
  course: {
    id: string;
    title: string;
    description: string;
  };
  enrollmentCount: number;
  seatsAvailable: number;
  userAccess: {
    hasAccess: boolean;
    hasPurchased: boolean;
    isEnrolled: boolean;
    requiresPurchase: boolean;
    price: number;
  };
}

function SessionCard({
  session,
  onEnroll,
  onPurchase,
}: {
  session: Session;
  onEnroll: (id: string) => void;
  onPurchase: (id: string) => void;
}) {
  const tierColors: Record<string, { bg: string; text: string; label: string }> = {
    student: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'All Users' },
    employee: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Employee+' },
    owner: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Owner Only' },
  };

  const tier = tierColors[session.target_tier] || tierColors.student;
  const isUpcoming = new Date(session.scheduled_at) > new Date();
  const { hasAccess, isEnrolled, requiresPurchase, price } = session.userAccess;

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-slate-400 text-sm mb-1">{session.course?.title}</div>
          <h3 className="text-lg font-semibold text-white">{session.title}</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tier.bg} ${tier.text}`}>
          {tier.label}
        </span>
      </div>

      {/* Description */}
      {session.description && (
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{session.description}</p>
      )}

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(session.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {new Date(session.scheduled_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })} ({session.duration_minutes} min)
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {session.seatsAvailable} seats available
        </div>
      </div>

      {/* Platform Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-2 py-0.5 rounded text-xs ${
          session.platform === 'zoom'
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-cyan-500/10 text-cyan-400'
        }`}>
          {session.platform === 'zoom' ? 'Zoom' : 'Google Meet'}
        </span>
      </div>

      {/* Action */}
      <div className="pt-4 border-t border-slate-700/50">
        {isEnrolled ? (
          <div className="flex items-center justify-between">
            <span className="text-emerald-400 text-sm font-medium">Enrolled</span>
            {session.status === 'live' && (
              <button className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition">
                Join Now
              </button>
            )}
          </div>
        ) : hasAccess ? (
          <button
            onClick={() => onEnroll(session.id)}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition"
          >
            Enroll Now - Free
          </button>
        ) : requiresPurchase ? (
          <button
            onClick={() => onPurchase(session.id)}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg text-white font-medium transition"
          >
            Purchase Seat - ${price}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2.5 bg-slate-700 rounded-lg text-slate-400 font-medium cursor-not-allowed"
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardLivePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userTier, setUserTier] = useState('student');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

  async function fetchSessions() {
    try {
      const response = await fetch('/api/sessions?status=scheduled');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        setUserTier(data.userTier || 'student');
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  async function handleEnroll(sessionId: string) {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        fetchSessions(); // Refresh
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to enroll');
      }
    } catch (error) {
      alert('Failed to enroll');
    }
  }

  async function handlePurchase(sessionId: string) {
    try {
      const response = await fetch('/api/sessions/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        fetchSessions(); // Refresh
        alert('Seat purchased successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to purchase');
      }
    } catch (error) {
      alert('Failed to purchase');
    }
  }

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'free') return s.userAccess.hasAccess;
    if (filter === 'premium') return s.userAccess.requiresPurchase;
    return true;
  });

  const upcomingSessions = filteredSessions.filter(
    (s) => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
  );

  const liveSessions = filteredSessions.filter((s) => s.status === 'live');

  return (
    <div className="min-h-screen bg-[#1a1d21] p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Live Events</h1>
        <p className="text-slate-400">
          Join live sessions with instructors. Your tier:
          <span className={`ml-2 px-2 py-0.5 rounded text-xs capitalize ${
            userTier === 'owner' ? 'bg-emerald-500/20 text-emerald-400' :
            userTier === 'employee' ? 'bg-blue-500/20 text-blue-400' :
            'bg-purple-500/20 text-purple-400'
          }`}>
            {userTier}
          </span>
        </p>
      </div>

      {/* Tier Access Info */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 mb-6">
        <h3 className="text-white font-medium mb-2">Your Access</h3>
        <div className="text-sm text-slate-400">
          {userTier === 'owner' && 'As an Owner, you have free access to all live events.'}
          {userTier === 'employee' && 'As an Employee, you have free access to Student and Employee events. Purchase seats for Owner events.'}
          {userTier === 'student' && 'As a Student, you have free access to Student events. Purchase seats for Employee and Owner events.'}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'free', 'premium'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
            }`}
          >
            {f === 'all' && 'All Events'}
            {f === 'free' && 'Free Access'}
            {f === 'premium' && 'Premium (Purchase)'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400">Loading events...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/20 rounded-xl border border-slate-700/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">No upcoming events</h3>
          <p className="text-slate-500">Check back later for new live sessions.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Now */}
          {liveSessions.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Live Now
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onEnroll={handleEnroll}
                    onPurchase={handlePurchase}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingSessions.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-4">Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onEnroll={handleEnroll}
                    onPurchase={handlePurchase}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
