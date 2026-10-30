# East Africa Ebola status (Bundibugyo outbreak, 2026)

> **PUBLIC_LAUNCH_BLOCKED**
>
> This is a private preview. Do not deploy it publicly, and do not add public
> analytics or social cards. Permission to publish the INRB/INSP
> epidemiological data is still being requested. The data is preliminary;
> INSP's terms ask for distribution terms to be confirmed before external
> republication. Remove this block only when written permission is on file.

A static web app that answers three questions quickly: is Ebola near me, is it
growing, and what should I do. Health zones are coloured by how recently they
had a confirmed case (status first, not totals). Imported cases are kept
separate from local transmission, and every number shows its source and as-of
date.

Built with Next.js 16 (static export), React 19, Tailwind 4, shadcn/ui (Base
UI), Mapbox GL with a MapLibre fallback, Recharts and zod.

## Quick start

```bash
bun install
```

```bash
bun run build-snapshot
```

```bash
bun dev
```

`build-snapshot` downloads the latest INRB release and writes `public/data/`.
The committed snapshot already works, so you can skip that step.

## Environment

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token (`pk.…`). Optional. Without it, or if Mapbox rejects it, the map falls back to MapLibre with a flat background, country outlines and the health zones. Restrict the token to your preview URL in the Mapbox account. |
| `NEXT_PUBLIC_MAPBOX_STYLE` | Optional Mapbox style URL. Default `mapbox://styles/mapbox/light-v11`. |
| `INRB_RELEASE_TAG` | Build a specific INRB release instead of the latest (`build-snapshot` only). |
| `GITHUB_TOKEN` | Optional; raises the GitHub API rate limit for `build-snapshot`. |

`NEXT_PUBLIC_*` values are baked in at build time and are visible in the browser.

### Privacy note on Mapbox

When a Mapbox token is set, the browser loads tiles from Mapbox and Mapbox GL
sends a map-load event with an anonymous ID kept in the browser's
`localStorage`; the Mapbox terms of service require this. Optional performance
telemetry is turned off. The app itself collects nothing: no analytics, no
location storage. Without a token, the MapLibre fallback makes no third-party
requests.

## Scripts

| Script | What it does |
|---|---|
| `bun dev` | Development server (copies the MapLibre worker first) |
| `bun run build` | Static export to `out/` (serve with any static file server) |
| `bun run build-snapshot` | Rebuild `public/data/` from the INRB release; fails on any schema error or unmatched zone name |
| `bun run test` | Vitest: status logic, INRB parsing, chart data, snapshot checks |
| `bun run lint` / `bun run typecheck` | ESLint / TypeScript |

## Data

- **Primary source:** [INRB-UMIE/BDBV2026-Data](https://github.com/INRB-UMIE/BDBV2026-Data) releases. Case data is transcribed by INRB from INSP's SitRep MVE bulletins and is preliminary.
- **Hand-maintained:** `data/country-totals.json` (Kenya, Uganda, imported and medevac cases, and a DRC cross-check). Each entry has its source, as-of date and `reviewed_by`.
- **Inventory of the INRB release:** [`docs/data-inventory.md`](docs/data-inventory.md).
- **Output contract** (what the UI reads, and what a future producer must emit): [`docs/data-contract.md`](docs/data-contract.md). The zod schemas are in `lib/schema.ts`.
- **Status rules:** `lib/status.ts`.
  - **Active:** last confirmed case 21 days ago or less.
  - **Watch:** 22 to 42 days.
  - **Cleared:** more than 42 days. This is this site's label, not an official end-of-outbreak declaration.
  - All of these are measured against the dataset's latest report date, never today's date.

## Layout

```
app/                    page and layout (disclaimer under the page title)
components/             tracker, panels, charts, map (components/map/)
lib/                    schema, status, INRB parsing, formatting, strings
scripts/                build-snapshot.ts, copy-vendor.ts
data/                   country-totals.json, unmatched-names.json
public/data/            generated snapshot (committed)
docs/                   data inventory, data contract, phase reports
```
