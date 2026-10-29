/**
 * Chart inputs derived from the snapshot. Kept separate from the chart
 * components so a different chart card can take the same data.
 */
import type { Timeseries, Zones } from "./schema"
import { addDays, daysBetween, TREND_WINDOW_DAYS, type ZoneStatus } from "./status"

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

export type StatusSquare = {
  id: string
  nom: string
  status: ZoneStatus
  stale: boolean
  new14: number
}

const RANK: Record<ZoneStatus, number> = { active: 0, watch: 1, cleared: 2, never: 3 }

/**
 * One square per zone that appears in the INSP tables (has a report date),
 * ordered by status, then by new cases in the last 14 days.
 */
export function statusSquares(zones: Zones): StatusSquare[] {
  return zones.features
    .map((f) => f.properties)
    .filter((p) => p.last_report_date !== null || p.stale)
    .map((p) => ({
      id: p.id,
      nom: p.nom,
      status: p.status,
      stale: p.stale,
      new14: p.new_14d,
    }))
    .sort(
      (a, b) =>
        RANK[a.status] - RANK[b.status] ||
        b.new14 - a.new14 ||
        a.nom.localeCompare(b.nom)
    )
}
