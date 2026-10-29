import { describe, expect, it } from "vitest"

import {
  dailyNewBars,
  niceMax,
  provinceRows,
  weekEnds,
  weeklyNew,
  zonesByNewCases,
} from "./chart-data"
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

describe("weekly series", () => {
  it("ends on the as-of date, one week apart", () => {
    expect(weekEnds("2026-10-27", 3)).toEqual(["2026-10-13", "2026-10-20", "2026-10-27"])
  })

  it("sums new cases in each 7-day window ending on the week end", () => {
    const points = [
      { date: "2026-10-13", reported: 1, effective: 1, new: 1 },
      { date: "2026-10-14", reported: 3, effective: 3, new: 2 },
      { date: "2026-10-20", reported: 7, effective: 7, new: 4 },
      { date: "2026-10-21", reported: 8, effective: 8, new: 1 },
    ]
    expect(weeklyNew(points, ["2026-10-13", "2026-10-20", "2026-10-27"])).toEqual([1, 6, 1])
  })
})

describe("zone tables", () => {
  const zones: Zones = {
    type: "FeatureCollection",
    features: [
      zone({ id: "a", nom: "A", province: "P1", status: "cleared", confirmed_cases: 5, last_case_date: "2026-08-01", last_report_date: "2026-10-27" }),
      zone({ id: "b", nom: "B", province: "P1", status: "active", new_14d: 2, prev_14d: 1, confirmed_cases: 9, confirmed_deaths: 3, last_case_date: "2026-10-27", last_report_date: "2026-10-27" }),
      zone({ id: "c", nom: "C", province: "P2", status: "active", new_14d: 9, confirmed_cases: 20, confirmed_deaths: null, last_case_date: "2026-10-27", last_report_date: "2026-10-27" }),
      zone({ id: "d", nom: "D" }),
      zone({ id: "e", nom: "E", stale: true }),
    ],
  }

  it("lists tracked zones by new cases, then all cases", () => {
    expect(zonesByNewCases(zones).map((z) => z.id)).toEqual(["c", "b", "a", "e"])
  })

  it("adds up provinces from zones that have had a case", () => {
    expect(provinceRows(zones)).toEqual([
      { province: "P2", active: 1, watch: 0, cleared: 0, confirmed_cases: 20, confirmed_deaths: 0, new_14d: 9, prev_14d: 0 },
      { province: "P1", active: 1, watch: 0, cleared: 1, confirmed_cases: 14, confirmed_deaths: 3, new_14d: 2, prev_14d: 1 },
    ])
  })
})

describe("niceMax", () => {
  it("rounds up to 1, 2, 2.5 or 5 times a power of ten", () => {
    expect(niceMax(903)).toBe(1000)
    expect(niceMax(187)).toBe(200)
    expect(niceMax(22)).toBe(25)
    expect(niceMax(0)).toBe(1)
  })
})
