/** A small picture that proves a stat. */
export type StatVisual =
  | { kind: "trend"; values: number[] }
  | { kind: "uptime"; days: number[] }
  /** Bars over 0 to `max`; bars left of `marker` are inked. */
  | { kind: "distribution"; bins: number[]; max: number; marker: number }

export interface Stat {
  label: string
  value: number
  decimals?: number
  /** "compact" counts inside its final unit (0.0M to 2.3M). */
  notation?: "standard" | "compact"
  prefix?: string
  suffix?: string
  /** The line under the number. */
  detail?: string
  /** Replaces the detail line on hover or focus. */
  context?: string
  visual?: StatVisual
}

/** Shown when no stats are passed. */
export const stats: Stat[] = [
  { label: "Example", value: 1280, detail: "Pass your own stats", visual: { kind: "trend", values: [2, 3, 3, 5, 8, 13] } },
]
