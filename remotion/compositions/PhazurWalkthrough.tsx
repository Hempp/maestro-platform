import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { IntroScene } from '../components/IntroScene';
import { PathsScene } from '../components/PathsScene';
import { FeaturesScene } from '../components/FeaturesScene';
import { ComparisonScene } from '../components/ComparisonScene';
import { MilestonesScene } from '../components/MilestonesScene';
import { TutorScene } from '../components/TutorScene';
import { TestimonialsScene } from '../components/TestimonialsScene';
import { CertificationScene } from '../components/CertificationScene';
import { OutroScene } from '../components/OutroScene';
import {
  FadeTransition,
  SlideTransition,
  ZoomTransition,
  WipeTransition,
  MorphTransition,
  Crossfade,
} from '../components/Transitions';

export const PhazurWalkthrough: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Transition overlap duration (in frames)
  const TRANSITION_OVERLAP = 20; // ~0.67 seconds overlap for smooth transitions

  // Scene timing (in frames at 30fps) with overlaps
  // Extended 45-second video with 9 scenes
  const INTRO_START = 0;
  const INTRO_DURATION = 150; // 5 seconds

  const PATHS_START = INTRO_DURATION - TRANSITION_OVERLAP; // 130
  const PATHS_DURATION = 150;

  const FEATURES_START = PATHS_START + PATHS_DURATION - TRANSITION_OVERLAP; // 260
  const FEATURES_DURATION = 150;

  const COMPARISON_START = FEATURES_START + FEATURES_DURATION - TRANSITION_OVERLAP; // 390
  const COMPARISON_DURATION = 150;

  const MILESTONES_START = COMPARISON_START + COMPARISON_DURATION - TRANSITION_OVERLAP; // 520
  const MILESTONES_DURATION = 150;

  const TUTOR_START = MILESTONES_START + MILESTONES_DURATION - TRANSITION_OVERLAP; // 650
  const TUTOR_DURATION = 150;

  const TESTIMONIALS_START = TUTOR_START + TUTOR_DURATION - TRANSITION_OVERLAP; // 780
  const TESTIMONIALS_DURATION = 150;

  const CERTIFICATION_START = TESTIMONIALS_START + TESTIMONIALS_DURATION - TRANSITION_OVERLAP; // 910
  const CERTIFICATION_DURATION = 150;

  const OUTRO_START = CERTIFICATION_START + CERTIFICATION_DURATION - TRANSITION_OVERLAP; // 1040
  const OUTRO_DURATION = 150;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Animated background grid */}
      <BackgroundGrid frame={frame} />

      {/* Scene 1: Intro - Fade in, zoom out */}
      <Sequence from={INTRO_START} durationInFrames={INTRO_DURATION}>
        <ZoomTransition
          durationInFrames={INTRO_DURATION}
          type="both"
          mode="in"
          scale={{ start: 1.1, end: 0.95 }}
        >
          <FadeTransition durationInFrames={INTRO_DURATION} type="in">
            <IntroScene />
          </FadeTransition>
        </ZoomTransition>
      </Sequence>

      {/* Scene 2: Paths - Slide in from right */}
      <Sequence from={PATHS_START} durationInFrames={PATHS_DURATION}>
        <SlideTransition
          durationInFrames={PATHS_DURATION}
          direction="right"
          type="both"
          easing="spring"
        >
          <PathsScene />
        </SlideTransition>
      </Sequence>

      {/* Scene 3: Features - Zoom in with fade */}
      <Sequence from={FEATURES_START} durationInFrames={FEATURES_DURATION}>
        <ZoomTransition
          durationInFrames={FEATURES_DURATION}
          type="both"
          mode="in"
          scale={{ start: 0.9, end: 1.0 }}
        >
          <FadeTransition durationInFrames={FEATURES_DURATION} type="both">
            <FeaturesScene />
          </FadeTransition>
        </ZoomTransition>
      </Sequence>

      {/* Scene 4: Comparison - Slide in from left */}
      <Sequence from={COMPARISON_START} durationInFrames={COMPARISON_DURATION}>
        <SlideTransition
          durationInFrames={COMPARISON_DURATION}
          direction="left"
          type="both"
          easing="spring"
        >
          <ComparisonScene />
        </SlideTransition>
      </Sequence>

      {/* Scene 5: Milestones - Wipe from bottom */}
      <Sequence from={MILESTONES_START} durationInFrames={MILESTONES_DURATION}>
        <WipeTransition
          durationInFrames={MILESTONES_DURATION}
          direction="up"
          type="both"
          color="rgba(139, 92, 246, 0.4)"
        >
          <MilestonesScene />
        </WipeTransition>
      </Sequence>

      {/* Scene 6: Tutor - Morph/circle reveal */}
      <Sequence from={TUTOR_START} durationInFrames={TUTOR_DURATION}>
        <MorphTransition
          durationInFrames={TUTOR_DURATION}
          type="both"
          shapes={{
            start: 'circle(0% at 50% 50%)',
            middle: 'circle(100% at 50% 50%)',
            end: 'circle(150% at 50% 50%)',
          }}
          backgroundColor="#8b5cf6"
        >
          <TutorScene />
        </MorphTransition>
      </Sequence>

      {/* Scene 7: Testimonials - Fade with wipe */}
      <Sequence from={TESTIMONIALS_START} durationInFrames={TESTIMONIALS_DURATION}>
        <WipeTransition
          durationInFrames={TESTIMONIALS_DURATION}
          direction="right"
          type="both"
          color="rgba(168, 85, 247, 0.3)"
        >
          <FadeTransition durationInFrames={TESTIMONIALS_DURATION} type="both">
            <TestimonialsScene />
          </FadeTransition>
        </WipeTransition>
      </Sequence>

      {/* Scene 8: Certification - Slide in from left with zoom */}
      <Sequence from={CERTIFICATION_START} durationInFrames={CERTIFICATION_DURATION}>
        <ZoomTransition
          durationInFrames={CERTIFICATION_DURATION}
          type="both"
          mode="out"
          scale={{ start: 1.2, end: 0.9 }}
        >
          <SlideTransition
            durationInFrames={CERTIFICATION_DURATION}
            direction="left"
            type="both"
            easing="spring"
          >
            <CertificationScene />
          </SlideTransition>
        </ZoomTransition>
      </Sequence>

      {/* Scene 9: Outro - Fade with diagonal wipe */}
      <Sequence from={OUTRO_START} durationInFrames={OUTRO_DURATION}>
        <WipeTransition
          durationInFrames={OUTRO_DURATION}
          direction="diagonal"
          type="in"
          color="rgba(99, 102, 241, 0.5)"
        >
          <FadeTransition durationInFrames={OUTRO_DURATION} type="in">
            <OutroScene />
          </FadeTransition>
        </WipeTransition>
      </Sequence>

      {/* Global transition overlay for extra polish */}
      <TransitionGlow frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

// Animated background grid component
const BackgroundGrid: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = interpolate(frame % 60, [0, 30, 60], [0.03, 0.06, 0.03]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(99, 102, 241, ${opacity}) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, ${opacity}) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        transform: `translateY(${(frame * 0.5) % 50}px)`,
      }}
    />
  );
};

// Subtle glow effect during transitions
const TransitionGlow: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  // Transition points where glow should appear (updated for 9 scenes)
  const transitionPoints = [130, 260, 390, 520, 650, 780, 910, 1040];
  const glowDuration = 30;

  let glowOpacity = 0;

  for (const point of transitionPoints) {
    if (frame >= point - 5 && frame <= point + glowDuration) {
      const localProgress = (frame - point + 5) / (glowDuration + 5);
      const intensity = Math.sin(localProgress * Math.PI);
      glowOpacity = Math.max(glowOpacity, intensity * 0.15);
    }
  }

  if (glowOpacity === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
        opacity: glowOpacity,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  );
};
