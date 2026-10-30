# Snapshot data contract

The site is static. It reads these files from `/data/` (that is, `public/data/`). They are produced today by `scripts/build-snapshot.ts`; the planned Go service must emit the same shapes.

The zod schemas in `lib/schema.ts` are the source of truth for the shapes. `build-snapshot` validates every file before writing and exits non-zero on any error.

## General rules

- **Dates.** All dates are ISO 8601. Report dates are calendar dates (`YYYY-MM-DD`); timestamps carry an offset.
- **Grain.** Numbers on a zone are zone-grain only. National and province figures never appear on zone features.
- **Missing values.** `null` means the source does not give a value. It never means zero.
- **Caching.** The UI fetches `latest.json` without caching, then the other files with `?v=<latest.snapshot>`.

## Files

| File | Contents |
|---|---|
| `latest.json` | Snapshot and release identifiers |
| `summary.json` | One entry per country |
| `zones.geojson` | Health zones in affected provinces, with status |
| `context.geojson` | Outlines with no case data: unaffected DRC provinces and regional countries |
| `timeseries/<zone-id>.json` | Per-zone cumulative confirmed series (tracked zones only) |
| `weekly.json` | New confirmed cases per week, for all tracked zones together and for each one |
| `provenance.json` | Sources, licences, revisions, input anomalies, cross-checks |

### `latest.json`

| Field | Type | Meaning |
|---|---|---|
| `snapshot` | datetime | When this snapshot was built ("checked … ago") |
| `inrb_release_tag` | string | e.g. `build-2026-10-28-aad9fdd` |
| `inrb_build_time` | datetime | `built_at` from the release's `build/manifest.json` |
| `inrb_commit` | string | `commit` from the manifest (INRB data snapshot) |
| `inrb_release_url` | url | GitHub release page |
| `data_as_of` | date | Latest report date in the zone-level confirmed series. All status is computed against this date |

### `zones.geojson`

This is a FeatureCollection of Polygon or MultiPolygon features. `feature.id` equals `properties.id`. Geometry is simplified with mapshaper (12%, 4 decimal places) and limited to provinces with at least one tracked zone.

| Property | Type | Meaning |
|---|---|---|
| `id` | string | Shapefile ZSCode; also the timeseries filename |
| `nom` | string | Canonical health-zone name |
| `province` | string | Province |
| `status` | `active` \| `watch` \| `cleared` \| `never` | ≤ 21 / 22–42 / > 42 days since last case; never = no confirmed case |
| `confirmed_cases` | int | Latest published cumulative confirmed (verbatim INSP) |
| `confirmed_cases_effective` | int | Running maximum of the published series (status input) |
| `confirmed_deaths` | int \| null | Latest published cumulative confirmed deaths |
| `new_14d`, `prev_14d` | int | Change in the running maximum over the last 14 days and the 14 before |
| `trend` | `up` \| `flat` \| `down` | Flat when the windows differ by ≤ 10%, or both are below 5 |
| `last_case_date` | date \| null | Last report date on which the running maximum rose |
| `days_since_last_case` | int \| null | `data_as_of − last_case_date` |
| `days_to_cleared` | int \| null | Watch zones only: `43 − days_since_last_case` |
| `last_report_date` | date \| null | Last report date with a valid value |
| `stale` | bool | Tracked zone with no valid value on `data_as_of` |
| `revised` | bool | The published series fell at least once (details in `provenance.revisions`) |
| `population` | int \| null | WorldPop 2025 estimate |
| `label_point` | [lon, lat] | Point inside the polygon, used for circles |

Suspected cases are deliberately absent: the zone-level series ends on 2026-05-30.

### `context.geojson`

Properties: `kind` (`province` or `country`), `name`, and `iso3` (null for DRC provinces and for Somaliland).

- **Countries:** Natural Earth 1:50m `v5.1.2`, public domain.
- **Provinces:** dissolved from the GRID3 zones.

### `timeseries/<zone-id>.json`

```json
{ "id": "GPi6i83o7l6", "nom": "Bunia", "data_as_of": "2026-10-27",
  "metric": "cumulative_confirmed_cases",
  "points": [{ "date": "2026-05-15", "reported": 0, "effective": 0, "new": 0 }] }
```

There is one point per report date with a valid value; days without a report are absent. `new` is the rise in `effective` on that report date, so cases are attributed to the date they were reported.

### `summary.json`

`{ "data_as_of": date, "countries": [...], "no_cases_reported": [...] }`.

`no_cases_reported` lists neighbouring countries that a named source says have no confirmed case, copied from `data/country-totals.json`: `country`, `iso3`, `as_of` (when the source said so), `note`, `source_name`, `source_url`, `reviewed_by`. The page shows them under the country table. Absence from `countries` alone never means "no cases".

Each country entry has:

| Field | Meaning |
|---|---|
| `country`, `iso3` | Name and ISO 3166-1 alpha-3 code |
| `confirmed_cases`, `confirmed_deaths`, `as_of` | Headline numbers. For DRC: INRB's national series. For other countries: `data/country-totals.json` |
| `source_name`, `source_url` | Where the numbers come from |
| `situation`, `situation_is_override` | Status sentence. For DRC it is generated from the data ("Active transmission in N health zones in the last 21 days") unless `situation_override` is set in `data/country-totals.json` |
| `classification` | `local_transmission`, `imported_cluster`, `imported`, `medevac` or `outbreak_over` |
| `note`, `marker_label` | Hand-written notes and map label |
| `map_placement` | `map`: drawn on the map. `inset`: listed beside the map |
| `marker_point` | Natural Earth label point. It marks the country, not where the cases are |
| `cases_by_origin` | `{ local, imported, medevac }`; null where the source does not say |
| `reviewed_by` | Who last reviewed the hand-entered row (null = unreviewed) |
| `zones` | DRC only, described below |

The `zones` object has these fields:

- `by_status`: tracked-zone counts by status.
- `provinces_with_cases`: number of provinces with at least one confirmed case.
- `unassigned_cases`, `unassigned_deaths`: the national total minus the sum of zone values on `unassigned_as_of`. Shown openly and never pushed into a zone.
- `zone_sum_cases`, `zone_sum_deaths`: the zone sums used in that calculation.

### `provenance.json`

| Field | Contents |
|---|---|
| `sources[]` | Each source's name, URL, retrieved time, reference (tag or as-of) and licence note |
| `release` | Tarball URL, sha256 and size, plus the manifest's build time and commit |
| `revisions[]` | Every fall in a zone's published cumulative series |
| `input_anomalies[]` | Malformed input cells (file, line, raw row, action taken) |
| `cross_checks[]` | Hand-entered DRC totals compared with INRB's national series |
| `notes[]` | Method notes |

## Input: `data/country-totals.json`

Hand-maintained and validated by `CountryTotalsSchema`.

- **`role: "cross_check"`** (DRC): the row is compared with INRB's national series for the same date, and any mismatch is logged and recorded in `provenance.cross_checks`. It is never displayed.
- **`reviewed_by: null`**: the build prints a warning.

## Input: `data/unmatched-names.json`

Written on every build. It lists any zone name in the files we use that matches neither a canonical `nom` nor `data/aliases.csv`. A non-empty list stops the build.

### `weekly.json`

Derived from the time series (`buildWeekly` in `lib/chart-data.ts`) so the page can draw weekly charts without loading every series file.

| Field | Type | Meaning |
|---|---|---|
| `data_as_of` | date | Same as `latest.json` |
| `week_ends` | date[] | Last day of each 7-day window, oldest first; the last is `data_as_of` (18 weeks) |
| `zone_total` | int[] | New confirmed cases per window, summed over all tracked zones (cases not assigned to a zone are not included) |
| `zones` | { [zone id]: int[] } | New confirmed cases per window for each tracked zone |

New cases are changes in the running maximum, attributed to the report date, as in the time series.
