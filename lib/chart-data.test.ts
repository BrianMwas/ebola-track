import { describe, expect, it } from "vitest"

import { dailyNewBars, statusSquares } from "./chart-data"
import type { Timeseries, Zones, ZoneProperties } from "./schema"

describe("dailyNewBars", () => {
  const ts: Timeseries = {
    id: "z",
    nom: "Z",
    data_as_of: "2026-10-27",
    metric: "cumulative_confirmed_cases",
    points: [
      { date: "2026-09-01", reported: 3, effective: 3, new: 3 },
      { date: "2026-10-13", reported: 5, effective: 5, new: 2 },
      { date: "2026-10-14", reported: 5, effective: 5, new: 0 },
      { date: "2026-10-27", reported: 9, effective: 9, new: 4 },
    ],
  }

  it("covers each calendar day and marks missing reports as null", () => {
    const bars = dailyNewBars(ts, "2026-10-27", 60)
    expect(bars).toHaveLength(60)
    expect(bars[0].date).toBe("2026-08-29")
    expect(bars.at(-1)).toEqual({ date: "2026-10-27", new: 4, recent: true })
    expect(bars.find((b) => b.date === "2026-10-20")?.new).toBeNull()
  })

  it("marks exactly the last 14 days as recent", () => {
    const bars = dailyNewBars(ts, "2026-10-27", 60)
    expect(bars.filter((b) => b.recent)).toHaveLength(14)
    expect(bars.find((b) => b.date === "2026-10-13")?.recent).toBe(false)
    expect(bars.find((b) => b.date === "2026-10-14")?.recent).toBe(true)
  })
})

describe("statusSquares", () => {
  const zone = (p: Partial<ZoneProperties>): Zones["features"][number] => ({
    type: "Feature",
    id: p.id!,
    geometry: { type: "Polygon", coordinates: [] },
    properties: {
      id: "x",
      nom: "X",
      province: "P",
      status: "never",
      confirmed_cases: 0,
      confirmed_cases_effective: 0,
      confirmed_deaths: null,
      new_14d: 0,
      prev_14d: 0,
      trend: "flat",
      last_case_date: null,
      days_since_last_case: null,
      days_to_cleared: null,
      last_report_date: null,
      stale: false,
      revised: false,
      population: null,
      label_point: [0, 0],
      ...p,
    },
  })

  it("keeps only tracked zones and orders by status then new cases", () => {
    const zones: Zones = {
      type: "FeatureCollection",
      features: [
        zone({ id: "a", nom: "A", status: "cleared", last_report_date: "2026-10-27" }),
        zone({ id: "b", nom: "B", status: "active", new_14d: 2, last_report_date: "2026-10-27" }),
        zone({ id: "c", nom: "C", status: "active", new_14d: 9, last_report_date: "2026-10-27" }),
        zone({ id: "d", nom: "D" }),
        zone({ id: "e", nom: "E", stale: true }),
      ],
    }
    expect(statusSquares(zones).map((s) => s.id)).toEqual(["c", "b", "a", "e"])
  })
})
