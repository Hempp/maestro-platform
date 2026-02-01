/**
 * WEEKLY HUMAN MENTOR CHECK-INS API
 * Scheduled 1:1 calls to prevent dropout
 *
 * Core philosophy: AI teaches, humans coach.
 * Every learner gets a real person who cares about their success.
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  Mentor,
  MentorCheckIn,
  MentorMatchCriteria,
  BusinessTier,
  CheckInStatus,
} from '@/types';

// Mentor roster
const MENTORS: Mentor[] = [
  {
    id: 'mentor-001',
    name: 'Sarah Chen',
    title: 'AI Solutions Architect',
    specialty: ['technical', 'career'],
    bio: '10 years in tech, helped 200+ people transition into AI roles. Former Google engineer.',
    avatarUrl: '/mentors/sarah.jpg',
    calendlyUrl: 'https://calendly.com/phazur/sarah-checkin',
    maxWeeklySlots: 20,
    timezone: 'America/Los_Angeles',
    languages: ['English', 'Mandarin'],
  },
  {
    id: 'mentor-002',
    name: 'Marcus Johnson',
    title: 'Business Automation Consultant',
    specialty: ['business', 'general'],
    bio: 'Helped 50+ small businesses automate with AI. MBA from Wharton.',
    avatarUrl: '/mentors/marcus.jpg',
    calendlyUrl: 'https://calendly.com/phazur/marcus-checkin',
    maxWeeklySlots: 15,
    timezone: 'America/New_York',
    languages: ['English', 'Spanish'],
  },
  {
    id: 'mentor-003',
    name: 'Priya Sharma',
    title: 'Learning Experience Designer',
    specialty: ['general', 'career'],
    bio: 'Former teacher turned tech. Specializes in helping career changers. Knows exactly what employers want.',
    avatarUrl: '/mentors/priya.jpg',
    calendlyUrl: 'https://calendly.com/phazur/priya-checkin',
    maxWeeklySlots: 25,
    timezone: 'America/Chicago',
    languages: ['English', 'Hindi'],
  },
  {
    id: 'mentor-004',
    name: 'Alex Rivera',
    title: 'Senior ML Engineer',
    specialty: ['technical'],
    bio: 'Deep technical expertise in AI/ML. Can help debug complex workflows and explain advanced concepts.',
    avatarUrl: '/mentors/alex.jpg',
    calendlyUrl: 'https://calendly.com/phazur/alex-checkin',
    maxWeeklySlots: 10,
    timezone: 'America/Denver',
    languages: ['English', 'Portuguese'],
  },
];

// In-memory check-in storage (production: database)
const checkIns: Map<string, MentorCheckIn[]> = new Map();

// Match learner to best mentor
function matchMentor(criteria: MentorMatchCriteria): Mentor {
  let bestMatch = MENTORS[0];
  let bestScore = 0;

  for (const mentor of MENTORS) {
    let score = 0;

    // Specialty match
    if (criteria.specialtyNeeded && mentor.specialty.includes(criteria.specialtyNeeded)) {
      score += 3;
    }

    // Language match
    if (mentor.languages.includes(criteria.preferredLanguage)) {
      score += 2;
    }

    // Tier-based matching
    if (criteria.learnerTier === 'owner' && mentor.specialty.includes('business')) {
      score += 2;
    }
    if (criteria.learnerTier === 'student' && mentor.specialty.includes('career')) {
      score += 2;
    }
    if (criteria.learnerTier === 'employee' && mentor.specialty.includes('technical')) {
      score += 1;
    }

    // Timezone proximity (simplified)
    if (mentor.timezone.includes(criteria.timezone.split('/')[0])) {
      score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = mentor;
    }
  }

  return bestMatch;
}

// Calculate dropout risk based on recent activity
function assessDropoutRisk(
  lastCheckIn?: MentorCheckIn,
  recentProgress?: { akusCompleted: number; daysSinceActive: number }
): 'low' | 'medium' | 'high' {
  if (!recentProgress) return 'medium';

  // High risk indicators
  if (recentProgress.daysSinceActive > 14) return 'high';
  if (recentProgress.akusCompleted === 0 && recentProgress.daysSinceActive > 7) return 'high';

  // Medium risk
  if (recentProgress.daysSinceActive > 7) return 'medium';
  if (lastCheckIn?.status === 'missed') return 'medium';

  return 'low';
}

// GET: List mentors or get learner's mentor/check-ins
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const learnerId = searchParams.get('learnerId');

  // List all mentors
  if (action === 'list') {
    return NextResponse.json({
      mentors: MENTORS.map(m => ({
        ...m,
        // Hide internal fields
        maxWeeklySlots: undefined,
      })),
    });
  }

  // Get learner's check-ins
  if (learnerId) {
    const learnerCheckIns = checkIns.get(learnerId) || [];
    const upcomingCheckIn = learnerCheckIns.find(c =>
      c.status === 'scheduled' && new Date(c.scheduledAt) > new Date()
    );
    const pastCheckIns = learnerCheckIns.filter(c =>
      c.status === 'completed' || new Date(c.scheduledAt) < new Date()
    );

    return NextResponse.json({
      upcoming: upcomingCheckIn,
      past: pastCheckIns.slice(-5), // Last 5
      totalCompleted: pastCheckIns.filter(c => c.status === 'completed').length,
      totalMissed: pastCheckIns.filter(c => c.status === 'missed').length,
    });
  }

  return NextResponse.json({ mentors: MENTORS });
}

// POST: Schedule a check-in or match with mentor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, learnerId, ...data } = body;

    if (!learnerId) {
      return NextResponse.json(
        { error: 'learnerId required' },
        { status: 400 }
      );
    }

    // Match with a mentor
    if (action === 'match') {
      const criteria: MentorMatchCriteria = {
        learnerTier: data.tier || 'student',
        learnerGoals: data.goals || [],
        preferredLanguage: data.language || 'English',
        timezone: data.timezone || 'America/New_York',
        specialtyNeeded: data.specialty,
      };

      const mentor = matchMentor(criteria);

      return NextResponse.json({
        matched: true,
        mentor: {
          id: mentor.id,
          name: mentor.name,
          title: mentor.title,
          specialty: mentor.specialty,
          bio: mentor.bio,
          avatarUrl: mentor.avatarUrl,
          calendlyUrl: mentor.calendlyUrl,
          languages: mentor.languages,
        },
        message: `You've been matched with ${mentor.name}! Book your first check-in to get started.`,
      });
    }

    // Schedule a check-in
    if (action === 'schedule') {
      const { mentorId, scheduledAt, duration, goals, challenges } = data;

      const mentor = MENTORS.find(m => m.id === mentorId);
      if (!mentor) {
        return NextResponse.json(
          { error: 'Mentor not found' },
          { status: 404 }
        );
      }

      const checkIn: MentorCheckIn = {
        id: crypto.randomUUID(),
        learnerId,
        mentorId,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 20, // Default 20 minutes
        status: 'scheduled',
        learnerGoals: goals || [],
        currentChallenges: challenges || [],
        progressSinceLastCall: {
          akusCompleted: data.akusCompleted || 0,
          struggleAreas: data.struggleAreas || [],
          wins: data.wins || [],
        },
      };

      // Store check-in
      const learnerCheckIns = checkIns.get(learnerId) || [];
      learnerCheckIns.push(checkIn);
      checkIns.set(learnerId, learnerCheckIns);

      return NextResponse.json({
        scheduled: true,
        checkIn,
        mentor: {
          name: mentor.name,
          calendlyUrl: mentor.calendlyUrl,
        },
        message: `Check-in scheduled with ${mentor.name} for ${new Date(scheduledAt).toLocaleString()}`,
        reminder: "You'll receive a reminder 24 hours before your call.",
      });
    }

    // Complete a check-in (called by mentor after the call)
    if (action === 'complete') {
      const { checkInId, notes, actionItems, nextCheckInSuggested, dropoutRisk } = data;

      const learnerCheckIns = checkIns.get(learnerId) || [];
      const checkIn = learnerCheckIns.find(c => c.id === checkInId);

      if (!checkIn) {
        return NextResponse.json(
          { error: 'Check-in not found' },
          { status: 404 }
        );
      }

      checkIn.status = 'completed';
      checkIn.notes = notes;
      checkIn.actionItems = actionItems;
      checkIn.nextCheckInSuggested = nextCheckInSuggested ? new Date(nextCheckInSuggested) : undefined;
      checkIn.dropoutRisk = dropoutRisk;

      checkIns.set(learnerId, learnerCheckIns);

      return NextResponse.json({
        completed: true,
        checkIn,
        message: 'Check-in completed successfully.',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: match, schedule, or complete' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Mentor API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// PUT: Update check-in status (reschedule, cancel, mark as missed)
export async function PUT(request: NextRequest) {
  try {
    const { learnerId, checkInId, status, newScheduledAt } = await request.json();

    if (!learnerId || !checkInId) {
      return NextResponse.json(
        { error: 'learnerId and checkInId required' },
        { status: 400 }
      );
    }

    const learnerCheckIns = checkIns.get(learnerId) || [];
    const checkIn = learnerCheckIns.find(c => c.id === checkInId);

    if (!checkIn) {
      return NextResponse.json(
        { error: 'Check-in not found' },
        { status: 404 }
      );
    }

    if (status === 'rescheduled' && newScheduledAt) {
      checkIn.status = 'rescheduled';
      checkIn.scheduledAt = new Date(newScheduledAt);
    } else if (status) {
      checkIn.status = status as CheckInStatus;
    }

    checkIns.set(learnerId, learnerCheckIns);

    return NextResponse.json({
      updated: true,
      checkIn,
    });
  } catch (error) {
    console.error('Mentor update error:', error);
    return NextResponse.json(
      { error: 'Failed to update check-in' },
      { status: 500 }
    );
  }
}
