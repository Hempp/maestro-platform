'use client';

/**
 * ADMIN CERTIFICATION REVIEW PAGE
 * View submission artifacts and score with rubric
 */

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  user_id: string;
  path: 'student' | 'employee' | 'owner';
  status: 'submitted' | 'under_review' | 'passed' | 'failed';
  project_title: string;
  project_description: string | null;
  github_repo_url: string | null;
  live_demo_url: string | null;
  architecture_url: string | null;
  video_url: string | null;
  logs_url: string | null;
  roi_document_url: string | null;
  documentation_url: string | null;
  score_working_system: number | null;
  score_problem_fit: number | null;
  score_architecture: number | null;
  score_production_ready: number | null;
  score_roi: number | null;
  score_documentation: number | null;
  total_score: number | null;
  reviewer_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  user: User | null;
  reviewer: User | null;
}

interface LearnerProfile {
  tier: string;
  current_path: string | null;
  total_learning_time: number | null;
  current_streak: number | null;
}

interface UserStats {
  learnerProfile: LearnerProfile | null;
  akusCompleted: number;
  certificatesCount: number;
}

const RUBRIC_ITEMS = [
  {
    key: 'score_working_system',
    label: 'Working System',
    maxScore: 30,
    description: 'Does the project function as intended? Are there critical bugs?',
  },
  {
    key: 'score_problem_fit',
    label: 'Problem Fit',
    maxScore: 20,
    description: 'Does the solution address a real problem? Is the use case valid?',
  },
  {
    key: 'score_architecture',
    label: 'Architecture',
    maxScore: 15,
    description: 'Is the system well-designed? Scalable? Maintainable?',
  },
  {
    key: 'score_production_ready',
    label: 'Production Ready',
    maxScore: 15,
    description: 'Error handling, logging, security, and deployment considerations.',
  },
  {
    key: 'score_roi',
    label: 'ROI / Business Value',
    maxScore: 10,
    description: 'Clear business value demonstration. Time/cost savings documented.',
  },
  {
    key: 'score_documentation',
    label: 'Documentation',
    maxScore: 10,
    description: 'Quality of README, code comments, and user documentation.',
  },
] as const;

const PASSING_SCORE = 70;

const PATH_LABELS = {
  student: 'AI Associate Path',
  employee: 'Workflow Lead Path',
  owner: 'AI Operations Path',
};

const STATUS_COLORS = {
  submitted: 'bg-yellow-500/20 text-yellow-400',
  under_review: 'bg-cyan-500/20 text-cyan-400',
  passed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
};

function ArtifactLink({ label, url, icon }: { label: string; url: string | null; icon: React.ReactNode }) {
  if (!url) {
    return (
      <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg text-slate-500">
        {icon}
        <span>{label}</span>
        <span className="ml-auto text-xs">Not provided</span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg text-white hover:bg-slate-700/50 transition group"
    >
      {icon}
      <span>{label}</span>
      <svg className="w-4 h-4 ml-auto text-slate-400 group-hover:text-cyan-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

export default function AdminReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for scores
  const [scores, setScores] = useState<Record<string, number>>({
    score_working_system: 0,
    score_problem_fit: 0,
    score_architecture: 0,
    score_production_ready: 0,
    score_roi: 0,
    score_documentation: 0,
  });
  const [reviewerNotes, setReviewerNotes] = useState('');

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const isPassing = totalScore >= PASSING_SCORE;

  useEffect(() => {
    async function fetchSubmission() {
      try {
        const response = await fetch(`/api/admin/submissions/${resolvedParams.id}`);
        if (response.ok) {
          const data = await response.json();
          setSubmission(data.submission);
          setUserStats(data.userStats);

          // Pre-fill scores if already reviewed
          if (data.submission.score_working_system !== null) {
            setScores({
              score_working_system: data.submission.score_working_system || 0,
              score_problem_fit: data.submission.score_problem_fit || 0,
              score_architecture: data.submission.score_architecture || 0,
              score_production_ready: data.submission.score_production_ready || 0,
              score_roi: data.submission.score_roi || 0,
              score_documentation: data.submission.score_documentation || 0,
            });
          }
          if (data.submission.reviewer_notes) {
            setReviewerNotes(data.submission.reviewer_notes);
          }
        } else {
          setError('Failed to load submission');
        }
      } catch (err) {
        console.error('Failed to fetch submission:', err);
        setError('Failed to load submission');
      }
      setLoading(false);
    }

    fetchSubmission();
  }, [resolvedParams.id]);

  const handleScoreChange = (key: string, value: number, max: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: Math.min(Math.max(0, value), max),
    }));
  };

  const handleSubmitReview = async (decision: 'pass' | 'fail') => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/submissions/${resolvedParams.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scores,
          reviewer_notes: reviewerNotes,
          decision,
        }),
      });

      if (response.ok) {
        router.push('/admin/certifications');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Failed to submit review');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Loading submission...</div>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="p-8">
        <div className="text-red-400">{error}</div>
        <Link href="/admin/certifications" className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block">
          Back to certifications
        </Link>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8">
        <div className="text-slate-400">Submission not found</div>
        <Link href="/admin/certifications" className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block">
          Back to certifications
        </Link>
      </div>
    );
  }

  const isAlreadyReviewed = submission.status === 'passed' || submission.status === 'failed';

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/certifications"
          className="p-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{submission.project_title}</h1>
          <p className="text-slate-400">{PATH_LABELS[submission.path]}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${STATUS_COLORS[submission.status]}`}>
          {submission.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Info & Artifacts */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student Card */}
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
            <h2 className="text-white font-semibold mb-4">Student</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg font-medium">
                {submission.user?.full_name?.[0] || submission.user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-white font-medium">{submission.user?.full_name || 'Unknown'}</div>
                <div className="text-slate-500 text-sm">{submission.user?.email}</div>
              </div>
            </div>

            {userStats && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">AKUs Completed</span>
                  <span className="text-white">{userStats.akusCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Certificates</span>
                  <span className="text-white">{userStats.certificatesCount}</span>
                </div>
                {userStats.learnerProfile && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Learning Time</span>
                      <span className="text-white">
                        {Math.round((userStats.learnerProfile.total_learning_time || 0) / 60)}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Streak</span>
                      <span className="text-white">{userStats.learnerProfile.current_streak || 0} days</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Project Description */}
          {submission.project_description && (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
              <h2 className="text-white font-semibold mb-3">Project Description</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{submission.project_description}</p>
            </div>
          )}

          {/* Artifacts */}
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
            <h2 className="text-white font-semibold mb-4">Submission Artifacts</h2>
            <div className="space-y-2">
              <ArtifactLink
                label="GitHub Repository"
                url={submission.github_repo_url}
                icon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                  </svg>
                }
              />
              <ArtifactLink
                label="Live Demo"
                url={submission.live_demo_url}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                }
              />
              <ArtifactLink
                label="Architecture Diagram"
                url={submission.architecture_url}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                }
              />
              <ArtifactLink
                label="Video Walkthrough"
                url={submission.video_url}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                }
              />
              <ArtifactLink
                label="Logs / Screenshots"
                url={submission.logs_url}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <ArtifactLink
                label="ROI Document"
                url={submission.roi_document_url}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <ArtifactLink
                label="Documentation"
                url={submission.documentation_url}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>

        {/* Right Column - Scoring Rubric */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-semibold text-lg">Scoring Rubric</h2>
              <div className={`text-2xl font-bold ${isPassing ? 'text-green-400' : 'text-red-400'}`}>
                {totalScore}/100
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="mb-6">
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${isPassing ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${totalScore}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-slate-500">
                <span>0</span>
                <span className={`${isPassing ? 'text-green-400' : 'text-red-400'}`}>
                  {isPassing ? 'PASSING' : 'FAILING'} (70 required)
                </span>
                <span>100</span>
              </div>
            </div>

            {/* Rubric Items */}
            <div className="space-y-4 mb-6">
              {RUBRIC_ITEMS.map((item) => (
                <div key={item.key} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-white font-medium">{item.label}</div>
                      <div className="text-slate-500 text-sm">{item.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={item.maxScore}
                        value={scores[item.key]}
                        onChange={(e) => handleScoreChange(item.key, parseInt(e.target.value) || 0, item.maxScore)}
                        disabled={isAlreadyReviewed}
                        className="w-16 px-2 py-1 bg-slate-900/50 border border-slate-600 rounded text-white text-center focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                      />
                      <span className="text-slate-400">/ {item.maxScore}</span>
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${(scores[item.key] / item.maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Reviewer Notes */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">Reviewer Notes</label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                disabled={isAlreadyReviewed}
                placeholder="Add feedback for the student..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            {!isAlreadyReviewed ? (
              <div className="flex gap-4">
                <button
                  onClick={() => handleSubmitReview('fail')}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-medium hover:bg-red-500/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Fail Submission'}
                </button>
                <button
                  onClick={() => handleSubmitReview('pass')}
                  disabled={submitting || totalScore < PASSING_SCORE}
                  className="flex-1 px-6 py-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg font-medium hover:bg-green-500/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : `Pass Submission (${totalScore}pts)`}
                </button>
              </div>
            ) : (
              <div className={`p-4 rounded-lg text-center ${submission.status === 'passed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <div className="font-semibold mb-1">
                  This submission has been {submission.status === 'passed' ? 'APPROVED' : 'REJECTED'}
                </div>
                <div className="text-sm opacity-80">
                  Reviewed on {new Date(submission.reviewed_at!).toLocaleDateString()}
                  {submission.reviewer && ` by ${submission.reviewer.full_name || submission.reviewer.email}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
