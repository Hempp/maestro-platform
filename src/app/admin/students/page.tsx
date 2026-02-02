'use client';

/**
 * ADMIN STUDENTS PAGE
 * View and manage all students with progress tracking
 */

import { useEffect, useState } from 'react';

interface Student {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  tier: string | null;
  created_at: string;
  learner_profiles: Array<{
    current_path: string | null;
    total_learning_time: number;
    current_streak: number;
    longest_streak: number;
    struggle_score: number;
    last_activity_at: string | null;
  }>;
  stats: {
    akusCompleted: number;
    certificatesCount: number;
  };
}

function ProgressRing({ progress, size = 40, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-cyan-400"
      />
    </svg>
  );
}

function StudentCard({ student }: { student: Student }) {
  const profile = student.learner_profiles?.[0];
  const isActive = profile?.last_activity_at
    ? new Date(profile.last_activity_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    : false;

  const tierColors: Record<string, string> = {
    student: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    employee: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    owner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  const requiredAkus = student.tier === 'owner' ? 20 : student.tier === 'employee' ? 15 : 10;
  const progress = Math.min(100, Math.round((student.stats.akusCompleted / requiredAkus) * 100));

  return (
    <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
            {student.full_name?.[0] || student.email[0].toUpperCase()}
          </div>
          {isActive && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#1a1d21]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium truncate">
              {student.full_name || 'No name'}
            </span>
            {student.tier && (
              <span className={`px-2 py-0.5 rounded text-xs border capitalize ${tierColors[student.tier] || 'bg-slate-500/20 text-slate-400'}`}>
                {student.tier}
              </span>
            )}
          </div>
          <div className="text-slate-400 text-sm truncate">{student.email}</div>
          <div className="text-slate-500 text-xs mt-1">
            Joined {new Date(student.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Progress Ring */}
        <div className="flex flex-col items-center">
          <ProgressRing progress={progress} />
          <span className="text-xs text-slate-400 mt-1">{progress}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-700/50">
        <div className="text-center">
          <div className="text-white font-semibold">{student.stats.akusCompleted}</div>
          <div className="text-slate-500 text-xs">AKUs</div>
        </div>
        <div className="text-center">
          <div className="text-white font-semibold">{profile?.current_streak || 0}</div>
          <div className="text-slate-500 text-xs">Streak</div>
        </div>
        <div className="text-center">
          <div className="text-white font-semibold">{Math.round((profile?.total_learning_time || 0) / 60)}h</div>
          <div className="text-slate-500 text-xs">Hours</div>
        </div>
        <div className="text-center">
          <div className={`font-semibold ${(profile?.struggle_score || 0) >= 70 ? 'text-orange-400' : 'text-white'}`}>
            {profile?.struggle_score || 0}
          </div>
          <div className="text-slate-500 text-xs">Struggle</div>
        </div>
      </div>

      {/* Certificates */}
      {student.stats.certificatesCount > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <span className="text-emerald-400 text-sm">{student.stats.certificatesCount} certificate(s) earned</span>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (tierFilter) params.set('tier', tierFilter);

        const response = await fetch(`/api/admin/students?${params}`);
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
      }
      setLoading(false);
    }

    const debounce = setTimeout(fetchStudents, 300);
    return () => clearTimeout(debounce);
  }, [search, tierFilter]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Students</h1>
        <p className="text-slate-400">Monitor student progress and engagement.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
        >
          <option value="">All Tiers</option>
          <option value="student">Student</option>
          <option value="employee">Employee</option>
          <option value="owner">Owner</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-slate-400 text-sm mb-4">
        {total} student{total !== 1 ? 's' : ''} found
      </div>

      {/* Students Grid */}
      {loading ? (
        <div className="text-slate-400">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-500 mb-2">No students found</div>
          <p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}
