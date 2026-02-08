import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// ============================================================================
// TypewriterText - Character by character typing effect
// ============================================================================

interface TypewriterTextProps {
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
  cursorBlink?: boolean;
  cursorColor?: string;
  style?: React.CSSProperties;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 0.5,
  cursorBlink = true,
  cursorColor = '#22d3ee',
  style,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);

  const visibleChars = Math.floor(adjustedFrame * charsPerFrame);
  const displayedText = text.slice(0, Math.min(visibleChars, text.length));
  const isTyping = visibleChars < text.length;

  // Cursor blink animation
  const cursorOpacity = cursorBlink
    ? Math.sin(frame * 0.2) > 0 ? 1 : 0
    : 1;

  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'center' }}>
      <span>{displayedText}</span>
      {(isTyping || cursorBlink) && (
        <span
          style={{
            display: 'inline-block',
            width: 3,
            height: '1em',
            background: cursorColor,
            marginLeft: 2,
            opacity: isTyping ? 1 : cursorOpacity,
          }}
        />
      )}
    </span>
  );
};

// ============================================================================
// SplitText - Animate each word/letter separately with stagger
// ============================================================================

interface SplitTextProps {
  text: string;
  splitBy?: 'letter' | 'word';
  startFrame?: number;
  staggerDelay?: number;
  animation?: 'fadeUp' | 'fadeIn' | 'scale' | 'blur' | 'slideIn';
  style?: React.CSSProperties;
  letterStyle?: React.CSSProperties;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  splitBy = 'letter',
  startFrame = 0,
  staggerDelay = 2,
  animation = 'fadeUp',
  style,
  letterStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const units = useMemo(() => {
    if (splitBy === 'word') {
      return text.split(' ').map((word, i, arr) => ({
        text: i < arr.length - 1 ? word + ' ' : word,
        index: i,
      }));
    }
    return text.split('').map((char, i) => ({
      text: char === ' ' ? '\u00A0' : char,
      index: i,
    }));
  }, [text, splitBy]);

  const getAnimationStyle = (index: number): React.CSSProperties => {
    const delay = startFrame + index * staggerDelay;
    const adjustedFrame = Math.max(0, frame - delay);

    const springConfig = { damping: 15, stiffness: 100 };
    const springValue = spring({
      frame: adjustedFrame,
      fps,
      config: springConfig,
    });

    const opacity = interpolate(
      adjustedFrame,
      [0, 10],
      [0, 1],
      { extrapolateRight: 'clamp' }
    );

    switch (animation) {
      case 'fadeUp':
        return {
          opacity,
          transform: `translateY(${(1 - springValue) * 20}px)`,
        };
      case 'fadeIn':
        return {
          opacity: springValue,
        };
      case 'scale':
        return {
          opacity,
          transform: `scale(${springValue})`,
        };
      case 'blur':
        return {
          opacity,
          filter: `blur(${(1 - springValue) * 10}px)`,
        };
      case 'slideIn':
        return {
          opacity,
          transform: `translateX(${(1 - springValue) * 30}px)`,
        };
      default:
        return { opacity };
    }
  };

  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', ...style }}>
      {units.map((unit) => (
        <span
          key={unit.index}
          style={{
            display: 'inline-block',
            whiteSpace: 'pre',
            ...letterStyle,
            ...getAnimationStyle(unit.index),
          }}
        >
          {unit.text}
        </span>
      ))}
    </span>
  );
};

// ============================================================================
// GlitchText - Cyberpunk glitch effect
// ============================================================================

interface GlitchTextProps {
  text: string;
  startFrame?: number;
  intensity?: number;
  glitchInterval?: number;
  primaryColor?: string;
  secondaryColor?: string;
  style?: React.CSSProperties;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  startFrame = 0,
  intensity = 1,
  glitchInterval = 30,
  primaryColor = '#ff00ff',
  secondaryColor = '#00ffff',
  style,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);

  // Opacity fade in
  const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Create pseudo-random glitch based on frame
  const isGlitching = adjustedFrame % glitchInterval < 5;
  const glitchSeed = Math.floor(adjustedFrame / 3);

  // Calculate glitch offsets
  const getGlitchOffset = (seed: number, multiplier: number) => {
    return isGlitching
      ? Math.sin(seed * multiplier) * intensity * 5
      : 0;
  };

  const clipPath1 = isGlitching
    ? `inset(${(glitchSeed % 30) + 20}% 0 ${60 - (glitchSeed % 30)}% 0)`
    : 'none';
  const clipPath2 = isGlitching
    ? `inset(${60 - (glitchSeed % 40)}% 0 ${(glitchSeed % 40) + 10}% 0)`
    : 'none';

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        opacity,
        ...style,
      }}
    >
      {/* Base text */}
      <span style={{ position: 'relative', zIndex: 2 }}>{text}</span>

      {/* Red/magenta glitch layer */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: getGlitchOffset(glitchSeed, 1.5),
          color: primaryColor,
          clipPath: clipPath1,
          opacity: isGlitching ? 0.6 : 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {text}
      </span>

      {/* Cyan glitch layer */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: getGlitchOffset(glitchSeed, 2.3) * -1,
          color: secondaryColor,
          clipPath: clipPath2,
          opacity: isGlitching ? 0.6 : 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {text}
      </span>
    </span>
  );
};

// ============================================================================
// GradientText - Animated gradient that flows through text
// ============================================================================

interface GradientTextProps {
  text: string;
  startFrame?: number;
  colors?: string[];
  speed?: number;
  angle?: number;
  style?: React.CSSProperties;
}

export const GradientText: React.FC<GradientTextProps> = ({
  text,
  startFrame = 0,
  colors = ['#22d3ee', '#3b82f6', '#a855f7', '#22d3ee'],
  speed = 1,
  angle = 90,
  style,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);

  // Opacity fade in
  const opacity = interpolate(adjustedFrame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Animate color cycling through the colors array
  const colorIndex = Math.floor((adjustedFrame * speed * 0.05) % colors.length);
  const nextColorIndex = (colorIndex + 1) % colors.length;
  const colorProgress = ((adjustedFrame * speed * 0.05) % 1);

  // Simple color interpolation - just use the current color
  const currentColor = colors[colorIndex];

  return (
    <span
      style={{
        color: currentColor,
        opacity,
        textShadow: `0 0 20px ${currentColor}40`,
        transition: 'color 0.3s ease',
        ...style,
      }}
    >
      {text}
    </span>
  );
};

// ============================================================================
// CountUpNumber - Animated number counter
// ============================================================================

interface CountUpNumberProps {
  endValue: number;
  startValue?: number;
  startFrame?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'spring';
  style?: React.CSSProperties;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  endValue,
  startValue = 0,
  startFrame = 0,
  duration = 60,
  prefix = '',
  suffix = '',
  decimals = 0,
  easing = 'easeOut',
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - startFrame);

  let progress: number;

  switch (easing) {
    case 'linear':
      progress = interpolate(
        adjustedFrame,
        [0, duration],
        [0, 1],
        { extrapolateRight: 'clamp' }
      );
      break;
    case 'easeOut':
      progress = interpolate(
        adjustedFrame,
        [0, duration],
        [0, 1],
        { extrapolateRight: 'clamp' }
      );
      // Apply easing curve
      progress = 1 - Math.pow(1 - progress, 3);
      break;
    case 'easeInOut':
      progress = interpolate(
        adjustedFrame,
        [0, duration],
        [0, 1],
        { extrapolateRight: 'clamp' }
      );
      // Apply easing curve
      progress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      break;
    case 'spring':
      progress = spring({
        frame: adjustedFrame,
        fps,
        config: { damping: 15, stiffness: 50 },
      });
      break;
    default:
      progress = interpolate(
        adjustedFrame,
        [0, duration],
        [0, 1],
        { extrapolateRight: 'clamp' }
      );
  }

  const currentValue = startValue + (endValue - startValue) * progress;
  const displayValue = currentValue.toFixed(decimals);

  // Opacity animation
  const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <span style={{ opacity, ...style }}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

// ============================================================================
// WaveText - Text with wave motion effect
// ============================================================================

interface WaveTextProps {
  text: string;
  startFrame?: number;
  waveHeight?: number;
  waveSpeed?: number;
  waveLength?: number;
  style?: React.CSSProperties;
}

export const WaveText: React.FC<WaveTextProps> = ({
  text,
  startFrame = 0,
  waveHeight = 10,
  waveSpeed = 0.15,
  waveLength = 0.3,
  style,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);

  const opacity = interpolate(adjustedFrame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <span style={{ display: 'inline-flex', opacity, ...style }}>
      {text.split('').map((char, i) => {
        const offset = Math.sin((adjustedFrame * waveSpeed) + (i * waveLength)) * waveHeight;

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              transform: `translateY(${offset}px)`,
              whiteSpace: 'pre',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </span>
  );
};

// ============================================================================
// ScrambleText - Random character scramble reveal
// ============================================================================

interface ScrambleTextProps {
  text: string;
  startFrame?: number;
  scrambleDuration?: number;
  characters?: string;
  style?: React.CSSProperties;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  startFrame = 0,
  scrambleDuration = 40,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',
  style,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);

  const opacity = interpolate(adjustedFrame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const displayText = useMemo(() => {
    return text.split('').map((char, i) => {
      const charRevealFrame = (i / text.length) * scrambleDuration;

      if (adjustedFrame >= charRevealFrame + 10) {
        // Character is fully revealed
        return char;
      } else if (adjustedFrame >= charRevealFrame) {
        // Character is scrambling
        if (char === ' ') return ' ';
        const randomIndex = Math.floor(
          ((adjustedFrame * (i + 1)) % characters.length)
        );
        return characters[randomIndex];
      } else {
        // Character not yet started
        return char === ' ' ? ' ' : characters[0];
      }
    }).join('');
  }, [text, adjustedFrame, scrambleDuration, characters]);

  return (
    <span style={{ opacity, fontFamily: 'monospace', ...style }}>
      {displayText}
    </span>
  );
};

// ============================================================================
// RevealText - Text revealed with a moving mask
// ============================================================================

interface RevealTextProps {
  text: string;
  startFrame?: number;
  duration?: number;
  direction?: 'left' | 'right' | 'center';
  highlightColor?: string;
  style?: React.CSSProperties;
}

export const RevealText: React.FC<RevealTextProps> = ({
  text,
  startFrame = 0,
  duration = 30,
  direction = 'left',
  highlightColor = '#22d3ee',
  style,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);

  const progress = interpolate(
    adjustedFrame,
    [0, duration],
    [0, 100],
    { extrapolateRight: 'clamp' }
  );

  const highlightProgress = interpolate(
    adjustedFrame,
    [0, duration * 0.3, duration],
    [0, 100, 100],
    { extrapolateRight: 'clamp' }
  );

  const highlightWidth = interpolate(
    adjustedFrame,
    [0, duration * 0.3, duration * 0.5, duration],
    [0, 20, 20, 0],
    { extrapolateRight: 'clamp' }
  );

  let clipPath: string;
  let highlightLeft: string;

  switch (direction) {
    case 'right':
      clipPath = `inset(0 ${100 - progress}% 0 0)`;
      highlightLeft = `${highlightProgress - highlightWidth}%`;
      break;
    case 'center':
      clipPath = `inset(0 ${50 - progress / 2}%)`;
      highlightLeft = `${50 - highlightWidth / 2}%`;
      break;
    default:
      clipPath = `inset(0 0 0 ${100 - progress}%)`;
      highlightLeft = `${100 - highlightProgress}%`;
  }

  return (
    <span style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Hidden text for layout */}
      <span style={{ visibility: 'hidden' }}>{text}</span>

      {/* Revealed text */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          clipPath,
          zIndex: 2,
        }}
      >
        {text}
      </span>

      {/* Moving highlight bar - behind text */}
      {highlightWidth > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: highlightLeft,
            width: `${highlightWidth}%`,
            height: '100%',
            background: highlightColor,
            opacity: 0.15,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
    </span>
  );
};
