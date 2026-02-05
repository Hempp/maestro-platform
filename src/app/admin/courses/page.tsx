'use client';

/**
 * ADMIN COURSES PAGE
 * Create and manage live courses
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string | null;
  tier: string | null;
  max_students: number;
  is_active: boolean;
  created_at: string;
  teacher: {
    id: string;
    full_name: string;
    email: string;
  };
  enrollmentCount: number;
  upcomingSessions: number;
}

function CreateCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState('');
  const [maxStudents, setMaxStudents] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          tier: tier || null,
          maxStudents,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create course');
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d21] rounded-xl border border-slate-700/50 w-full max-w-md">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create Course</h2>
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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Course Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="e.g., Introduction to AI Workflows"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="What will students learn?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">All Tiers</option>
                <option value="student">Student</option>
                <option value="employee">Employee</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Students</label>
              <input
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(parseInt(e.target.value) || 30)}
                min={1}
                max={100}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
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
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCourseModal({
  course,
  onClose,
  onUpdated,
}: {
  course: Course;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || '');
  const [tier, setTier] = useState(course.tier || '');
  const [maxStudents, setMaxStudents] = useState(course.max_students);
  const [isActive, setIsActive] = useState(course.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          updates: {
            title,
            description: description || null,
            tier: tier || null,
            maxStudents,
            isActive,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update course');
      }

      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d21] rounded-xl border border-slate-700/50 w-full max-w-md">
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Edit Course</h2>
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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Course Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              placeholder="e.g., Introduction to AI Workflows"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="What will students learn?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              >
                <option value="">All Tiers</option>
                <option value="student">Student</option>
                <option value="employee">Employee</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Max Students</label>
              <input
                type="number"
                value={maxStudents}
                onChange={(e) => setMaxStudents(parseInt(e.target.value) || 30)}
                min={1}
                max={100}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
            />
            <label htmlFor="isActive" className="text-sm text-slate-300">
              Course is active and visible to students
            </label>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CourseCard({ course, onEdit }: { course: Course; onEdit: () => void }) {
  const tierColors: Record<string, string> = {
    student: 'bg-purple-500/20 text-purple-400',
    employee: 'bg-blue-500/20 text-blue-400',
    owner: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg">{course.title}</h3>
            {course.tier && (
              <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 capitalize ${tierColors[course.tier] || 'bg-slate-500/20 text-slate-400'}`}>
                {course.tier} tier
              </span>
            )}
          </div>
          <div className={`px-2 py-1 rounded text-xs ${course.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
            {course.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>

        {course.description && (
          <p className="text-slate-400 text-sm line-clamp-2 mb-4">{course.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-white font-semibold">{course.enrollmentCount}</div>
            <div className="text-slate-500 text-xs">Enrolled</div>
          </div>
          <div>
            <div className="text-white font-semibold">{course.upcomingSessions}</div>
            <div className="text-slate-500 text-xs">Upcoming</div>
          </div>
          <div>
            <div className="text-white font-semibold">{course.max_students}</div>
            <div className="text-slate-500 text-xs">Max</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-800/30 border-t border-slate-700/50 flex items-center justify-between">
        <div className="text-slate-500 text-sm">
          by {course.teacher?.full_name || course.teacher?.email}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/live?courseId=${course.id}`}
            className="px-3 py-1.5 text-cyan-400 hover:text-cyan-300 text-sm transition"
          >
            Sessions
          </Link>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  async function fetchCourses() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/courses?includeInactive=true');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Courses</h1>
          <p className="text-slate-400">Create and manage your live courses.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Course
        </button>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="text-slate-400">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/20 rounded-xl border border-slate-700/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">No courses yet</h3>
          <p className="text-slate-500 mb-4">Create your first course to start teaching.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-medium transition"
          >
            Create Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} onEdit={() => setEditingCourse(course)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCourseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchCourses}
        />
      )}

      {/* Edit Modal */}
      {editingCourse && (
        <EditCourseModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onUpdated={fetchCourses}
        />
      )}
    </div>
  );
}
