/**
 * Audio Synchronization Configuration for Phazur Walkthrough Video
 *
 * This file contains timing markers, beat points, and audio cue configurations
 * for synchronizing music and sound effects with the video.
 *
 * Video specs: 30 seconds @ 30fps = 900 total frames
 */

// =============================================================================
// BPM Configuration
// =============================================================================

export interface BPMConfig {
  bpm: number;
  beatsPerBar: number;
  framesPerBeat: number;
  framesPerBar: number;
}

/**
 * Recommended BPM: 120 (standard upbeat tech music tempo)
 * At 30fps and 120bpm: 1 beat = 15 frames (0.5 seconds)
 */
export const bpmConfig: BPMConfig = {
  bpm: 120,
  beatsPerBar: 4,
  framesPerBeat: 15, // (60 / 120) * 30fps = 15 frames per beat
  framesPerBar: 60,  // 4 beats * 15 frames = 60 frames per bar (2 seconds)
};

// =============================================================================
// Scene Timestamps
// =============================================================================

export interface SceneTimestamp {
  name: string;
  description: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  durationSeconds: number;
  audioNotes: string;
}

export const sceneTimestamps: SceneTimestamp[] = [
  {
    name: 'Intro',
    description: 'Phazur logo reveal with tagline animation',
    startFrame: 0,
    endFrame: 149,
    durationFrames: 150,
    durationSeconds: 5,
    audioNotes: 'Build-up intro, logo whoosh at frame 30, text reveal at frame 60',
  },
  {
    name: 'Learning Paths',
    description: 'Showcase of learning path cards and selection UI',
    startFrame: 150,
    endFrame: 299,
    durationFrames: 150,
    durationSeconds: 5,
    audioNotes: 'Energetic transition, card pop-in sounds, subtle hover effects',
  },
  {
    name: 'Milestones',
    description: 'Progress tracking and milestone achievements',
    startFrame: 300,
    endFrame: 449,
    durationFrames: 150,
    durationSeconds: 5,
    audioNotes: 'Achievement sounds, progress bar fills, celebration micro-sounds',
  },
  {
    name: 'AI Tutor',
    description: 'AI-powered tutoring and chat interface demo',
    startFrame: 450,
    endFrame: 599,
    durationFrames: 150,
    durationSeconds: 5,
    audioNotes: 'Futuristic AI sounds, typing effects, message pop-ins',
  },
  {
    name: 'Certification',
    description: 'Certification badges and credential showcase',
    startFrame: 600,
    endFrame: 749,
    durationFrames: 150,
    durationSeconds: 5,
    audioNotes: 'Badge unlock sounds, shine effects, verification chime',
  },
  {
    name: 'Outro',
    description: 'Call-to-action and final branding',
    startFrame: 750,
    endFrame: 899,
    durationFrames: 150,
    durationSeconds: 5,
    audioNotes: 'Music resolution, CTA button pulse, fade out',
  },
];

// =============================================================================
// Beat Markers
// =============================================================================

/**
 * Generate beat marker frames based on BPM configuration
 * At 120 BPM and 30fps, beats occur every 15 frames
 */
export const generateBeatMarkers = (config: BPMConfig, totalFrames: number): number[] => {
  const markers: number[] = [];
  for (let frame = 0; frame < totalFrames; frame += config.framesPerBeat) {
    markers.push(frame);
  }
  return markers;
};

// Pre-calculated beat markers for 900 frames at 120 BPM
export const beatMarkers: number[] = [
  0, 15, 30, 45, 60, 75, 90, 105, 120, 135,           // Intro (frames 0-149)
  150, 165, 180, 195, 210, 225, 240, 255, 270, 285,   // Paths (frames 150-299)
  300, 315, 330, 345, 360, 375, 390, 405, 420, 435,   // Milestones (frames 300-449)
  450, 465, 480, 495, 510, 525, 540, 555, 570, 585,   // Tutor (frames 450-599)
  600, 615, 630, 645, 660, 675, 690, 705, 720, 735,   // Certification (frames 600-749)
  750, 765, 780, 795, 810, 825, 840, 855, 870, 885,   // Outro (frames 750-899)
];

// Strong beats (downbeats - first beat of each bar)
export const strongBeatMarkers: number[] = [
  0, 60, 120,           // Intro bars
  180, 240,             // Paths bars
  300, 360, 420,        // Milestones bars
  480, 540,             // Tutor bars
  600, 660, 720,        // Certification bars
  780, 840,             // Outro bars
];

// =============================================================================
// Key Moment Markers (Sound Effect Cues)
// =============================================================================

export interface KeyMoment {
  frame: number;
  timeSeconds: number;
  scene: string;
  event: string;
  suggestedSound: string;
  priority: 'high' | 'medium' | 'low';
}

export const keyMoments: KeyMoment[] = [
  // Intro Scene (0-149)
  {
    frame: 0,
    timeSeconds: 0,
    scene: 'Intro',
    event: 'Video start',
    suggestedSound: 'Subtle ambient pad fade-in',
    priority: 'high',
  },
  {
    frame: 30,
    timeSeconds: 1,
    scene: 'Intro',
    event: 'Logo reveal',
    suggestedSound: 'Whoosh + impact hit',
    priority: 'high',
  },
  {
    frame: 60,
    timeSeconds: 2,
    scene: 'Intro',
    event: 'Tagline appears',
    suggestedSound: 'Soft text reveal sweep',
    priority: 'medium',
  },
  {
    frame: 120,
    timeSeconds: 4,
    scene: 'Intro',
    event: 'Intro builds to transition',
    suggestedSound: 'Rising tension/build',
    priority: 'medium',
  },

  // Paths Scene (150-299)
  {
    frame: 150,
    timeSeconds: 5,
    scene: 'Paths',
    event: 'Scene transition',
    suggestedSound: 'Transition whoosh',
    priority: 'high',
  },
  {
    frame: 180,
    timeSeconds: 6,
    scene: 'Paths',
    event: 'First path card appears',
    suggestedSound: 'Card pop-in',
    priority: 'medium',
  },
  {
    frame: 210,
    timeSeconds: 7,
    scene: 'Paths',
    event: 'Second path card appears',
    suggestedSound: 'Card pop-in (variation)',
    priority: 'low',
  },
  {
    frame: 240,
    timeSeconds: 8,
    scene: 'Paths',
    event: 'Third path card appears',
    suggestedSound: 'Card pop-in (variation)',
    priority: 'low',
  },
  {
    frame: 270,
    timeSeconds: 9,
    scene: 'Paths',
    event: 'Path selection highlight',
    suggestedSound: 'Selection glow sound',
    priority: 'medium',
  },

  // Milestones Scene (300-449)
  {
    frame: 300,
    timeSeconds: 10,
    scene: 'Milestones',
    event: 'Scene transition',
    suggestedSound: 'Transition whoosh',
    priority: 'high',
  },
  {
    frame: 330,
    timeSeconds: 11,
    scene: 'Milestones',
    event: 'Progress bar animates',
    suggestedSound: 'Progress fill swoosh',
    priority: 'medium',
  },
  {
    frame: 375,
    timeSeconds: 12.5,
    scene: 'Milestones',
    event: 'Milestone achieved',
    suggestedSound: 'Achievement unlock chime',
    priority: 'high',
  },
  {
    frame: 420,
    timeSeconds: 14,
    scene: 'Milestones',
    event: 'XP counter animation',
    suggestedSound: 'Points counting up',
    priority: 'low',
  },

  // Tutor Scene (450-599)
  {
    frame: 450,
    timeSeconds: 15,
    scene: 'Tutor',
    event: 'Scene transition',
    suggestedSound: 'Transition whoosh',
    priority: 'high',
  },
  {
    frame: 480,
    timeSeconds: 16,
    scene: 'Tutor',
    event: 'AI avatar appears',
    suggestedSound: 'Digital materialize sound',
    priority: 'high',
  },
  {
    frame: 510,
    timeSeconds: 17,
    scene: 'Tutor',
    event: 'User message appears',
    suggestedSound: 'Message send blip',
    priority: 'low',
  },
  {
    frame: 540,
    timeSeconds: 18,
    scene: 'Tutor',
    event: 'AI typing indicator',
    suggestedSound: 'Subtle typing clicks',
    priority: 'low',
  },
  {
    frame: 570,
    timeSeconds: 19,
    scene: 'Tutor',
    event: 'AI response appears',
    suggestedSound: 'AI response chime',
    priority: 'medium',
  },

  // Certification Scene (600-749)
  {
    frame: 600,
    timeSeconds: 20,
    scene: 'Certification',
    event: 'Scene transition',
    suggestedSound: 'Transition whoosh',
    priority: 'high',
  },
  {
    frame: 645,
    timeSeconds: 21.5,
    scene: 'Certification',
    event: 'Badge reveal',
    suggestedSound: 'Badge unlock fanfare',
    priority: 'high',
  },
  {
    frame: 690,
    timeSeconds: 23,
    scene: 'Certification',
    event: 'Badge shine effect',
    suggestedSound: 'Sparkle/shine sound',
    priority: 'medium',
  },
  {
    frame: 720,
    timeSeconds: 24,
    scene: 'Certification',
    event: 'Verification checkmark',
    suggestedSound: 'Verification chime',
    priority: 'medium',
  },

  // Outro Scene (750-899)
  {
    frame: 750,
    timeSeconds: 25,
    scene: 'Outro',
    event: 'Scene transition',
    suggestedSound: 'Final transition swoosh',
    priority: 'high',
  },
  {
    frame: 780,
    timeSeconds: 26,
    scene: 'Outro',
    event: 'CTA button appears',
    suggestedSound: 'Button materialize',
    priority: 'high',
  },
  {
    frame: 810,
    timeSeconds: 27,
    scene: 'Outro',
    event: 'CTA button pulse',
    suggestedSound: 'Subtle pulse/glow sound',
    priority: 'medium',
  },
  {
    frame: 870,
    timeSeconds: 29,
    scene: 'Outro',
    event: 'Music fade out begins',
    suggestedSound: 'Music resolution',
    priority: 'high',
  },
  {
    frame: 899,
    timeSeconds: 29.97,
    scene: 'Outro',
    event: 'Video end',
    suggestedSound: 'Final subtle hit',
    priority: 'low',
  },
];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the current scene based on frame number
 */
export const getCurrentScene = (frame: number): SceneTimestamp | undefined => {
  return sceneTimestamps.find(
    (scene) => frame >= scene.startFrame && frame <= scene.endFrame
  );
};

/**
 * Check if current frame is on a beat
 */
export const isOnBeat = (frame: number): boolean => {
  return beatMarkers.includes(frame);
};

/**
 * Check if current frame is on a strong beat (downbeat)
 */
export const isOnStrongBeat = (frame: number): boolean => {
  return strongBeatMarkers.includes(frame);
};

/**
 * Get key moments for a specific scene
 */
export const getKeyMomentsForScene = (sceneName: string): KeyMoment[] => {
  return keyMoments.filter((moment) => moment.scene === sceneName);
};

/**
 * Get the nearest beat frame
 */
export const getNearestBeat = (frame: number): number => {
  const { framesPerBeat } = bpmConfig;
  return Math.round(frame / framesPerBeat) * framesPerBeat;
};

/**
 * Calculate intensity value based on beat proximity (0-1)
 * Useful for visual pulsing effects
 */
export const getBeatIntensity = (frame: number): number => {
  const { framesPerBeat } = bpmConfig;
  const frameInBeat = frame % framesPerBeat;
  // Sharp attack, gradual decay
  return Math.max(0, 1 - (frameInBeat / framesPerBeat) * 1.5);
};

/**
 * Get audio cue at specific frame (if any)
 */
export const getAudioCueAtFrame = (frame: number): KeyMoment | undefined => {
  return keyMoments.find((moment) => moment.frame === frame);
};

// =============================================================================
// Export Constants
// =============================================================================

export const TOTAL_FRAMES = 900;
export const TOTAL_DURATION_SECONDS = 30;
export const FPS = 30;
export const SCENE_COUNT = 6;
export const SCENE_DURATION_FRAMES = 150;
export const SCENE_DURATION_SECONDS = 5;
