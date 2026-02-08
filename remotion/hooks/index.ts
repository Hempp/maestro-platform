/**
 * Optimized animation hooks for Remotion
 */

export {
  // Spring hooks
  useSpringOnce,
  useSpringOnceWithDelay,

  // Interpolation hooks
  useInterpolateRange,
  useFadeIn,
  useFadeOut,

  // Accessibility hooks
  usePrefersReducedMotion,
  useReducedMotionValue,

  // Throttle hooks
  useFrameThrottle,
  useKeyframeValue,

  // Composite animation hooks
  useSlideIn,
  useScaleIn,
  useStaggeredItem,

  // Loop animation hooks
  useLoopProgress,
  useOscillate,
  usePulse,

  // Debug hooks
  useAnimationPerformance,

  // Types
  type SpringOnceConfig,
  type InterpolateRangeConfig,
  type ThrottleConfig,
} from './useOptimizedAnimation';
