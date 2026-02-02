'use client';

/**
 * ADMIN LIVE SESSIONS PAGE
 * Schedule and manage live sessions with Google Meet
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Session {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  google_meet_link: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  recording_url: string | null;
  course: {
    id: string;
    title: string;
    tier: string | null;
  };
  enrollmentCount: number;
  attendedCount: number;
}

interface Course {
  id: string;
  title: string;
}

function CreateSessionModal({
  courses,
  defaultCourseId,
  onClose,
  onCreated,
}: {
  courses: Course[];
  defaultCourseId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [courseId, setCourseId] = useState(defaultCourseId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [meetLink, setMeetLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !title || !scheduledAt) {
      setError('Course, title, and scheduled time are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title,
          description: description || null,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes: duration,
          googleMeetLink: meetLink || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d21] rounded-xl border border-slate-700/50 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-[#1a1d21]">
          <h2 className="text-lg font-semibold text-white">Schedule Session</h2>
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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="e.g., Week 1: Getting Started"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="What will be covered?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Date & Time</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Duration (min)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Google Meet Link
              <span className="text-slate-500 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="url"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
            <p className="text-slate-500 text-xs mt-1">
              Create a meeting in Google Calendar and paste the link here
            </p>
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
              {loading ? 'Creating...' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionCard({
  session,
  onStatusChange,
}: {
  session: Session;
  onStatusChange: (id: string, status: string) => void;
}) {
  const isUpcoming = new Date(session.scheduled_at) > new Date();
  const isPast = new Date(session.scheduled_at) < new Date() && session.status !== 'live';

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400',
    live: 'bg-red-500/20 text-red-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600/50 transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-slate-400 text-sm">{session.course?.title}</div>
          <h3 className="text-white font-semibold">{session.title}</h3>
        </div>
        <span className={`px-2 py-1 rounded text-xs capitalize ${statusColors[session.status]}`}>
          {session.status}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date(session.scheduled_at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {new Date(session.scheduled_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })} ({session.duration_minutes} min)
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {session.attendedCount}/{session.enrollmentCount} attended
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {session.google_meet_link && session.status !== 'completed' && session.status !== 'cancelled' && (
          <a
            href={session.google_meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {session.status === 'live' ? 'Join Live' : 'Join Meet'}
          </a>
        )}

        {session.status === 'scheduled' && isUpcoming && (
          <button
            onClick={() => onStatusChange(session.id, 'live')}
            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition"
          >
            Go Live
          </button>
        )}

        {session.status === 'live' && (
          <button
            onClick={() => onStatusChange(session.id, 'completed')}
            className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition"
          >
            End Session
          </button>
        )}

        {session.status === 'scheduled' && (
          <button
            onClick={() => onStatusChange(session.id, 'cancelled')}
            className="px-3 py-1.5 text-slate-400 hover:text-red-400 text-sm transition"
          >
            Cancel
          </button>
        )}

        {session.recording_url && (
          <a
            href={session.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition"
          >
            Recording
          </a>
        )}
      </div>
    </div>
  );
}

export default function LiveSessionsPage() {
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('courseId');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  async function fetchData() {
    setLoading(true);
    try {
      const [sessionsRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/sessions${statusFilter ? `?status=${statusFilter}` : ''}`),
        fetch('/api/admin/courses'),
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  async function handleStatusChange(sessionId: string, newStatus: string) {
    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          updates: { status: newStatus },
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }

  const upcomingSessions = sessions.filter(
    (s) => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
  );
  const liveSessions = sessions.filter((s) => s.status === 'live');
  const pastSessions = sessions.filter(
    (s) => s.status === 'completed' || s.status === 'cancelled'
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Live Sessions</h1>
          <p className="text-slate-400">Schedule and manage your live classes.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Schedule Session
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="">All Sessions</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live Now</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/20 rounded-xl border border-slate-700/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">No sessions scheduled</h3>
          <p className="text-slate-500 mb-4">Schedule your first live session.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition"
          >
            Schedule Session
          </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {liveSessions.map((session) => (
                  <SessionCard key={session.id} session={session} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingSessions.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-4">Upcoming</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session.id} session={session} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {pastSessions.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-4">Past Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pastSessions.map((session) => (
                  <SessionCard key={session.id} session={session} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSessionModal
          courses={courses}
          defaultCourseId={courseIdParam}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  );
}
