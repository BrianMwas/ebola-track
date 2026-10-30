/**
 * Chart and table inputs derived from the snapshot. Kept separate from the
 * components so a different chart can take the same data.
 */
import type { Timeseries, Weekly, ZoneProperties, Zones } from "./schema"
import { addDays, daysBetween, TREND_WINDOW_DAYS } from "./status"

export type DailyBar = {
  date: string
  /** New confirmed cases attributed to this report date; null = no report that day. */
  new: number | null
  /** Inside the last 14 days ending on the as-of date. */
  recent: boolean
}

/** One bar per calendar day for the `days` days ending on `asOf`. */
export function dailyNewBars(
  ts: Timeseries,
  asOf: string,
  days = 60
): DailyBar[] {
  const byDate = new Map(ts.points.map((p) => [p.date, p.new]))
  const out: DailyBar[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(asOf, -i)
    out.push({
      date,
      new: byDate.get(date) ?? null,
      recent: daysBetween(date, asOf) < TREND_WINDOW_DAYS,
    })
  }
  return out
}

/** Weeks of history in weekly.json. */
export const WEEKLY_WEEKS = 18

/** The last day of each 7-day window ending on `asOf`, oldest first. */
export function weekEnds(asOf: string, weeks = WEEKLY_WEEKS): string[] {
  return Array.from({ length: weeks }, (_, i) => addDays(asOf, -7 * (weeks - 1 - i)))
}

/** New confirmed cases in each 7-day window (end - 6 to end) for the given week ends. */
export function weeklyNew(
  points: Timeseries["points"],
  ends: string[]
): number[] {
  return ends.map((end) =>
    points.reduce((sum, p) => {
      const back = daysBetween(p.date, end)
      return back >= 0 && back < 7 ? sum + p.new : sum
    }, 0)
  )
}

/** weekly.json: the zone total and each tracked zone, over the same weeks. */
export function buildWeekly(series: Timeseries[], asOf: string): Weekly {
  const ends = weekEnds(asOf)
  const zones: Record<string, number[]> = {}
  const total = ends.map(() => 0)
  for (const ts of series) {
    const values = weeklyNew(ts.points, ends)
    zones[ts.id] = values
    values.forEach((v, i) => (total[i] += v))
  }
  return { data_as_of: asOf, week_ends: ends, zone_total: total, zones }
}

/** Zones that appear in the INSP tables (have a report date). */
export function trackedZones(zones: Zones): ZoneProperties[] {
  return zones.features
    .map((f) => f.properties)
    .filter((p) => p.last_report_date !== null || p.stale)
}

/** Tracked zones by new cases in the last 14 days, then by all cases. */
export function zonesByNewCases(zones: Zones): ZoneProperties[] {
  return trackedZones(zones).sort(
    (a, b) =>
      b.new_14d - a.new_14d ||
      b.confirmed_cases - a.confirmed_cases ||
      a.nom.localeCompare(b.nom)
  )
}

export type ProvinceRow = {
  province: string
  active: number
  watch: number
  cleared: number
  confirmed_cases: number
  /** Sum of zones that report deaths. */
  confirmed_deaths: number
  new_14d: number
  prev_14d: number
}

/** Provinces with at least one zone that has had a confirmed case, busiest first. */
export function provinceRows(zones: Zones): ProvinceRow[] {
  const rows = new Map<string, ProvinceRow>()
  for (const { properties: p } of zones.features) {
    if (p.status === "never") continue
    const row = rows.get(p.province) ?? {
      province: p.province,
      active: 0,
      watch: 0,
      cleared: 0,
      confirmed_cases: 0,
      confirmed_deaths: 0,
      new_14d: 0,
      prev_14d: 0,
    }
    row[p.status]++
    row.confirmed_cases += p.confirmed_cases
    row.confirmed_deaths += p.confirmed_deaths ?? 0
    row.new_14d += p.new_14d
    row.prev_14d += p.prev_14d
    rows.set(p.province, row)
  }
  return [...rows.values()].sort(
    (a, b) =>
      b.new_14d - a.new_14d ||
      b.confirmed_cases - a.confirmed_cases ||
      a.province.localeCompare(b.province)
  )
}

/** A round axis maximum at or above `value` (1, 2, 2.5 or 5 times a power of ten). */
export function niceMax(value: number): number {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value)!
  return step * power
}
