/**
 * Zone status from a daily cumulative confirmed-case series.
 *
 * Everything is measured against `dataAsOf` (the latest report date in the
 * whole dataset), never against today's date, because reports lag.
 *
 * Thresholds follow WHO's 21-day maximum incubation period and the 42-day
 * (2 x 21) end-of-outbreak rule. "Cleared" is this app's label for a health
 * zone; it is not an official end-of-outbreak declaration.
 */

export const ACTIVE_MAX_DAYS = 21
export const WATCH_MAX_DAYS = 42
export const TREND_WINDOW_DAYS = 14
/** Change within this fraction of the larger window counts as "flat". */
export const TREND_FLAT_RATIO = 0.1
/** When both 14-day windows are below this many cases, the trend is "flat". */
export const TREND_TINY_COUNT = 5
/** The dataset counts as stale when its latest report date is older than this. */
export const DATASET_STALE_DAYS = 2

export type ZoneStatus = "active" | "watch" | "cleared" | "never"
export type Trend = "up" | "flat" | "down"

/** One report-date value; `null` means the zone was listed but not reported (ND). */
export type SeriesPoint = { date: string; value: number | null }

export type EffectivePoint = {
  date: string
  /** The value as published (may fall when a bulletin revises it). */
  reported: number
  /** Running maximum of `reported`, used for status so revisions never create negative cases. */
  effective: number
  /** Cases attributed to this report date: `effective` minus the previous `effective`. */
  new: number
}

export type Revision = {
  date: string
  value: number
  previous_date: string
  previous_value: number
}

export type ZoneStatusResult = {
  status: ZoneStatus
  /** Latest published cumulative value (0 when there is no valid value). */
  confirmed_cases: number
  /** Running maximum of the published series at `dataAsOf`. */
  confirmed_cases_effective: number
  last_case_date: string | null
  days_since_last_case: number | null
  /** Watch zones only: days until the zone counts as cleared if no case is reported. */
  days_to_cleared: number | null
  new_14d: number
  prev_14d: number
  trend: Trend
  /** Last report date with a valid value. */
  last_report_date: string | null
  /** True when a tracked zone has no valid value on `dataAsOf`. */
  stale: boolean
  revisions: Revision[]
}

const DAY_MS = 86_400_000
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function toUtcMs(date: string): number {
  if (!ISO_DATE.test(date)) throw new Error(`Not an ISO date: ${date}`)
  const ms = Date.parse(`${date}T00:00:00Z`)
  if (Number.isNaN(ms)) throw new Error(`Not a valid date: ${date}`)
  return ms
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS)
}

export function addDays(date: string, days: number): string {
  return new Date(toUtcMs(date) + days * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Drop unreported points, sort by date and apply the running maximum.
 * A fall in the published value is recorded as a revision.
 */
export function toEffectiveSeries(points: SeriesPoint[]): {
  points: EffectivePoint[]
  revisions: Revision[]
} {
  const valid = points
    .filter((p): p is { date: string; value: number } => p.value !== null)
    .sort((a, b) => toUtcMs(a.date) - toUtcMs(b.date))

  const out: EffectivePoint[] = []
  const revisions: Revision[] = []
  let runningMax = 0
  let previous: { date: string; value: number } | null = null

  for (const p of valid) {
    if (!Number.isInteger(p.value) || p.value < 0) {
      throw new Error(`Invalid cumulative value ${p.value} on ${p.date}`)
    }
    if (previous && previous.date === p.date) {
      throw new Error(`Duplicate report date ${p.date}`)
    }
    if (previous && p.value < previous.value) {
      revisions.push({
        date: p.date,
        value: p.value,
        previous_date: previous.date,
        previous_value: previous.value,
      })
    }
    const effective = Math.max(runningMax, p.value)
    out.push({
      date: p.date,
      reported: p.value,
      effective,
      new: effective - runningMax,
    })
    runningMax = effective
    previous = p
  }
  return { points: out, revisions }
}

/** Effective cumulative value on `date`, carrying the last report forward. */
export function effectiveAt(points: EffectivePoint[], date: string): number {
  const target = toUtcMs(date)
  let value = 0
  for (const p of points) {
    if (toUtcMs(p.date) > target) break
    value = p.effective
  }
  return value
}

/** The most recent report date on which the effective cumulative value rose. */
export function lastCaseDate(points: EffectivePoint[]): string | null {
  let last: string | null = null
  for (const p of points) if (p.new > 0) last = p.date
  return last
}

export function classify(daysSinceLastCase: number | null): ZoneStatus {
  if (daysSinceLastCase === null) return "never"
  if (daysSinceLastCase <= ACTIVE_MAX_DAYS) return "active"
  if (daysSinceLastCase <= WATCH_MAX_DAYS) return "watch"
  return "cleared"
}

export function trendOf(current: number, previous: number): Trend {
  const larger = Math.max(current, previous)
  if (larger < TREND_TINY_COUNT) return "flat"
  if (Math.abs(current - previous) <= TREND_FLAT_RATIO * larger) return "flat"
  return current > previous ? "up" : "down"
}

export function computeZoneStatus(
  series: SeriesPoint[],
  dataAsOf: string
): ZoneStatusResult {
  const inRange = series.filter((p) => daysBetween(p.date, dataAsOf) >= 0)
  const { points, revisions } = toEffectiveSeries(inRange)

  const last = points.at(-1) ?? null
  const lastCase = lastCaseDate(points)
  const daysSince = lastCase === null ? null : daysBetween(lastCase, dataAsOf)
  const status = classify(daysSince)

  const w = TREND_WINDOW_DAYS
  const now = effectiveAt(points, dataAsOf)
  const before = effectiveAt(points, addDays(dataAsOf, -w))
  const beforeThat = effectiveAt(points, addDays(dataAsOf, -2 * w))
  const new14 = now - before
  const prev14 = before - beforeThat

  return {
    status,
    confirmed_cases: last?.reported ?? 0,
    confirmed_cases_effective: now,
    last_case_date: lastCase,
    days_since_last_case: daysSince,
    days_to_cleared:
      status === "watch" && daysSince !== null
        ? WATCH_MAX_DAYS + 1 - daysSince
        : null,
    new_14d: new14,
    prev_14d: prev14,
    trend: trendOf(new14, prev14),
    last_report_date: last?.date ?? null,
    stale: series.length > 0 && last?.date !== dataAsOf,
    revisions,
  }
}

/** The viewer's local calendar date as YYYY-MM-DD. */
export function localIsoDate(now: Date): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Dataset-level staleness: the latest report date is more than 2 calendar days old. */
export function isDatasetStale(dataAsOf: string, now: Date): boolean {
  return daysBetween(dataAsOf, localIsoDate(now)) > DATASET_STALE_DAYS
}
