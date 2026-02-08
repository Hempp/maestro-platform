/**
 * Custom hooks for optimized Remotion animations
 * Provides memoized and performance-optimized animation hooks
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from 'remotion';
import {
  preCalculateSpring,
  SPRING_PRESETS,
  memoizedInterpolate,
  frameSkip,
  animateOpacity,
  animateSlideUp,
  animateScale,
  type SpringConfig,
} from '../utils/performance';

// ============================================================================
// Types
// ============================================================================

export interface SpringOnceConfig {
  config?: SpringConfig | keyof typeof SPRING_PRESETS;
  delay?: number;
  durationInFrames?: number;
}

export interface InterpolateRangeConfig {
  inputRange: readonly number[];
  outputRange: readonly number[];
  extrapolateLeft?: 'clamp' | 'extend';
  extrapolateRight?: 'clamp' | 'extend';
  easing?: (t: number) => number;
}

export interface ThrottleConfig {
  interval: number;
  smooth?: boolean;
}

// ============================================================================
// useSpringOnce
// ============================================================================

/**
 * Spring animation that pre-calculates values once and caches them
 * Much faster for repeated use than recalculating spring physics every frame
 *
 * @example
 * const scale = useSpringOnce({ config: 'bouncy', delay: 30 });
 */
export function useSpringOnce(options: SpringOnceConfig = {}): number {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const {
    config = 'gentle',
    delay = 0,
    durationInFrames: customDuration,
  } = options;

  // Resolve config from preset or use custom
  const resolvedConfig = useMemo(
    () => (typeof config === 'string' ? SPRING_PRESETS[config] : config),
    [config]
  );

  // Pre-calculate spring values for entire duration
  const cachedSpring = useMemo(() => {
    const duration = customDuration ?? Math.min(durationInFrames - delay, 60); // Default max 2 seconds at 30fps
    return preCalculateSpring(fps, resolvedConfig, duration);
  }, [fps, resolvedConfig, customDuration, durationInFrames, delay]);

  // Get value for current frame
  const adjustedFrame = Math.max(0, frame - delay);
  return cachedSpring.getValue(adjustedFrame);
}

/**
 * Like useSpringOnce but returns 0 until delay is reached
 * Useful for staggered animations where you want elements to start at 0
 */
export function useSpringOnceWithDelay(options: SpringOnceConfig = {}): number {
  const frame = useCurrentFrame();
  const { delay = 0 } = options;
  const springValue = useSpringOnce(options);

  if (frame < delay) {
    return 0;
  }

  return springValue;
}

// ============================================================================
// useInterpolateRange
// ============================================================================

/**
 * Memoized interpolate hook that caches configuration
 * Avoids recreating interpolation config on every render
 *
 * @example
 * const opacity = useInterpolateRange({
 *   inputRange: [0, 30],
 *   outputRange: [0, 1],
 *   extrapolateRight: 'clamp'
 * });
 */
export function useInterpolateRange(config: InterpolateRangeConfig): number {
  const frame = useCurrentFrame();

  const { inputRange, outputRange, extrapolateLeft = 'extend', extrapolateRight = 'extend', easing } = config;

  // Memoize the interpolation options
  const options = useMemo(
    () => ({
      extrapolateLeft,
      extrapolateRight,
      easing,
    }),
    [extrapolateLeft, extrapolateRight, easing]
  );

  // Use memoized interpolate for caching
  return useMemo(
    () => memoizedInterpolate(frame, inputRange, outputRange, options),
    [frame, inputRange, outputRange, options]
  );
}

/**
 * Convenience hook for fade-in animations
 */
export function useFadeIn(startFrame: number, duration: number = 20): number {
  return useInterpolateRange({
    inputRange: [startFrame, startFrame + duration],
    outputRange: [0, 1],
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

/**
 * Convenience hook for fade-out animations
 */
export function useFadeOut(startFrame: number, duration: number = 20): number {
  return useInterpolateRange({
    inputRange: [startFrame, startFrame + duration],
    outputRange: [1, 0],
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

// ============================================================================
// usePrefersReducedMotion
// ============================================================================

/**
 * Accessibility hook that detects user's reduced motion preference
 * Returns true if user prefers reduced motion
 *
 * When reduced motion is preferred:
 * - Skip complex animations
 * - Use simple fades instead of springs
 * - Reduce particle effects
 *
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion();
 * const scale = prefersReducedMotion ? 1 : springValue;
 */
export function usePrefersReducedMotion(): boolean {
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;

    const handler = (event: MediaQueryListEvent) => {
      prefersReducedMotion.current = event.matches;
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }

    // Fallback for older browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, []);

  return prefersReducedMotion.current;
}

/**
 * Hook that provides reduced motion alternatives
 * Returns original value or reduced alternative based on user preference
 */
export function useReducedMotionValue<T>(fullMotionValue: T, reducedMotionValue: T): T {
  const prefersReducedMotion = usePrefersReducedMotion();
  return prefersReducedMotion ? reducedMotionValue : fullMotionValue;
}

// ============================================================================
// useFrameThrottle
// ============================================================================

/**
 * Throttle frame updates to specific intervals
 * Useful for expensive calculations that don't need per-frame updates
 *
 * @example
 * // Only update every 3 frames
 * const throttledFrame = useFrameThrottle({ interval: 3 });
 *
 * @example
 * // Smooth interpolation between throttled frames
 * const smoothThrottledFrame = useFrameThrottle({ interval: 3, smooth: true });
 */
export function useFrameThrottle(config: ThrottleConfig): number {
  const frame = useCurrentFrame();
  const { interval, smooth = false } = config;

  return useMemo(() => {
    if (smooth) {
      // Interpolate smoothly between keyframes
      const lowerFrame = Math.floor(frame / interval) * interval;
      const upperFrame = lowerFrame + interval;
      const progress = (frame - lowerFrame) / interval;
      const easedProgress = Easing.inOut(Easing.ease)(progress);
      return lowerFrame + easedProgress * (upperFrame - lowerFrame);
    }
    return frameSkip(frame, interval);
  }, [frame, interval, smooth]);
}

/**
 * Returns a stable value that only changes on keyframes
 * Useful for preventing expensive re-renders
 */
export function useKeyframeValue<T>(
  getValue: (frame: number) => T,
  interval: number
): T {
  const frame = useCurrentFrame();
  const keyframe = Math.floor(frame / interval) * interval;

  return useMemo(() => getValue(keyframe), [keyframe, getValue]);
}

// ============================================================================
// Composite Animation Hooks
// ============================================================================

/**
 * Combined opacity and slide animation
 * Returns { opacity, translateY } for CSS transforms
 */
export function useSlideIn(
  startFrame: number,
  options: { duration?: number; distance?: number } = {}
): { opacity: number; translateY: number } {
  const frame = useCurrentFrame();
  const { duration = 20, distance = 30 } = options;

  return useMemo(() => ({
    opacity: animateOpacity(frame, startFrame, duration),
    translateY: animateSlideUp(frame, startFrame, duration, distance),
  }), [frame, startFrame, duration, distance]);
}

/**
 * Combined opacity and scale animation
 * Returns { opacity, scale } for CSS transforms
 */
export function useScaleIn(
  startFrame: number,
  options: { duration?: number; fromScale?: number } = {}
): { opacity: number; scale: number } {
  const frame = useCurrentFrame();
  const { duration = 20, fromScale = 0.8 } = options;

  return useMemo(() => ({
    opacity: animateOpacity(frame, startFrame, duration),
    scale: animateScale(frame, startFrame, duration, fromScale),
  }), [frame, startFrame, duration, fromScale]);
}

/**
 * Staggered list item animation
 * Returns animation values for a specific item in a list
 */
export function useStaggeredItem(
  index: number,
  baseDelay: number = 0,
  staggerInterval: number = 8
): { opacity: number; scale: number; isVisible: boolean } {
  const frame = useCurrentFrame();
  const delay = baseDelay + index * staggerInterval;

  return useMemo(() => {
    const isVisible = frame >= delay;
    return {
      opacity: animateOpacity(frame, delay, 15),
      scale: animateScale(frame, delay, 20, 0),
      isVisible,
    };
  }, [frame, delay]);
}

// ============================================================================
// Loop Animation Hooks
// ============================================================================

/**
 * Create a looping progress value (0 to 1)
 */
export function useLoopProgress(durationInFrames: number): number {
  const frame = useCurrentFrame();
  return useMemo(() => (frame % durationInFrames) / durationInFrames, [frame, durationInFrames]);
}

/**
 * Create an oscillating value (-1 to 1)
 */
export function useOscillate(frequency: number = 0.1, phase: number = 0): number {
  const frame = useCurrentFrame();
  return useMemo(() => Math.sin((frame + phase) * frequency), [frame, frequency, phase]);
}

/**
 * Create a pulsing value (0 to 1 to 0)
 */
export function usePulse(durationInFrames: number): number {
  const frame = useCurrentFrame();
  return useMemo(() => {
    const t = (frame % durationInFrames) / durationInFrames;
    return Math.sin(t * Math.PI);
  }, [frame, durationInFrames]);
}

// ============================================================================
// Performance Monitoring Hook
// ============================================================================

/**
 * Debug hook for monitoring animation performance
 * Only logs in development mode
 */
export function useAnimationPerformance(componentName: string): void {
  const frame = useCurrentFrame();
  const lastRenderTime = useRef<number>(0);
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const now = performance.now();
    if (lastRenderTime.current > 0) {
      const renderTime = now - lastRenderTime.current;
      renderTimes.current.push(renderTime);

      // Keep last 30 render times
      if (renderTimes.current.length > 30) {
        renderTimes.current = renderTimes.current.slice(-30);
      }

      // Log every 30 frames
      if (frame % 30 === 0) {
        const avg = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
        const max = Math.max(...renderTimes.current);
        console.log(
          `[${componentName}] Frame ${frame} - Avg render: ${avg.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`
        );
      }
    }
    lastRenderTime.current = now;
  }, [frame, componentName]);
}

// ============================================================================
// Exports
// ============================================================================

export default {
  // Spring hooks
  useSpringOnce,
  useSpringOnceWithDelay,

  // Interpolation hooks
  useInterpolateRange,
  useFadeIn,
  useFadeOut,

  // Accessibility
  usePrefersReducedMotion,
  useReducedMotionValue,

  // Throttle
  useFrameThrottle,
  useKeyframeValue,

  // Composite
  useSlideIn,
  useScaleIn,
  useStaggeredItem,

  // Loop
  useLoopProgress,
  useOscillate,
  usePulse,

  // Debug
  useAnimationPerformance,
};
