/**
 * Shared motion values for the animated components (data table, metric card,
 * stats band). Durations are in seconds, as motion expects.
 */
export const motionTokens = {
  duration: {
    instant: 0.12,
    fast: 0.18,
    standard: 0.32,
  },
  ease: {
    /** Things arriving: quick start, long settle. */
    enter: [0.2, 0.7, 0.2, 1] as const,
    /** Things leaving or changing in place. */
    standard: [0.4, 0, 0.2, 1] as const,
  },
  /** Pixels of blur on text that is arriving (soft) or leaving (subtle). */
  blur: {
    subtle: 2,
    soft: 4,
  },
  spring: {
    /** Widths and shapes easing to a new size. */
    morph: { type: "spring", stiffness: 380, damping: 36, mass: 0.9 },
    /** Small controls: arrows, checks. */
    snappy: { type: "spring", stiffness: 520, damping: 34 },
    /** Rows passing each other when a table re-sorts. */
    smooth: { type: "spring", stiffness: 300, damping: 34, mass: 0.9 },
  },
} as const
