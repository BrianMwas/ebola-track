import { describe, expect, it } from "vitest"

import {
  addDays,
  classify,
  computeZoneStatus,
  daysBetween,
  isDatasetStale,
  toEffectiveSeries,
  trendOf,
  type SeriesPoint,
} from "./status"

const AS_OF = "2026-10-27"

/** A daily series from `start` to `end` where `valueOn(date)` gives the cumulative value. */
function daily(
  start: string,
  end: string,
  valueOn: (date: string) => number | null
): SeriesPoint[] {
  const out: SeriesPoint[] = []
  for (let d = start; daysBetween(d, end) >= 0; d = addDays(d, 1)) {
    out.push({ date: d, value: valueOn(d) })
  }
  return out
}

describe("fixtures from the brief", () => {
  it("a zone with a recent case is active", () => {
    const s = daily("2026-09-01", AS_OF, (d) => (d < "2026-10-25" ? 10 : 12))
    const r = computeZoneStatus(s, AS_OF)
    expect(r.status).toBe("active")
    expect(r.last_case_date).toBe("2026-10-25")
    expect(r.days_since_last_case).toBe(2)
    expect(r.days_to_cleared).toBeNull()
    expect(r.confirmed_cases).toBe(12)
    expect(r.new_14d).toBe(2)
    expect(r.stale).toBe(false)
  })

  it("a zone that just turned watch (22 days) shows days to cleared", () => {
    const lastCase = addDays(AS_OF, -22)
    const s = daily("2026-09-01", AS_OF, (d) => (d < lastCase ? 3 : 4))
    const r = computeZoneStatus(s, AS_OF)
    expect(r.status).toBe("watch")
    expect(r.days_since_last_case).toBe(22)
    expect(r.days_to_cleared).toBe(21)
  })

  it("a zone that just turned cleared (43 days) has no countdown", () => {
    const lastCase = addDays(AS_OF, -43)
    const s = daily("2026-08-01", AS_OF, (d) => (d < lastCase ? 1 : 2))
    const r = computeZoneStatus(s, AS_OF)
    expect(r.status).toBe("cleared")
    expect(r.days_since_last_case).toBe(43)
    expect(r.days_to_cleared).toBeNull()
  })

  it("a cumulative drop is a revision, never negative cases", () => {
    const s: SeriesPoint[] = [
      { date: "2026-10-01", value: 5 },
      { date: "2026-10-02", value: 8 },
      { date: "2026-10-03", value: 6 },
      { date: "2026-10-04", value: 6 },
      { date: "2026-10-05", value: 7 },
    ]
    const r = computeZoneStatus(s, "2026-10-05")
    expect(r.revisions).toEqual([
      {
        date: "2026-10-03",
        value: 6,
        previous_date: "2026-10-02",
        previous_value: 8,
      },
    ])
    // Status uses the running maximum: the recovery to 7 is not a new case.
    expect(r.last_case_date).toBe("2026-10-02")
    expect(r.confirmed_cases).toBe(7)
    expect(r.confirmed_cases_effective).toBe(8)
    const { points } = toEffectiveSeries(s)
    expect(points.map((p) => p.new)).toEqual([5, 3, 0, 0, 0])
    expect(points.every((p) => p.new >= 0)).toBe(true)
  })

  it("a gap in dates carries the last value forward", () => {
    const s: SeriesPoint[] = [
      { date: "2026-09-20", value: 4 },
      { date: "2026-10-10", value: 9 },
      // nothing reported 2026-10-11 .. 2026-10-26
      { date: AS_OF, value: 9 },
    ]
    const r = computeZoneStatus(s, AS_OF)
    expect(r.last_case_date).toBe("2026-10-10")
    expect(r.days_since_last_case).toBe(17)
    expect(r.status).toBe("active")
    // 14 days before 27 Oct is 13 Oct: the 9 reported on 10 Oct carries forward.
    expect(r.new_14d).toBe(0)
    expect(r.prev_14d).toBe(5)
  })

  it("a zone with no cases is never", () => {
    const tracked = computeZoneStatus(
      daily("2026-10-01", AS_OF, () => 0),
      AS_OF
    )
    expect(tracked.status).toBe("never")
    expect(tracked.last_case_date).toBeNull()
    expect(tracked.days_since_last_case).toBeNull()
    expect(tracked.trend).toBe("flat")

    const untracked = computeZoneStatus([], AS_OF)
    expect(untracked.status).toBe("never")
    expect(untracked.stale).toBe(false)
    expect(untracked.confirmed_cases).toBe(0)
  })
})

describe("thresholds", () => {
  it.each([
    [0, "active"],
    [21, "active"],
    [22, "watch"],
    [42, "watch"],
    [43, "cleared"],
    [null, "never"],
  ] as const)("%s days since last case -> %s", (days, status) => {
    expect(classify(days)).toBe(status)
  })

  it("day 42 is the last watch day, with 1 day to cleared", () => {
    const lastCase = addDays(AS_OF, -42)
    const s = daily("2026-09-01", AS_OF, (d) => (d < lastCase ? 0 : 1))
    const r = computeZoneStatus(s, AS_OF)
    expect(r.status).toBe("watch")
    expect(r.days_to_cleared).toBe(1)
  })

  it("the first report counts as a case date when it is above zero", () => {
    const r = computeZoneStatus([{ date: "2026-10-20", value: 13 }], AS_OF)
    expect(r.last_case_date).toBe("2026-10-20")
    expect(r.new_14d).toBe(13)
  })

  it("a rise later revised away still counts as a case date", () => {
    const s: SeriesPoint[] = [
      { date: "2026-09-01", value: 11 },
      { date: "2026-10-06", value: 12 },
      { date: "2026-10-12", value: 11 },
      { date: AS_OF, value: 11 },
    ]
    const r = computeZoneStatus(s, AS_OF)
    expect(r.last_case_date).toBe("2026-10-06")
    expect(r.days_since_last_case).toBe(21)
    expect(r.status).toBe("active")
    expect(r.confirmed_cases).toBe(11)
    expect(r.revisions).toHaveLength(1)
  })
})

describe("trend", () => {
  it.each([
    [20, 10, "up"],
    [10, 20, "down"],
    [100, 95, "flat"],
    [100, 89, "up"],
    [4, 0, "flat"],
    [5, 0, "up"],
    [0, 0, "flat"],
  ] as const)("%s vs %s -> %s", (current, previous, trend) => {
    expect(trendOf(current, previous)).toBe(trend)
  })

  it("compares the last 14 days with the 14 days before", () => {
    const s = daily("2026-09-01", AS_OF, (d) => {
      if (d <= addDays(AS_OF, -28)) return 100
      if (d <= addDays(AS_OF, -14)) return 110
      return 140
    })
    const r = computeZoneStatus(s, AS_OF)
    expect(r.prev_14d).toBe(10)
    expect(r.new_14d).toBe(30)
    expect(r.trend).toBe("up")
  })
})

describe("missing values and staleness", () => {
  it("ignores ND (null) values", () => {
    const s: SeriesPoint[] = [
      { date: "2026-10-20", value: 3 },
      { date: "2026-10-21", value: null },
      { date: AS_OF, value: 3 },
    ]
    const r = computeZoneStatus(s, AS_OF)
    expect(r.confirmed_cases).toBe(3)
    expect(r.stale).toBe(false)
  })

  it("a tracked zone with no value on the as-of date is stale", () => {
    const s: SeriesPoint[] = [
      { date: "2026-10-20", value: 3 },
      { date: AS_OF, value: null },
    ]
    const r = computeZoneStatus(s, AS_OF)
    expect(r.stale).toBe(true)
    expect(r.last_report_date).toBe("2026-10-20")
  })

  it("a zone with only ND values is never and stale", () => {
    const r = computeZoneStatus(
      [
        { date: "2026-05-28", value: null },
        { date: "2026-06-03", value: null },
      ],
      AS_OF
    )
    expect(r.status).toBe("never")
    expect(r.stale).toBe(true)
    expect(r.last_report_date).toBeNull()
  })

  it("rejects duplicate dates and negative values", () => {
    expect(() =>
      toEffectiveSeries([
        { date: "2026-10-01", value: 1 },
        { date: "2026-10-01", value: 2 },
      ])
    ).toThrow(/Duplicate/)
    expect(() => toEffectiveSeries([{ date: "2026-10-01", value: -1 }])).toThrow()
  })

  it("the dataset is stale when the as-of date is more than 2 days old", () => {
    expect(isDatasetStale("2026-10-27", new Date(2026, 9, 29, 23, 0))).toBe(false)
    expect(isDatasetStale("2026-10-27", new Date(2026, 9, 30, 0, 30))).toBe(true)
  })
})
