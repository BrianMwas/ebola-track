/**
 * Checks on the committed snapshot in public/data/. Skipped when the
 * snapshot has not been built.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  ContextSchema,
  LatestSchema,
  ProvenanceSchema,
  SummarySchema,
  TimeseriesSchema,
  ZonesSchema,
} from "./schema"

const DIR = path.join(process.cwd(), "public", "data")
const read = (f: string) => JSON.parse(readFileSync(path.join(DIR, f), "utf8"))

describe.skipIf(!existsSync(path.join(DIR, "latest.json")))("snapshot", () => {
  const latest = LatestSchema.parse(read("latest.json"))
  const summary = SummarySchema.parse(read("summary.json"))
  const zones = ZonesSchema.parse(read("zones.geojson"))
  const drc = summary.countries.find((c) => c.iso3 === "COD")!

  it("every output file matches the contract", () => {
    expect(() => ContextSchema.parse(read("context.geojson"))).not.toThrow()
    expect(() => ProvenanceSchema.parse(read("provenance.json"))).not.toThrow()
    for (const f of readdirSync(path.join(DIR, "timeseries"))) {
      expect(() => TimeseriesSchema.parse(read(`timeseries/${f}`))).not.toThrow()
    }
  })

  it("zone values are zone-grain: they plus the unassigned gap make the national total", () => {
    const z = drc.zones!
    const zoneSum = zones.features.reduce(
      (s, f) => s + f.properties.confirmed_cases,
      0
    )
    expect(zoneSum).toBe(z.zone_sum_cases)
    expect(zoneSum + z.unassigned_cases).toBe(drc.confirmed_cases)
    // A broadcast national or province figure would repeat the same large value on many zones.
    expect(
      zones.features.some((f) => f.properties.confirmed_cases === drc.confirmed_cases)
    ).toBe(false)
  })

  it("the as-of date and status counts agree across files", () => {
    expect(summary.data_as_of).toBe(latest.data_as_of)
    const tracked = zones.features.filter(
      (f) => f.properties.last_report_date !== null || f.properties.stale
    )
    const counts = { active: 0, watch: 0, cleared: 0, never: 0 }
    for (const f of tracked) counts[f.properties.status]++
    expect(counts).toEqual(drc.zones!.by_status)
  })

  it("a timeseries exists for every tracked zone", () => {
    const files = new Set(readdirSync(path.join(DIR, "timeseries")))
    for (const f of zones.features) {
      if (f.properties.last_report_date !== null || f.properties.stale) {
        expect(files.has(`${f.properties.id}.json`)).toBe(true)
      }
    }
  })
})
