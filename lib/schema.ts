/**
 * The snapshot contract: what `scripts/build-snapshot.ts` writes to
 * `public/data/` and what the UI reads. The build validates every output
 * file against these schemas and fails on any error. A future producer
 * (the planned Go service) must emit the same shapes. See docs/data-contract.md.
 *
 * The UI imports types only (`import type`), so zod stays out of the
 * browser bundle.
 */
import { z } from "zod"

const isoDate = z.iso.date()
const isoDateTime = z.iso.datetime({ offset: true })
const count = z.int().nonnegative()
const lonLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])

export const ZONE_STATUSES = ["active", "watch", "cleared", "never"] as const
export const TRENDS = ["up", "flat", "down"] as const
export const CLASSIFICATIONS = [
  "local_transmission",
  "imported_cluster",
  "imported",
  "medevac",
  "outbreak_over",
] as const

const position = z.array(z.number()).min(2)
const ring = z.array(position).min(4)
const polygon = z.strictObject({
  type: z.literal("Polygon"),
  coordinates: z.array(ring).min(1),
})
const multiPolygon = z.strictObject({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(ring).min(1)).min(1),
})
const areaGeometry = z.discriminatedUnion("type", [polygon, multiPolygon])

/* ------------------------------------------------------------ latest.json */

export const LatestSchema = z.strictObject({
  /** When this snapshot was built. */
  snapshot: isoDateTime,
  inrb_release_tag: z.string().regex(/^build-\d{4}-\d{2}-\d{2}-[0-9a-f]+$/),
  /** `built_at` from the release's build/manifest.json. */
  inrb_build_time: isoDateTime,
  /** `commit` from the release's build/manifest.json (data snapshot). */
  inrb_commit: z.string().min(1),
  inrb_release_url: z.url(),
  /** Latest report date in the zone-level confirmed-case series. */
  data_as_of: isoDate,
})
export type Latest = z.infer<typeof LatestSchema>

/* ---------------------------------------------------------- zones.geojson */

export const ZonePropertiesSchema = z
  .strictObject({
    /** Shapefile ZSCode: stable, URL-safe. Also the timeseries filename. */
    id: z.string().regex(/^[A-Za-z0-9_-]+$/),
    /** Canonical health-zone name (INRB `nom`). */
    nom: z.string().min(1),
    province: z.string().min(1),
    status: z.enum(ZONE_STATUSES),
    /** Latest published cumulative confirmed cases. */
    confirmed_cases: count,
    /** Running maximum of the published series (status input). */
    confirmed_cases_effective: count,
    /** Latest published cumulative confirmed deaths; null if never reported. */
    confirmed_deaths: count.nullable(),
    new_14d: count,
    prev_14d: count,
    trend: z.enum(TRENDS),
    last_case_date: isoDate.nullable(),
    days_since_last_case: count.nullable(),
    /** Watch zones only. */
    days_to_cleared: z.int().min(1).max(21).nullable(),
    /** Last report date with a valid confirmed-case value. */
    last_report_date: isoDate.nullable(),
    /** A tracked zone with no valid value on the dataset's as-of date. */
    stale: z.boolean(),
    /** The published cumulative series fell at least once (see provenance.revisions). */
    revised: z.boolean(),
    /** WorldPop 2025 estimate; null if unavailable. */
    population: z.number().nonnegative().nullable(),
    /** A point inside the polygon, for circles and labels. */
    label_point: lonLat,
  })
  .superRefine((p, ctx) => {
    if ((p.status === "watch") !== (p.days_to_cleared !== null)) {
      ctx.addIssue({
        code: "custom",
        message: "days_to_cleared must be set for watch zones and only for them",
      })
    }
    if ((p.status === "never") !== (p.last_case_date === null)) {
      ctx.addIssue({
        code: "custom",
        message: "last_case_date must be null exactly when status is never",
      })
    }
  })
export type ZoneProperties = z.infer<typeof ZonePropertiesSchema>

export const ZonesSchema = z.strictObject({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.strictObject({
      type: z.literal("Feature"),
      id: z.string(),
      properties: ZonePropertiesSchema,
      geometry: areaGeometry,
    })
  ),
})
export type Zones = z.infer<typeof ZonesSchema>

/* -------------------------------------------------------- context.geojson */

/** Outlines with no case data: unaffected DRC provinces and regional countries. */
export const ContextSchema = z.strictObject({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.strictObject({
      type: z.literal("Feature"),
      properties: z.strictObject({
        kind: z.enum(["province", "country"]),
        name: z.string().min(1),
        iso3: z.string().length(3).nullable(),
      }),
      geometry: areaGeometry,
    })
  ),
})
export type Context = z.infer<typeof ContextSchema>

/* ------------------------------------------------- timeseries/<id>.json */

export const TimeseriesSchema = z.strictObject({
  id: z.string(),
  nom: z.string(),
  data_as_of: isoDate,
  metric: z.literal("cumulative_confirmed_cases"),
  /** One point per report date with a valid value. Days without a report are absent. */
  points: z.array(
    z.strictObject({
      date: isoDate,
      reported: count,
      effective: count,
      new: count,
    })
  ),
})
export type Timeseries = z.infer<typeof TimeseriesSchema>

/* ------------------------------------------------------------ weekly.json */

export const WeeklySchema = z
  .strictObject({
    data_as_of: isoDate,
    /** Last day of each 7-day window, oldest first; the last one is `data_as_of`. */
    week_ends: z.array(isoDate).min(1),
    /** New confirmed cases per window, summed over all tracked zones. */
    zone_total: z.array(count),
    /** New confirmed cases per window for each tracked zone, keyed by zone id. */
    zones: z.record(z.string(), z.array(count)),
  })
  .superRefine((w, ctx) => {
    const n = w.week_ends.length
    if (w.zone_total.length !== n || Object.values(w.zones).some((v) => v.length !== n)) {
      ctx.addIssue({ code: "custom", message: "every series must have one value per week" })
    }
  })
export type Weekly = z.infer<typeof WeeklySchema>

/* ---------------------------------------- data/country-totals.json (input) */

/** A country with no confirmed case, stated by a named source on a given date. */
const noCasesReported = z.strictObject({
  country: z.string().min(1),
  iso3: z.string().length(3),
  /** When the source said so. */
  as_of: isoDate,
  /** What the source said, briefly. */
  note: z.string().min(1),
  source_name: z.string().min(1),
  source_url: z.url(),
  reviewed_by: z.string().min(1).nullable(),
})

const casesByOrigin = z.strictObject({
  local: count.nullable(),
  imported: count.nullable(),
  medevac: count.nullable(),
})

export const CountryTotalsSchema = z.strictObject({
  $comment: z.string().optional(),
  collected_on: isoDate,
  countries: z.array(
    z.strictObject({
      country: z.string().min(1),
      iso3: z.string().length(3),
      /** "cross_check": INRB's national series is shown; this entry only checks it. */
      role: z.enum(["display", "cross_check"]),
      confirmed_cases: count,
      confirmed_deaths: count,
      as_of: isoDate.nullable(),
      classification: z.enum(CLASSIFICATIONS),
      note: z.string().min(1),
      /** Short label for the map marker, e.g. "9 cases, 1 cluster, contacts traced". */
      marker_label: z.string().min(1),
      /** "inset": far from the region, listed beside the map instead of on it. */
      map_placement: z.enum(["map", "inset"]),
      cases_by_origin: casesByOrigin,
      /** Replaces the generated status sentence when set. */
      situation_override: z.string().min(1).nullable(),
      source_name: z.string().min(1),
      source_url: z.url(),
      reviewed_by: z.string().min(1).nullable(),
    })
  ),
  /** Neighbouring countries with no confirmed case, each with its source. Shown under the country table. */
  no_cases_reported: z.array(noCasesReported),
})
export type CountryTotals = z.infer<typeof CountryTotalsSchema>

/* ----------------------------------------------------------- summary.json */

const zonesByStatus = z.strictObject({
  active: count,
  watch: count,
  cleared: count,
  /** Listed in INSP tables but no confirmed case yet. */
  never: count,
})

export const SummarySchema = z.strictObject({
  data_as_of: isoDate,
  countries: z.array(
    z.strictObject({
      country: z.string(),
      iso3: z.string().length(3),
      confirmed_cases: count,
      confirmed_deaths: count,
      as_of: isoDate.nullable(),
      source_name: z.string(),
      source_url: z.url(),
      situation: z.string().min(1),
      situation_is_override: z.boolean(),
      classification: z.enum(CLASSIFICATIONS),
      note: z.string(),
      marker_label: z.string(),
      map_placement: z.enum(["map", "inset"]),
      /**
       * Where to draw a country-level marker: the Natural Earth label point.
       * It marks the country, not where the cases are. Null when no marker is drawn.
       */
      marker_point: lonLat.nullable(),
      /** Null where the source does not say. */
      cases_by_origin: casesByOrigin,
      reviewed_by: z.string().nullable(),
      /** Zone-level detail, present for countries with INRB zone data (DRC). */
      zones: z
        .strictObject({
          by_status: zonesByStatus,
          provinces_with_cases: count,
          /** National total minus the sum of zone values on `unassigned_as_of`. */
          unassigned_cases: z.int(),
          unassigned_deaths: z.int(),
          unassigned_as_of: isoDate,
          zone_sum_cases: count,
          zone_sum_deaths: count,
        })
        .optional(),
    })
  ),
  /** Copied from data/country-totals.json. */
  no_cases_reported: z.array(noCasesReported),
})
export type Summary = z.infer<typeof SummarySchema>
export type CountrySummary = Summary["countries"][number]

/* -------------------------------------------------------- provenance.json */

export const ProvenanceSchema = z.strictObject({
  generated_at: isoDateTime,
  sources: z.array(
    z.strictObject({
      id: z.string(),
      name: z.string(),
      url: z.url(),
      retrieved_at: isoDateTime,
      /** Release tag, bulletin reference or dataset version. */
      reference: z.string(),
      licence: z.string(),
      note: z.string().nullable(),
    })
  ),
  release: z.strictObject({
    tag: z.string(),
    tarball_url: z.url(),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    bytes: count,
    manifest_built_at: isoDateTime,
    manifest_commit: z.string(),
  }),
  revisions: z.array(
    z.strictObject({
      zone_id: z.string(),
      nom: z.string(),
      metric: z.literal("cumulative_confirmed_cases"),
      date: isoDate,
      value: count,
      previous_date: isoDate,
      previous_value: count,
    })
  ),
  input_anomalies: z.array(
    z.strictObject({
      file: z.string(),
      line: count,
      row: z.string(),
      problem: z.string(),
      action: z.string(),
    })
  ),
  cross_checks: z.array(
    z.strictObject({
      country: z.string(),
      metric: z.enum(["confirmed_cases", "confirmed_deaths"]),
      hand_value: count,
      hand_as_of: isoDate.nullable(),
      inrb_value: count.nullable(),
      result: z.enum(["match", "mismatch", "no_inrb_value_for_date"]),
    })
  ),
  notes: z.array(z.string()),
})
export type Provenance = z.infer<typeof ProvenanceSchema>
