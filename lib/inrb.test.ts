import { describe, expect, it } from "vitest"

import { parseCsv } from "./csv"
import {
  buildAliasIndex,
  parseLongSeries,
  parseStaticValues,
  resolveNom,
} from "./inrb"

const BOM = "﻿"
const CANON = new Set(["Mongbwalu", "Gety", "Lubunga (Tshopo)", "Tshopo"])
const ALIAS_CSV = [
  "observed_name,canonical_nom,source_dataset,notes",
  "Gethy,Gety,insp_sitrep,",
  "Lubunga,Lubunga (Tshopo),insp_sitrep,",
  "Ghost,Not A Zone,insp_sitrep,dropped because the target is not canonical",
].join("\n")
const HEADER = ["nom", "date", "cumulative_confirmed_cases"] as const

describe("parseCsv", () => {
  it("handles BOM, CRLF, blank lines and quoted fields", () => {
    const rows = parseCsv(`${BOM}a,b\r\n\r\n"x, y","say ""hi"""\r\n`)
    expect(rows.map((r) => r.cells)).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
    ])
    expect(rows[1].line).toBe(3)
  })

  it("fails on an unterminated quote", () => {
    expect(() => parseCsv('a,"b\n')).toThrow(/unterminated/)
  })
})

describe("name resolution", () => {
  const aliases = buildAliasIndex(ALIAS_CSV, CANON)

  it("ignores aliases whose target is not a canonical zone", () => {
    expect(aliases.has("Ghost")).toBe(false)
  })

  it("resolves canonical names, aliases and special labels", () => {
    expect(resolveNom("Gethy", CANON, aliases)).toEqual({
      kind: "zone",
      nom: "Gety",
    })
    expect(resolveNom(" Lubunga ", CANON, aliases)).toEqual({
      kind: "zone",
      nom: "Lubunga (Tshopo)",
    })
    // A bare Tshopo is the health zone, never the province.
    expect(resolveNom("Tshopo", CANON, aliases)).toEqual({
      kind: "zone",
      nom: "Tshopo",
    })
    expect(resolveNom("DRC", CANON, aliases).kind).toBe("national")
    expect(resolveNom("NA", CANON, aliases).kind).toBe("non_geographic")
    expect(resolveNom("Ituri", CANON, aliases)).toEqual({
      kind: "unmatched",
      raw: "Ituri",
    })
  })
})

describe("parseLongSeries", () => {
  const aliases = buildAliasIndex(ALIAS_CSV, CANON)
  const text = [
    `${BOM}Mongbwalu,2026-10-26,10`,
    "Gethy,2026-10-26,2",
    "Mongbwalu,2026-10-27,ND",
    "Gethy,2026-10-27],3",
    "NA,2026-10-27,17-",
    "NA,2026-10-26,4",
    "DRC,2026-10-27,30",
    "Ituri,2026-10-27,99",
  ].join("\r\n")

  it("splits zone, national and non-geographic rows and records anomalies", () => {
    const r = parseLongSeries(text, "f.csv", HEADER, CANON, aliases)
    expect(r.zones.get("Mongbwalu")).toEqual([
      { date: "2026-10-26", value: 10 },
      { date: "2026-10-27", value: null },
    ])
    expect(r.zones.get("Gety")).toEqual([{ date: "2026-10-26", value: 2 }])
    expect(r.national.get("2026-10-27")).toBe(30)
    expect(r.nonGeographic.get("2026-10-26")).toBe(4)
    expect(r.nonGeographic.has("2026-10-27")).toBe(false)
    expect(r.unmatched.get("Ituri")).toBe(1)
    expect(r.anomalies.map((a) => [a.line, a.action])).toEqual([
      [4, "row dropped"],
      [5, "treated as not reported"],
    ])
  })

  it("skips a header row if INRB ever adds one", () => {
    const withHeader = `${HEADER.join(",")}\nMongbwalu,2026-10-26,10\n`
    const r = parseLongSeries(withHeader, "f.csv", HEADER, CANON, aliases)
    expect(r.zones.get("Mongbwalu")).toHaveLength(1)
  })

  it("fails on duplicate (nom, date) after aliasing", () => {
    const dup = "Gety,2026-10-26,1\nGethy,2026-10-26,2\n"
    expect(() => parseLongSeries(dup, "f.csv", HEADER, CANON, aliases)).toThrow(
      /duplicate/
    )
  })

  it("fails on a changed column count", () => {
    expect(() =>
      parseLongSeries("Gety,2026-10-26,1,9\n", "f.csv", HEADER, CANON, aliases)
    ).toThrow(/expected 3 columns/)
  })
})

describe("parseStaticValues", () => {
  it("parses nom,value rows", () => {
    const aliases = buildAliasIndex(ALIAS_CSV, CANON)
    const r = parseStaticValues(
      `${BOM}Gety,1200.5\r\nNowhere,3\r\n`,
      "pop.csv",
      ["nom", "pop_count"],
      CANON,
      aliases
    )
    expect(r.values.get("Gety")).toBe(1200.5)
    expect(r.unmatched.get("Nowhere")).toBe(1)
  })
})
