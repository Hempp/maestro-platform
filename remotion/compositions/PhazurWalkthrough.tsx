import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { IntroScene } from '../components/IntroScene';
import { PathsScene } from '../components/PathsScene';
import { MilestonesScene } from '../components/MilestonesScene';
import { TutorScene } from '../components/TutorScene';
import { CertificationScene } from '../components/CertificationScene';
import { OutroScene } from '../components/OutroScene';

export const PhazurWalkthrough: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene timing (in frames at 30fps)
  const INTRO_START = 0;
  const INTRO_DURATION = 150; // 5 seconds

  const PATHS_START = 150;
  const PATHS_DURATION = 150; // 5 seconds

  const MILESTONES_START = 300;
  const MILESTONES_DURATION = 150; // 5 seconds

  const TUTOR_START = 450;
  const TUTOR_DURATION = 150; // 5 seconds

  const CERTIFICATION_START = 600;
  const CERTIFICATION_DURATION = 150; // 5 seconds

  const OUTRO_START = 750;
  const OUTRO_DURATION = 150; // 5 seconds

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Animated background grid */}
      <BackgroundGrid frame={frame} />

      {/* Scene sequences */}
      <Sequence from={INTRO_START} durationInFrames={INTRO_DURATION}>
        <IntroScene />
      </Sequence>

      <Sequence from={PATHS_START} durationInFrames={PATHS_DURATION}>
        <PathsScene />
      </Sequence>

      <Sequence from={MILESTONES_START} durationInFrames={MILESTONES_DURATION}>
        <MilestonesScene />
      </Sequence>

      <Sequence from={TUTOR_START} durationInFrames={TUTOR_DURATION}>
        <TutorScene />
      </Sequence>

      <Sequence from={CERTIFICATION_START} durationInFrames={CERTIFICATION_DURATION}>
        <CertificationScene />
      </Sequence>

      <Sequence from={OUTRO_START} durationInFrames={OUTRO_DURATION}>
        <OutroScene />
      </Sequence>
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
