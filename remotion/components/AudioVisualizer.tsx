import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import {
  bpmConfig,
  isOnBeat,
  isOnStrongBeat,
  getBeatIntensity,
  getCurrentScene,
  getAudioCueAtFrame,
} from '../audio/audioSync';

// =============================================================================
// Types
// =============================================================================

interface AudioVisualizerProps {
  /**
   * Visualization style
   * - 'bars': Classic vertical bars
   * - 'waveform': Smooth waveform line
   * - 'circular': Circular/radial visualization
   * - 'dots': Animated dot grid
   */
  style?: 'bars' | 'waveform' | 'circular' | 'dots';

  /**
   * Number of visualization elements
   */
  barCount?: number;

  /**
   * Primary color for the visualization
   */
  color?: string;

  /**
   * Secondary/accent color
   */
  accentColor?: string;

  /**
   * Visualization height (for bars/waveform)
   */
  height?: number;

  /**
   * Visualization width
   */
  width?: number;

  /**
   * Opacity of the visualization
   */
  opacity?: number;

  /**
   * Show beat indicator overlay
   */
  showBeatIndicator?: boolean;

  /**
   * Position on screen
   */
  position?: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

// =============================================================================
// Simulated Audio Data Generator
// =============================================================================

/**
 * Generates simulated audio frequency data based on frame and beat timing
 * This creates visually pleasing patterns synchronized to the beat markers
 */
const generateSimulatedAudioData = (
  frame: number,
  barCount: number,
  seed: number = 0
): number[] => {
  const beatIntensity = getBeatIntensity(frame);
  const isStrong = isOnStrongBeat(frame);
  const scene = getCurrentScene(frame);

  // Base intensity varies by scene for visual interest
  const sceneMultiplier = scene ? {
    'Intro': 0.7,
    'Paths': 0.85,
    'Milestones': 1.0,
    'Tutor': 0.75,
    'Certification': 0.9,
    'Outro': 0.8,
  }[scene.name] || 0.8 : 0.8;

  return Array.from({ length: barCount }, (_, i) => {
    // Create frequency-based pattern (lower bars = bass, higher bars = treble)
    const frequencyPosition = i / barCount;

    // Simulate bass response (stronger on beats)
    const bassResponse = frequencyPosition < 0.3
      ? beatIntensity * (isStrong ? 1.5 : 1.0)
      : 0;

    // Simulate mid frequencies with some variation
    const midResponse = frequencyPosition >= 0.3 && frequencyPosition < 0.7
      ? Math.sin((frame * 0.1) + (i * 0.5) + seed) * 0.3 + 0.4
      : 0;

    // Simulate high frequencies with faster variation
    const highResponse = frequencyPosition >= 0.7
      ? Math.sin((frame * 0.2) + (i * 0.3) + seed) * 0.2 + 0.3
      : 0;

    // Combine all frequency responses
    const combined = (bassResponse + midResponse + highResponse) * sceneMultiplier;

    // Add some random variation for organic feel
    const noise = Math.sin(frame * 0.05 + i * 1.7 + seed) * 0.1;

    return Math.max(0.05, Math.min(1, combined + noise));
  });
};

// =============================================================================
// Bar Visualizer Component
// =============================================================================

const BarVisualizer: React.FC<{
  data: number[];
  color: string;
  accentColor: string;
  height: number;
  width: number;
  frame: number;
}> = ({ data, color, accentColor, height, width, frame }) => {
  const barWidth = width / data.length - 2;
  const beatIntensity = getBeatIntensity(frame);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 2,
        height,
        width,
      }}
    >
      {data.map((value, index) => {
        const barHeight = value * height;
        const isCenter = Math.abs(index - data.length / 2) < data.length * 0.2;
        const barColor = isCenter && beatIntensity > 0.5 ? accentColor : color;

        return (
          <div
            key={index}
            style={{
              width: barWidth,
              height: barHeight,
              backgroundColor: barColor,
              borderRadius: barWidth / 2,
              transition: 'height 0.05s ease-out',
              boxShadow: beatIntensity > 0.7
                ? `0 0 ${10 * beatIntensity}px ${barColor}`
                : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

// =============================================================================
// Waveform Visualizer Component
// =============================================================================

const WaveformVisualizer: React.FC<{
  data: number[];
  color: string;
  accentColor: string;
  height: number;
  width: number;
  frame: number;
}> = ({ data, color, accentColor, height, width, frame }) => {
  const beatIntensity = getBeatIntensity(frame);

  const pathData = useMemo(() => {
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height / 2 + (value - 0.5) * height * 0.8;
      return { x, y };
    });

    // Create smooth curve through points
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q ${prev.x + (cpX - prev.x) * 0.5} ${prev.y} ${cpX} ${(prev.y + curr.y) / 2}`;
    }

    return path;
  }, [data, width, height]);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} />
          <stop offset="50%" stopColor={accentColor} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation={3 * beatIntensity} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={pathData}
        fill="none"
        stroke="url(#waveGradient)"
        strokeWidth={3}
        strokeLinecap="round"
        filter={beatIntensity > 0.5 ? 'url(#glow)' : undefined}
      />
    </svg>
  );
};

// =============================================================================
// Circular Visualizer Component
// =============================================================================

const CircularVisualizer: React.FC<{
  data: number[];
  color: string;
  accentColor: string;
  height: number;
  width: number;
  frame: number;
}> = ({ data, color, accentColor, height, width, frame }) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.25;
  const beatIntensity = getBeatIntensity(frame);
  const rotation = frame * 0.5;

  return (
    <svg width={width} height={height}>
      <g transform={`rotate(${rotation} ${centerX} ${centerY})`}>
        {data.map((value, index) => {
          const angle = (index / data.length) * Math.PI * 2 - Math.PI / 2;
          const innerRadius = baseRadius;
          const outerRadius = baseRadius + value * baseRadius * 0.8;

          const x1 = centerX + Math.cos(angle) * innerRadius;
          const y1 = centerY + Math.sin(angle) * innerRadius;
          const x2 = centerX + Math.cos(angle) * outerRadius;
          const y2 = centerY + Math.sin(angle) * outerRadius;

          const barColor = index % 4 === 0 ? accentColor : color;

          return (
            <line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={barColor}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.7 + value * 0.3}
              style={{
                filter: beatIntensity > 0.5 ? `drop-shadow(0 0 ${5 * beatIntensity}px ${barColor})` : undefined,
              }}
            />
          );
        })}
      </g>
      <circle
        cx={centerX}
        cy={centerY}
        r={baseRadius * 0.3}
        fill={accentColor}
        opacity={0.2 + beatIntensity * 0.3}
      />
    </svg>
  );
};

// =============================================================================
// Dots Visualizer Component
// =============================================================================

const DotsVisualizer: React.FC<{
  data: number[];
  color: string;
  accentColor: string;
  height: number;
  width: number;
  frame: number;
}> = ({ data, color, accentColor, height, width, frame }) => {
  const cols = Math.ceil(Math.sqrt(data.length));
  const rows = Math.ceil(data.length / cols);
  const dotSize = Math.min(width / cols, height / rows) * 0.6;
  const beatIntensity = getBeatIntensity(frame);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: 4,
        width,
        height,
        alignItems: 'center',
        justifyItems: 'center',
      }}
    >
      {data.map((value, index) => {
        const scale = 0.3 + value * 0.7;
        const isAccent = value > 0.7 && beatIntensity > 0.5;

        return (
          <div
            key={index}
            style={{
              width: dotSize * scale,
              height: dotSize * scale,
              borderRadius: '50%',
              backgroundColor: isAccent ? accentColor : color,
              opacity: 0.4 + value * 0.6,
              boxShadow: isAccent
                ? `0 0 ${10 * beatIntensity}px ${accentColor}`
                : 'none',
              transition: 'all 0.1s ease-out',
            }}
          />
        );
      })}
    </div>
  );
};

// =============================================================================
// Beat Indicator Component
// =============================================================================

const BeatIndicator: React.FC<{ frame: number; color: string }> = ({ frame, color }) => {
  const beatIntensity = getBeatIntensity(frame);
  const isStrong = isOnStrongBeat(frame);
  const audioCue = getAudioCueAtFrame(frame);

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {/* Beat pulse indicator */}
      <div
        style={{
          width: isStrong ? 20 : 14,
          height: isStrong ? 20 : 14,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: 0.3 + beatIntensity * 0.7,
          boxShadow: beatIntensity > 0.5
            ? `0 0 ${20 * beatIntensity}px ${color}`
            : 'none',
          transition: 'all 0.05s ease-out',
        }}
      />

      {/* Audio cue label */}
      {audioCue && (
        <div
          style={{
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 4,
            color: color,
            fontSize: 10,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
          }}
        >
          {audioCue.event}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main AudioVisualizer Component
// =============================================================================

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  style = 'bars',
  barCount = 32,
  color = '#6366f1',
  accentColor = '#a855f7',
  height = 100,
  width = 400,
  opacity = 0.8,
  showBeatIndicator = true,
  position = 'bottom',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Generate simulated audio data
  const audioData = useMemo(
    () => generateSimulatedAudioData(frame, barCount, 42),
    [frame, barCount]
  );

  // Position styles
  const positionStyles: React.CSSProperties = {
    bottom: { bottom: 20, left: '50%', transform: 'translateX(-50%)' },
    top: { top: 20, left: '50%', transform: 'translateX(-50%)' },
    left: { left: 20, top: '50%', transform: 'translateY(-50%) rotate(-90deg)' },
    right: { right: 20, top: '50%', transform: 'translateY(-50%) rotate(90deg)' },
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  }[position];

  // Render appropriate visualizer style
  const renderVisualizer = () => {
    const props = { data: audioData, color, accentColor, height, width, frame };

    switch (style) {
      case 'waveform':
        return <WaveformVisualizer {...props} />;
      case 'circular':
        return <CircularVisualizer {...props} />;
      case 'dots':
        return <DotsVisualizer {...props} />;
      case 'bars':
      default:
        return <BarVisualizer {...props} />;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles,
        opacity,
        pointerEvents: 'none',
      }}
    >
      {renderVisualizer()}
      {showBeatIndicator && <BeatIndicator frame={frame} color={accentColor} />}
    </div>
  );
};

// =============================================================================
// Debug Overlay Component (for development)
// =============================================================================

export const AudioSyncDebugOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = getCurrentScene(frame);
  const audioCue = getAudioCueAtFrame(frame);
  const beatIntensity = getBeatIntensity(frame);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#fff',
        lineHeight: 1.6,
      }}
    >
      <div>Frame: {frame} / 899</div>
      <div>Time: {(frame / fps).toFixed(2)}s</div>
      <div>Scene: {scene?.name || 'N/A'}</div>
      <div>Beat: {isOnBeat(frame) ? 'YES' : 'no'} (intensity: {beatIntensity.toFixed(2)})</div>
      <div>Strong Beat: {isOnStrongBeat(frame) ? 'YES' : 'no'}</div>
      {audioCue && (
        <div style={{ color: '#a855f7', marginTop: 4 }}>
          Cue: {audioCue.event}
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;
