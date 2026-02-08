import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from 'remotion';

// ============================================================================
// TRANSITION TYPES
// ============================================================================

export type SlideDirection = 'left' | 'right' | 'up' | 'down';
export type WipeDirection = 'left' | 'right' | 'up' | 'down' | 'diagonal';
export type ZoomMode = 'in' | 'out';

interface BaseTransitionProps {
  children: React.ReactNode;
  durationInFrames: number;
  type?: 'in' | 'out' | 'both';
}

// ============================================================================
// 1. FADE TRANSITION - Smooth opacity crossfade
// ============================================================================

interface FadeTransitionProps extends BaseTransitionProps {
  delay?: number;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  durationInFrames,
  type = 'both',
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInDuration = durationInFrames * 0.15;
  const fadeOutStart = durationInFrames - fadeInDuration;

  let opacity = 1;

  if (type === 'in' || type === 'both') {
    const fadeIn = interpolate(
      frame - delay,
      [0, fadeInDuration],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    opacity = Math.min(opacity, fadeIn);
  }

  if (type === 'out' || type === 'both') {
    const fadeOut = interpolate(
      frame,
      [fadeOutStart, durationInFrames],
      [1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    opacity = Math.min(opacity, fadeOut);
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

// ============================================================================
// 2. SLIDE TRANSITION - Slide in/out with direction options
// ============================================================================

interface SlideTransitionProps extends BaseTransitionProps {
  direction?: SlideDirection;
  easing?: 'spring' | 'ease' | 'linear';
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  durationInFrames,
  type = 'both',
  direction = 'left',
  easing = 'spring',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const slideDuration = durationInFrames * 0.2;
  const slideOutStart = durationInFrames - slideDuration;

  // Direction mappings
  const getOffset = (progress: number, isEntering: boolean) => {
    const distance = direction === 'up' || direction === 'down' ? height : width;
    const multiplier = isEntering ? (1 - progress) : progress;

    switch (direction) {
      case 'left':
        return { x: isEntering ? -distance * multiplier : distance * multiplier, y: 0 };
      case 'right':
        return { x: isEntering ? distance * multiplier : -distance * multiplier, y: 0 };
      case 'up':
        return { x: 0, y: isEntering ? -distance * multiplier : distance * multiplier };
      case 'down':
        return { x: 0, y: isEntering ? distance * multiplier : -distance * multiplier };
      default:
        return { x: 0, y: 0 };
    }
  };

  let transform = { x: 0, y: 0 };
  let opacity = 1;

  if (type === 'in' || type === 'both') {
    const progress = easing === 'spring'
      ? spring({ frame, fps, config: { damping: 20, stiffness: 100 } })
      : interpolate(frame, [0, slideDuration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: easing === 'ease' ? Easing.bezier(0.25, 0.1, 0.25, 1) : undefined,
        });

    if (frame < slideDuration) {
      transform = getOffset(progress, true);
      opacity = progress;
    }
  }

  if ((type === 'out' || type === 'both') && frame >= slideOutStart) {
    const localFrame = frame - slideOutStart;
    const progress = interpolate(localFrame, [0, slideDuration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 1, 1),
    });

    transform = getOffset(progress, false);
    opacity = 1 - progress;
  }

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ============================================================================
// 3. ZOOM TRANSITION - Zoom in/out effect
// ============================================================================

interface ZoomTransitionProps extends BaseTransitionProps {
  mode?: ZoomMode;
  scale?: { start: number; end: number };
}

export const ZoomTransition: React.FC<ZoomTransitionProps> = ({
  children,
  durationInFrames,
  type = 'both',
  mode = 'in',
  scale = { start: 0.8, end: 1.2 },
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoomDuration = durationInFrames * 0.2;
  const zoomOutStart = durationInFrames - zoomDuration;

  let currentScale = 1;
  let opacity = 1;

  if (type === 'in' || type === 'both') {
    const progress = spring({
      frame,
      fps,
      config: { damping: 15, stiffness: 80 },
    });

    if (frame < zoomDuration) {
      currentScale = mode === 'in'
        ? interpolate(progress, [0, 1], [scale.start, 1])
        : interpolate(progress, [0, 1], [scale.end, 1]);
      opacity = progress;
    }
  }

  if ((type === 'out' || type === 'both') && frame >= zoomOutStart) {
    const localFrame = frame - zoomOutStart;
    const progress = interpolate(localFrame, [0, zoomDuration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 1, 1),
    });

    currentScale = mode === 'in'
      ? interpolate(progress, [0, 1], [1, scale.end])
      : interpolate(progress, [0, 1], [1, scale.start]);
    opacity = 1 - progress;
  }

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${currentScale})`,
        opacity,
        transformOrigin: 'center center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ============================================================================
// 4. WIPE TRANSITION - Directional wipe effect
// ============================================================================

interface WipeTransitionProps extends BaseTransitionProps {
  direction?: WipeDirection;
  color?: string;
}

export const WipeTransition: React.FC<WipeTransitionProps> = ({
  children,
  durationInFrames,
  type = 'both',
  direction = 'right',
  color = 'rgba(99, 102, 241, 0.3)',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wipeDuration = durationInFrames * 0.15;
  const wipeOutStart = durationInFrames - wipeDuration;

  const getClipPath = (progress: number, isEntering: boolean) => {
    const p = isEntering ? progress * 100 : (1 - progress) * 100;

    switch (direction) {
      case 'right':
        return isEntering
          ? `polygon(0 0, ${p}% 0, ${p}% 100%, 0 100%)`
          : `polygon(${100 - p}% 0, 100% 0, 100% 100%, ${100 - p}% 100%)`;
      case 'left':
        return isEntering
          ? `polygon(${100 - p}% 0, 100% 0, 100% 100%, ${100 - p}% 100%)`
          : `polygon(0 0, ${p}% 0, ${p}% 100%, 0 100%)`;
      case 'down':
        return isEntering
          ? `polygon(0 0, 100% 0, 100% ${p}%, 0 ${p}%)`
          : `polygon(0 ${100 - p}%, 100% ${100 - p}%, 100% 100%, 0 100%)`;
      case 'up':
        return isEntering
          ? `polygon(0 ${100 - p}%, 100% ${100 - p}%, 100% 100%, 0 100%)`
          : `polygon(0 0, 100% 0, 100% ${p}%, 0 ${p}%)`;
      case 'diagonal':
        return isEntering
          ? `polygon(0 0, ${p * 2}% 0, 0 ${p * 2}%)`
          : `polygon(${100 - p * 2}% 100%, 100% ${100 - p * 2}%, 100% 100%)`;
      default:
        return 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
    }
  };

  let clipPath = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
  let wipeProgress = 0;
  let showWipe = false;

  if (type === 'in' || type === 'both') {
    const progress = interpolate(frame, [0, wipeDuration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    if (frame < wipeDuration) {
      clipPath = getClipPath(progress, true);
      wipeProgress = progress;
      showWipe = true;
    }
  }

  if ((type === 'out' || type === 'both') && frame >= wipeOutStart) {
    const localFrame = frame - wipeOutStart;
    const progress = interpolate(localFrame, [0, wipeDuration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    clipPath = getClipPath(progress, false);
    wipeProgress = progress;
    showWipe = true;
  }

  return (
    <>
      <AbsoluteFill style={{ clipPath }}>
        {children}
      </AbsoluteFill>

      {/* Wipe edge effect */}
      {showWipe && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(${
              direction === 'right' || direction === 'left' ? '90deg' : '180deg'
            }, transparent, ${color}, transparent)`,
            opacity: Math.sin(wipeProgress * Math.PI) * 0.8,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

// ============================================================================
// 5. MORPH TRANSITION - Shape morphing between scenes
// ============================================================================

interface MorphTransitionProps extends BaseTransitionProps {
  shapes?: {
    start: string;
    middle: string;
    end: string;
  };
  backgroundColor?: string;
}

export const MorphTransition: React.FC<MorphTransitionProps> = ({
  children,
  durationInFrames,
  type = 'both',
  shapes = {
    start: 'circle(0% at 50% 50%)',
    middle: 'circle(70.7% at 50% 50%)',
    end: 'circle(150% at 50% 50%)',
  },
  backgroundColor = '#6366f1',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const morphDuration = durationInFrames * 0.2;
  const morphOutStart = durationInFrames - morphDuration;

  // Parse circle parameters for interpolation
  const parseCircle = (shape: string) => {
    const match = shape.match(/circle\((\d+(?:\.\d+)?%?) at (\d+(?:\.\d+)?%) (\d+(?:\.\d+)?)%\)/);
    if (match) {
      return {
        radius: parseFloat(match[1]),
        x: parseFloat(match[2]),
        y: parseFloat(match[3]),
      };
    }
    return { radius: 100, x: 50, y: 50 };
  };

  const startShape = parseCircle(shapes.start);
  const middleShape = parseCircle(shapes.middle);
  const endShape = parseCircle(shapes.end);

  let clipPath = shapes.end;
  let morphOpacity = 0;

  if (type === 'in' || type === 'both') {
    const progress = spring({
      frame,
      fps,
      config: { damping: 20, stiffness: 60 },
    });

    if (frame < morphDuration) {
      const radius = interpolate(progress, [0, 1], [startShape.radius, middleShape.radius]);
      clipPath = `circle(${radius}% at ${startShape.x}% ${startShape.y}%)`;
      morphOpacity = 1 - progress;
    }
  }

  if ((type === 'out' || type === 'both') && frame >= morphOutStart) {
    const localFrame = frame - morphOutStart;
    const progress = interpolate(localFrame, [0, morphDuration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    const radius = interpolate(progress, [0, 1], [middleShape.radius, endShape.radius]);
    // Reverse the clip for exit - shrink to nothing
    const exitRadius = interpolate(progress, [0, 1], [150, 0]);
    clipPath = `circle(${exitRadius}% at 50% 50%)`;
    morphOpacity = progress;
  }

  return (
    <>
      <AbsoluteFill style={{ clipPath }}>
        {children}
      </AbsoluteFill>

      {/* Morphing shape overlay */}
      {morphOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor,
            opacity: morphOpacity * 0.3,
            clipPath,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

// ============================================================================
// TRANSITION WRAPPER - Convenience component for applying transitions
// ============================================================================

export type TransitionType = 'fade' | 'slide' | 'zoom' | 'wipe' | 'morph';

interface TransitionWrapperProps {
  children: React.ReactNode;
  durationInFrames: number;
  transition: TransitionType;
  transitionDuration?: number;
  direction?: SlideDirection | WipeDirection;
  zoomMode?: ZoomMode;
}

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  durationInFrames,
  transition,
  transitionDuration = 30,
  direction = 'left',
  zoomMode = 'in',
}) => {
  switch (transition) {
    case 'fade':
      return (
        <FadeTransition durationInFrames={durationInFrames}>
          {children}
        </FadeTransition>
      );
    case 'slide':
      return (
        <SlideTransition
          durationInFrames={durationInFrames}
          direction={direction as SlideDirection}
        >
          {children}
        </SlideTransition>
      );
    case 'zoom':
      return (
        <ZoomTransition durationInFrames={durationInFrames} mode={zoomMode}>
          {children}
        </ZoomTransition>
      );
    case 'wipe':
      return (
        <WipeTransition
          durationInFrames={durationInFrames}
          direction={direction as WipeDirection}
        >
          {children}
        </WipeTransition>
      );
    case 'morph':
      return (
        <MorphTransition durationInFrames={durationInFrames}>
          {children}
        </MorphTransition>
      );
    default:
      return <AbsoluteFill>{children}</AbsoluteFill>;
  }
};

// ============================================================================
// CROSSFADE - For overlapping scenes
// ============================================================================

interface CrossfadeProps {
  children: React.ReactNode;
  durationInFrames: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
}

export const Crossfade: React.FC<CrossfadeProps> = ({
  children,
  durationInFrames,
  fadeInFrames = 20,
  fadeOutFrames = 20,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [0, fadeInFrames, durationInFrames - fadeOutFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};
