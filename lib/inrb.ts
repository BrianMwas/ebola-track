/**
 * Parsing for the INRB-UMIE/BDBV2026-Data release (`build/long/*.csv`).
 *
 * Quirks handled here (see docs/data-inventory.md):
 * - Long files have no header row (INRB build bug), a UTF-8 BOM and CRLF.
 *   If a header row ever appears it is detected and skipped.
 * - `nom` holds raw spellings; it must be resolved through data/aliases.csv.
 * - `ND` means "not reported"; other non-integer cells are anomalies and are
 *   treated as missing, never guessed.
 */
import { parseCsv, type CsvRow } from "./csv"
import type { SeriesPoint } from "./status"

export const INRB_REPO = "INRB-UMIE/BDBV2026-Data"
export const NATIONAL_NOM = "DRC"
export const NON_GEOGRAPHIC_NOMS = new Set(["Sans Fiche", "NA"])

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const COUNT = /^\d+$/

export type Anomaly = {
  file: string
  line: number
  row: string
  problem: string
  action: string
}

export type ResolvedNom =
  | { kind: "zone"; nom: string }
  | { kind: "national" }
  | { kind: "non_geographic"; label: string }
  | { kind: "unmatched"; raw: string }

export function buildAliasIndex(
  text: string,
  canonical: ReadonlySet<string>
): Map<string, string> {
  const rows = parseCsv(text)
  const header = rows[0]?.cells.map((c) => c.trim())
  if (header?.[0] !== "observed_name" || header?.[1] !== "canonical_nom") {
    throw new Error(`aliases.csv: unexpected header ${JSON.stringify(header)}`)
  }
  const index = new Map<string, string>()
  for (const { cells } of rows.slice(1)) {
    const observed = cells[0]?.trim()
    const target = cells[1]?.trim()
    // Same rule as INRB's tools/lib/schema.py: aliases to a zone that is not in
    // the current shapefile are ignored.
    if (observed && target && canonical.has(target)) index.set(observed, target)
  }
  return index
}

export function resolveNom(
  raw: string,
  canonical: ReadonlySet<string>,
  aliases: ReadonlyMap<string, string>
): ResolvedNom {
  const label = raw.trim()
  if (NON_GEOGRAPHIC_NOMS.has(label)) return { kind: "non_geographic", label }
  if (label === NATIONAL_NOM) return { kind: "national" }
  if (canonical.has(label)) return { kind: "zone", nom: label }
  const alias = aliases.get(label)
  if (alias) return { kind: "zone", nom: alias }
  return { kind: "unmatched", raw: label }
}

function dataRows(rows: CsvRow[], header: readonly string[]): CsvRow[] {
  const first = rows[0]?.cells.map((c) => c.trim())
  return first && first.join(",") === header.join(",") ? rows.slice(1) : rows
}

function rowText(row: CsvRow) {
  return row.cells.join(",")
}

export type LongSeries = {
  /** Canonical zone nom -> report-date series. */
  zones: Map<string, SeriesPoint[]>
  /** Report date -> value for `nom` = DRC rows. */
  national: Map<string, number | null>
  /** Report date -> summed value for non-geographic rows (`NA`, `Sans Fiche`). */
  nonGeographic: Map<string, number>
  anomalies: Anomaly[]
  /** Raw name -> row count, for names that match no zone or alias. */
  unmatched: Map<string, number>
}

/**
 * Parse a `nom,date,<value>` long file. Fails on structural problems
 * (wrong column count, duplicate keys); records cell-level problems as
 * anomalies and treats those cells as missing.
 */
export function parseLongSeries(
  text: string,
  file: string,
  header: readonly [string, string, string],
  canonical: ReadonlySet<string>,
  aliases: ReadonlyMap<string, string>
): LongSeries {
  const out: LongSeries = {
    zones: new Map(),
    national: new Map(),
    nonGeographic: new Map(),
    anomalies: [],
    unmatched: new Map(),
  }
  const seen = new Set<string>()

  for (const row of dataRows(parseCsv(text), header)) {
    if (row.cells.length !== 3) {
      throw new Error(
        `${file}:${row.line}: expected 3 columns, found ${row.cells.length}`
      )
    }
    const [rawNom, rawDate, rawValue] = row.cells.map((c) => c.trim())

    if (!ISO_DATE.test(rawDate)) {
      out.anomalies.push({
        file,
        line: row.line,
        row: rowText(row),
        problem: `date "${rawDate}" is not ISO 8601`,
        action: "row dropped",
      })
      continue
    }

    let value: number | null = null
    if (COUNT.test(rawValue)) {
      value = Number(rawValue)
    } else if (rawValue !== "ND") {
      out.anomalies.push({
        file,
        line: row.line,
        row: rowText(row),
        problem: `value "${rawValue}" is not a count`,
        action: "treated as not reported",
      })
    }

    const resolved = resolveNom(rawNom, canonical, aliases)
    const key = `${resolved.kind === "zone" ? resolved.nom : rawNom}|${rawDate}`
    if (seen.has(key)) {
      throw new Error(`${file}:${row.line}: duplicate (nom, date) ${key}`)
    }
    seen.add(key)

    switch (resolved.kind) {
      case "zone": {
        const list = out.zones.get(resolved.nom) ?? []
        list.push({ date: rawDate, value })
        out.zones.set(resolved.nom, list)
        break
      }
      case "national":
        out.national.set(rawDate, value)
        break
      case "non_geographic":
        if (value !== null) {
          out.nonGeographic.set(
            rawDate,
            (out.nonGeographic.get(rawDate) ?? 0) + value
          )
        }
        break
      case "unmatched":
        out.unmatched.set(resolved.raw, (out.unmatched.get(resolved.raw) ?? 0) + 1)
        break
    }
  }
  return out
}

/** Parse a `nom,<value>` static file into canonical nom -> number. */
export function parseStaticValues(
  text: string,
  file: string,
  header: readonly [string, string],
  canonical: ReadonlySet<string>,
  aliases: ReadonlyMap<string, string>
): { values: Map<string, number>; unmatched: Map<string, number> } {
  const values = new Map<string, number>()
  const unmatched = new Map<string, number>()
  for (const row of dataRows(parseCsv(text), header)) {
    if (row.cells.length !== 2) {
      throw new Error(
        `${file}:${row.line}: expected 2 columns, found ${row.cells.length}`
      )
    }
    const [rawNom, rawValue] = row.cells.map((c) => c.trim())
    const value = Number(rawValue)
    if (rawValue === "" || !Number.isFinite(value)) {
      throw new Error(`${file}:${row.line}: value "${rawValue}" is not a number`)
    }
    const resolved = resolveNom(rawNom, canonical, aliases)
    if (resolved.kind !== "zone") {
      unmatched.set(rawNom, (unmatched.get(rawNom) ?? 0) + 1)
      continue
    }
    if (values.has(resolved.nom)) {
      throw new Error(`${file}:${row.line}: duplicate nom ${resolved.nom}`)
    }
    values.set(resolved.nom, value)
  }
  return { values, unmatched }
}
