# Phase 1 report

Phase 1 covers the pipeline and the status map, built on release `build-2026-10-28-aad9fdd` with data as of 2026-10-27. All checks below were run on 2026-10-29 in the build container.

## Acceptance checks

| Check | Result |
|---|---|
| With no basemap env var, the app loads and shows zones and circles | **Pass.** With no `NEXT_PUBLIC_MAPBOX_TOKEN`, the map renders with MapLibre on a flat background (headless Chromium, desktop 1440 px and mobile 390 px). |
| Every zone card shows an as-of date and a source | **Pass.** The card footer reads "Data as of 27 Oct 2026. INSP SitRep MVE, via INRB release build-2026-10-28-aad9fdd." and links to the release. |
| Status for 5 zones matches a manual calculation from the raw CSV | **Pass.** See below. Computed with an independent Python script from `build/long/insp_sitrep__cumulative_confirmed_cases.csv`, not with the app's TypeScript. |
| `unassigned` is displayed, not hidden | **Pass.** The DRC card states that every confirmed case is assigned, and shows a meter for **493 of 4,960 deaths** not assigned to a zone. |
| Province-grain metrics do not appear as zone values | **Pass.** The pipeline reads only `nom`, `zscode`, `province` and geometry from INRB's GeoJSON; every number comes from zone-level `build/long/` files. Zone properties use a strict schema (no extra keys). `lib/snapshot.test.ts` checks that zone values plus the unassigned gap equal the national total, and that no zone carries the national figure. |
| No console errors; unit tests pass | **Pass.** No console errors or page errors in Chromium (the only messages are software-GL driver performance notes from the headless browser). `bun run test`: 44 tests pass. `bun run lint` and `bun run typecheck` are clean. |
| `bun run build-snapshot && bun dev` shows the map | **Pass, with one note.** This container cannot reach `api.github.com` for the INRB repo, so I ran it with `INRB_RELEASE_TAG=build-2026-10-28-aad9fdd`. On a normal network the script asks the Releases API for the latest tag. |

## Five zones worked by hand

Rules applied:

- `last_case_date` is the last report date on which the running maximum of the cumulative confirmed series rose.
- Days are counted to `data_as_of` = **2026-10-27**.
- The windows are 2026-10-13 to 2026-10-27 (new) and 2026-09-29 to 2026-10-13 (previous).
- A value on a day without a report carries forward from the last report.

### Bunia (Ituri)

Last rises of the running maximum (date: previous max -> new value): 2026-10-25: 1923->1949, 2026-10-26: 1949->1958, 2026-10-27: 1958->1970

Latest published row: 2026-10-27, value 1970

| Step | Hand calculation | Snapshot |
|---|---|---|
| last_case_date | 2026-10-27 | 2026-10-27 |
| days_since_last_case | 2026-10-27 − 2026-10-27 = 0 | 0 |
| status | 0 days → active | active |
| new_14d | max-to-date at 2026-10-27 (1970) − at 2026-10-13 (1859) = 111 | 111 |
| prev_14d | 1859 − max-to-date at 2026-09-29 (1728) = 131 | 131 |
| confirmed_cases (published) | 1970 | 1970 |

Result: matches

### Adja (Ituri)

Last rises of the running maximum (date: previous max -> new value): 2026-07-19: 0->10, 2026-07-25: 10->11, 2026-10-06: 11->12

Drops in the published series: 2026-10-11 12 -> 2026-10-12 11

Latest published row: 2026-10-27, value 11

| Step | Hand calculation | Snapshot |
|---|---|---|
| last_case_date | 2026-10-06 | 2026-10-06 |
| days_since_last_case | 2026-10-27 − 2026-10-06 = 21 | 21 |
| status | 21 days → active | active |
| new_14d | max-to-date at 2026-10-27 (12) − at 2026-10-13 (12) = 0 | 0 |
| prev_14d | 12 − max-to-date at 2026-09-29 (11) = 1 | 1 |
| confirmed_cases (published) | 11 | 11 |

Result: matches

### Kilo (Ituri)

Last rises of the running maximum (date: previous max -> new value): 2026-09-26: 34->35, 2026-09-30: 35->37, 2026-10-03: 37->38

Latest published row: 2026-10-27, value 38

| Step | Hand calculation | Snapshot |
|---|---|---|
| last_case_date | 2026-10-03 | 2026-10-03 |
| days_since_last_case | 2026-10-27 − 2026-10-03 = 24 | 24 |
| status | 24 days → watch | watch |
| days_to_cleared | 43 − 24 = 19 | 19 |
| new_14d | max-to-date at 2026-10-27 (38) − at 2026-10-13 (38) = 0 | 0 |
| prev_14d | 38 − max-to-date at 2026-09-29 (35) = 3 | 3 |
| confirmed_cases (published) | 38 | 38 |

Result: matches

### Dungu (Haut-Uele)

Last rises of the running maximum (date: previous max -> new value): 2026-09-18: 0->1

Latest published row: 2026-10-27, value 1

| Step | Hand calculation | Snapshot |
|---|---|---|
| last_case_date | 2026-09-18 | 2026-09-18 |
| days_since_last_case | 2026-10-27 − 2026-09-18 = 39 | 39 |
| status | 39 days → watch | watch |
| days_to_cleared | 43 − 39 = 4 | 4 |
| new_14d | max-to-date at 2026-10-27 (1) − at 2026-10-13 (1) = 0 | 0 |
| prev_14d | 1 − max-to-date at 2026-09-29 (1) = 0 | 0 |
| confirmed_cases (published) | 1 | 1 |

Result: matches

### Goma (Nord-Kivu)

Last rises of the running maximum (date: previous max -> new value): 2026-05-18: 0->1, 2026-07-02: 1->2

Drops in the published series: 2026-07-02 2 -> 2026-07-03 1

Latest published row: 2026-10-27, value 1

| Step | Hand calculation | Snapshot |
|---|---|---|
| last_case_date | 2026-07-02 | 2026-07-02 |
| days_since_last_case | 2026-10-27 − 2026-07-02 = 117 | 117 |
| status | 117 days → cleared | cleared |
| new_14d | max-to-date at 2026-10-27 (2) − at 2026-10-13 (2) = 0 | 0 |
| prev_14d | 2 − max-to-date at 2026-09-29 (2) = 0 | 0 |
| confirmed_cases (published) | 1 | 1 |

Result: matches


## Sizes

Production static export (`bun run build`), sizes gzipped.

| What | Size | When it loads |
|---|---:|---|
| Initial page JS + CSS (React, Next runtime, app) | 219 KB | First view |
| Map data: `zones.geojson` + `context.geojson` | 77 KB + 41 KB | First view |
| `summary.json` + `latest.json` | 1.4 KB | First view |
| Mapbox GL chunk | 502 KB | Only when a Mapbox token is set |
| MapLibre chunk + worker | 279 KB + 140 KB | Only when there is no token, or Mapbox fails |
| Recharts (zone trend chart) | 99 KB | When a zone card opens |
| `timeseries/<id>.json` | 6 KB median, 8 KB max | Per zone opened |

First meaningful view therefore costs about **840 KB** with Mapbox, or **760 KB** with the MapLibre fallback. The map engine dominates. If the slow-connection target needs a lighter first load, the options for Phase 2 are:

- Render the DRC summary and a table first and load the map on demand (it is already lazy).
- Ship a static SVG preview of the map.

## Decisions taken in this phase (from your answers)

- **Map:** Mapbox, via `react-map-gl/mapbox`, when `NEXT_PUBLIC_MAPBOX_TOKEN` is set. Mapbox GL cannot draw anything without a valid token, so the app falls back to MapLibre with no basemap when the token is missing, or when Mapbox errors before the map loads (bad token, network). Both renderers use the same layer definitions (`components/map/map-style.ts`). Mapbox's optional performance telemetry is disabled; the map-load event it sends is required by Mapbox's terms (see the README privacy note).
- **Package manager:** bun.
- **Revisions:** cards show the latest published value with a "Revised" badge. Status uses the running maximum, so a rise later revised away (Adja, 2026-10-06) still counts as a case date. There are 24 revisions across 16 zones, listed in `provenance.json`.
- **Suspected cases:** not shown.
- **Staleness:** zone-level stale means the zone is missing from the latest report. It is drawn hatched grey (2 zones: Karisimbi and Jiba). Dataset-level stale means the data is more than 2 calendar days old; the freshness line then turns amber. It does not hatch every zone.
- **Malformed input cells:** treated as missing and listed in `provenance.input_anomalies` (5 today). The build fails on unmatched zone names, missing files or changed headers.
- **Citation:** each figure cites the report date and INRB release tag. Both Zenodo DOIs are recorded in `provenance.json` until you pick one.
- **Status colours:** one calm indigo-violet family that deepens with severity. This replaced an orange ramp at your request, so the map informs without reading as alarm; plain blue was avoided because zones would be confused with the lakes beside them.

  | Status | Colour |
  |---|---|
  | cleared | `#a7a1d8` |
  | watch | `#7366c9` |
  | active | `#3f2f96` |
  | no confirmed case | `#f4f2ee` (neutral) |

  The ramp passes the ordinal checks of the dataviz palette validator against the map surface: monotone lightness, visible steps, light end ≥ 2:1. Circles for new cases are white with an ink outline, which reads on both light and dark fills. Chart highlights use neutral ink, so the status colours only ever mean status.

- **Layout:** generous spacing, with headline numbers first. The longer explanations sit behind small "How to read the map", "Why some deaths have no health zone" and "About this status" disclosures. The unassigned-deaths figure itself is always visible.

## Not done / open

- **mebius chart cards (`charts-overview`, `charts-budget`, `charts-total-balance`) are not installed.** The environment's network policy blocks `www.mebius.design`, and the mebius MCP server is not connected in this session. In their place are small components with the same jobs:
  - `components/charts/zone-trend-chart.tsx`
  - `components/charts/status-squares.tsx`
  - `components/charts/watch-countdown.tsx`

  Their data comes from `lib/chart-data.ts`, so swapping in the mebius cards later means feeding them the same prepared props.
- **Mapbox is untested with a real token.** This container cannot reach `api.mapbox.com`. The no-token path and the fallback switch are tested.
- **`reviewed_by` is null for every row of `data/country-totals.json`.** The build warns about it.
- **The GRID3 health-zone licence** is not stated in the INRB repo; it needs confirming before the credits page.
- **Dark mode:** panels follow the theme, but the map keeps its light surface.
- **Phase 2 items not started:**
  - country card strip (Kenya, Uganda, neighbours)
  - table view and keyboard zone selection
  - credits page
  - "What to do" panel
  - French and Swahili strings
  - "Near me"
  - daily GitHub Action
