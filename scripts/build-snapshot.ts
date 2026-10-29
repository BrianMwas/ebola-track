/**
 * Build the static data snapshot in public/data/ from the latest INRB release.
 *
 *   bun run build-snapshot
 *
 * Environment:
 *   INRB_RELEASE_TAG  use this release instead of asking the GitHub API for the latest
 *   GITHUB_TOKEN      optional, raises the GitHub API rate limit
 *
 * Downloads are cached in .cache/ (keyed by release tag). Every output is
 * validated against lib/schema.ts; any error stops the build with a non-zero
 * exit code. See docs/data-contract.md for the output files.
 */
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import mapshaper from "mapshaper"
import type { z } from "zod"

import { buildWeekly } from "../lib/chart-data"
import { parseCsv } from "../lib/csv"
import {
  INRB_REPO,
  buildAliasIndex,
  parseLongSeries,
  parseStaticValues,
  type Anomaly,
  type LongSeries,
} from "../lib/inrb"
import {
  ContextSchema,
  CountryTotalsSchema,
  LatestSchema,
  ProvenanceSchema,
  SummarySchema,
  TimeseriesSchema,
  WeeklySchema,
  ZonesSchema,
  type CountrySummary,
  type Provenance,
  type ZoneProperties,
} from "../lib/schema"
import {
  ACTIVE_MAX_DAYS,
  computeZoneStatus,
  daysBetween,
  toEffectiveSeries,
  type SeriesPoint,
  type ZoneStatusResult,
} from "../lib/status"

const ROOT = process.cwd()
const CACHE = path.join(ROOT, ".cache")
const OUT = path.join(ROOT, "public", "data")
const NOW = new Date().toISOString()

const NATURAL_EARTH_TAG = "v5.1.2"
const NATURAL_EARTH_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_TAG}/geojson/ne_50m_admin_0_countries.geojson`
/** Countries drawn as context outlines around the Great Lakes / East Africa frame. */
const REGION_ISO3 = [
  "COD", "UGA", "RWA", "BDI", "SSD", "TZA", "KEN", "ETH", "SOM", "CAF",
  "COG", "AGO", "ZMB", "MWI", "MOZ", "SDN", "CMR", "GAB", "TCD", "ERI",
  "DJI", "GNQ", "ZWE",
]

/** build/long files we read, with the column names INRB's processed/ file must have. */
const LONG_FILES = {
  confirmed: {
    folder: "insp_sitrep",
    long: "insp_sitrep__cumulative_confirmed_cases.csv",
    processed: "insp_sitrep__cumulative_confirmed_cases__daily.csv",
    header: ["nom", "date", "cumulative_confirmed_cases"],
  },
  deaths: {
    folder: "insp_sitrep",
    long: "insp_sitrep__cumulative_confirmed_deaths.csv",
    processed: "insp_sitrep__cumulative_confirmed_deaths__daily.csv",
    header: ["nom", "date", "cumulative_confirmed_deaths"],
  },
  nationalConfirmed: {
    folder: "insp_sitrep",
    long: "insp_sitrep__national_cumulative_confirmed_cases.csv",
    processed: "insp_sitrep__national_cumulative_confirmed_cases__daily.csv",
    header: ["nom", "date", "national_cumulative_confirmed_cases"],
  },
  nationalDeaths: {
    folder: "insp_sitrep",
    long: "insp_sitrep__national_cumulative_confirmed_deaths.csv",
    processed: "insp_sitrep__national_cumulative_confirmed_deaths__daily.csv",
    header: ["nom", "date", "national_cumulative_confirmed_deaths"],
  },
  population: {
    folder: "worldpop",
    long: "worldpop__pop_count.csv",
    processed: "worldpop__pop_count__static.csv",
    header: ["nom", "pop_count"],
  },
} as const

type ManifestDataset = {
  folder: string
  source: string
  citation: string
  source_url: string
  retrieved_on: string
  license: string
  outputs: { file: string; long_csv?: string }[]
}
type Manifest = {
  built_at: string
  commit: string
  n_features: number
  datasets: ManifestDataset[]
}

/* -------------------------------------------------------------- helpers */

function log(message: string) {
  console.log(`[build-snapshot] ${message}`)
}

function fail(message: string): never {
  throw new Error(message)
}

async function download(url: string, dest: string): Promise<Buffer> {
  if (existsSync(dest)) return readFile(dest)
  log(`download ${url}`)
  const res = await fetch(url, { redirect: "follow" })
  if (!res.ok) fail(`GET ${url} -> HTTP ${res.status}`)
  const body = Buffer.from(await res.arrayBuffer())
  await mkdir(path.dirname(dest), { recursive: true })
  await writeFile(dest, body)
  return body
}

async function latestReleaseTag(): Promise<string> {
  const override = process.env.INRB_RELEASE_TAG?.trim()
  if (override) {
    log(`using INRB_RELEASE_TAG=${override}`)
    return override
  }
  const url = `https://api.github.com/repos/${INRB_REPO}/releases/latest`
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ebola-track-build-snapshot",
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  const res = await fetch(url, { headers })
  if (!res.ok) {
    fail(
      `GitHub API ${url} -> HTTP ${res.status}. Set INRB_RELEASE_TAG to build a specific release.`
    )
  }
  const body = (await res.json()) as { tag_name?: string }
  if (!body.tag_name) fail("GitHub API response has no tag_name")
  return body.tag_name
}

function validate<T extends z.ZodType>(
  schema: T,
  value: unknown,
  name: string
): z.infer<T> {
  const result = schema.safeParse(value)
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 20)
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    fail(`${name} failed schema validation:\n${issues}`)
  }
  return result.data
}

async function writeJson(file: string, value: unknown, pretty = false) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(value, null, pretty ? 2 : undefined) + "\n")
}

/** Run mapshaper on in-memory GeoJSON and return the named output. */
async function mapshaperRun(
  commands: string,
  input: unknown,
  output: string
): Promise<GeoJSON.FeatureCollection> {
  const result = await mapshaper.applyCommands(commands, {
    "in.json": JSON.stringify(input),
  })
  const text = result[output]
  if (text === undefined) fail(`mapshaper produced no ${output}`)
  return JSON.parse(String(text))
}

/** Latest valid reported value on or before `date`. */
function reportedAt(series: SeriesPoint[], date: string): number | null {
  let value: number | null = null
  for (const p of series) {
    if (p.value === null || daysBetween(p.date, date) < 0) continue
    value = p.value
  }
  return value
}

function sortByDate(series: SeriesPoint[]) {
  return [...series].sort((a, b) => a.date.localeCompare(b.date))
}

/* ----------------------------------------------------------------- main */

async function main() {
  /* 1. Release */
  const tag = await latestReleaseTag()
  if (!/^build-\d{4}-\d{2}-\d{2}-[0-9a-f]+$/.test(tag)) {
    fail(`Unexpected release tag format: ${tag}`)
  }
  const releaseDir = path.join(CACHE, "inrb", tag)
  const tarballUrl = `https://github.com/${INRB_REPO}/releases/download/${tag}/${tag}.tar.gz`
  const tarball = await download(tarballUrl, path.join(releaseDir, `${tag}.tar.gz`))
  const sha256 = createHash("sha256").update(tarball).digest("hex")
  const extracted = path.join(releaseDir, "extracted")
  if (!existsSync(path.join(extracted, "build", "manifest.json"))) {
    await mkdir(extracted, { recursive: true })
    const tar = spawnSync(
      "tar",
      ["-xzf", path.join(releaseDir, `${tag}.tar.gz`), "-C", extracted, "--no-same-owner"],
      { stdio: "inherit" }
    )
    if (tar.status !== 0) fail(`tar exited with ${tar.status}`)
  }
  const build = path.join(extracted, "build")
  const manifest = JSON.parse(
    await readFile(path.join(build, "manifest.json"), "utf8")
  ) as Manifest
  log(`release ${tag}: built_at ${manifest.built_at}, commit ${manifest.commit}`)

  /* Files that are in the repo at the tag but not in the tarball. */
  const rawUrl = (p: string) =>
    `https://raw.githubusercontent.com/${INRB_REPO}/${tag}/${p}`
  const rawFile = async (p: string) =>
    (await download(rawUrl(p), path.join(releaseDir, "raw", p))).toString("utf8")

  const datasets = new Map(manifest.datasets.map((d) => [d.folder, d]))
  for (const spec of Object.values(LONG_FILES)) {
    const dataset = datasets.get(spec.folder) ?? fail(`manifest has no dataset ${spec.folder}`)
    if (!dataset.outputs.some((o) => o.long_csv === `build/long/${spec.long}`)) {
      fail(`manifest does not list build/long/${spec.long}`)
    }
    const processed = await rawFile(`data/${spec.folder}/processed/${spec.processed}`)
    const header = parseCsv(processed)[0]?.cells.map((c) => c.trim()) ?? []
    if (header.join(",") !== spec.header.join(",")) {
      fail(
        `${spec.processed} header changed: expected ${spec.header.join(",")}, got ${header.join(",")}`
      )
    }
  }

  /* 2. Zones from the INRB GeoJSON: geometry, nom, zscode, province only. */
  const inrbGeo = JSON.parse(
    await readFile(path.join(build, "drc_health_zones.geojson"), "utf8")
  ) as GeoJSON.FeatureCollection
  if (inrbGeo.features.length !== manifest.n_features) {
    fail(`GeoJSON has ${inrbGeo.features.length} features, manifest says ${manifest.n_features}`)
  }
  type ZoneRef = { nom: string; id: string; province: string }
  const zoneByNom = new Map<string, ZoneRef>()
  const baseFeatures: GeoJSON.Feature[] = []
  for (const f of inrbGeo.features) {
    const p = f.properties ?? {}
    const ref: ZoneRef = { nom: p.nom, id: p.zscode, province: p.province }
    if (!ref.nom || !ref.id || !ref.province) fail(`zone feature missing nom/zscode/province`)
    if (zoneByNom.has(ref.nom)) fail(`duplicate zone nom ${ref.nom}`)
    zoneByNom.set(ref.nom, ref)
    // Deliberately drop every nested dataset value: the INRB GeoJSON copies
    // national and province figures onto zones.
    baseFeatures.push({ type: "Feature", properties: { ...ref }, geometry: f.geometry })
  }
  const canonical = new Set(zoneByNom.keys())
  const aliases = buildAliasIndex(await rawFile("data/aliases.csv"), canonical)

  /* 3. Series */
  const readLong = async (key: "confirmed" | "deaths" | "nationalConfirmed" | "nationalDeaths") => {
    const spec = LONG_FILES[key]
    const text = await readFile(path.join(build, "long", spec.long), "utf8")
    return parseLongSeries(
      text,
      spec.long,
      spec.header as unknown as [string, string, string],
      canonical,
      aliases
    )
  }
  const confirmed = await readLong("confirmed")
  const deaths = await readLong("deaths")
  const nationalConfirmed = await readLong("nationalConfirmed")
  const nationalDeaths = await readLong("nationalDeaths")
  const pop = parseStaticValues(
    await readFile(path.join(build, "long", LONG_FILES.population.long), "utf8"),
    LONG_FILES.population.long,
    ["nom", "pop_count"],
    canonical,
    aliases
  )

  /* Unmatched names: written for review, and they stop the build. */
  const unmatched: { file: string; name: string; rows: number }[] = []
  const collectUnmatched = (file: string, m: Map<string, number>) => {
    for (const [name, rows] of m) unmatched.push({ file, name, rows })
  }
  collectUnmatched(LONG_FILES.confirmed.long, confirmed.unmatched)
  collectUnmatched(LONG_FILES.deaths.long, deaths.unmatched)
  collectUnmatched(LONG_FILES.population.long, pop.unmatched)
  for (const [s, file] of [
    [nationalConfirmed, LONG_FILES.nationalConfirmed.long],
    [nationalDeaths, LONG_FILES.nationalDeaths.long],
  ] as const) {
    collectUnmatched(file, s.unmatched)
    if (s.zones.size > 0) fail(`${file}: national file has zone rows`)
  }
  for (const [s, file] of [
    [confirmed, LONG_FILES.confirmed.long],
    [deaths, LONG_FILES.deaths.long],
  ] as const) {
    if (s.national.size > 0) fail(`${file}: zone file has national (DRC) rows`)
  }
  await writeJson(path.join(ROOT, "data", "unmatched-names.json"), unmatched, true)
  if (unmatched.length > 0) {
    fail(
      `Unmatched zone names (see data/unmatched-names.json): ${unmatched
        .map((u) => `${u.name} (${u.file})`)
        .join(", ")}`
    )
  }

  /* 4. Status per zone */
  const allDates = [...confirmed.zones.values()].flatMap((s) =>
    s.filter((p) => p.value !== null).map((p) => p.date)
  )
  if (allDates.length === 0) fail("no zone-level confirmed values")
  const dataAsOf = allDates.reduce((a, b) => (a > b ? a : b))

  const affectedProvinces = new Set(
    [...confirmed.zones.keys()].map((nom) => zoneByNom.get(nom)!.province)
  )

  const statusByNom = new Map<string, ZoneStatusResult>()
  for (const nom of canonical) {
    statusByNom.set(nom, computeZoneStatus(sortByDate(confirmed.zones.get(nom) ?? []), dataAsOf))
  }

  /* 5. Geometry */
  const affected = {
    type: "FeatureCollection",
    features: baseFeatures.filter((f) => affectedProvinces.has(f.properties!.province)),
  }
  const simplifiedZones = await mapshaperRun(
    "-i in.json -simplify 12% keep-shapes -o zones.json precision=0.0001 format=geojson",
    affected,
    "zones.json"
  )
  const innerPoints = await mapshaperRun(
    "-i in.json -points inner -o pts.json precision=0.0001 format=geojson",
    affected,
    "pts.json"
  )
  const pointById = new Map(
    innerPoints.features.map((f) => [
      f.properties!.id as string,
      (f.geometry as GeoJSON.Point).coordinates as [number, number],
    ])
  )
  const otherProvinces = await mapshaperRun(
    "-i in.json -dissolve province -simplify 4% keep-shapes -o prov.json precision=0.001 format=geojson",
    {
      type: "FeatureCollection",
      features: baseFeatures.filter((f) => !affectedProvinces.has(f.properties!.province)),
    },
    "prov.json"
  )

  const ne = JSON.parse(
    (
      await download(
        NATURAL_EARTH_URL,
        path.join(CACHE, "natural-earth", NATURAL_EARTH_TAG, "ne_50m_admin_0_countries.geojson")
      )
    ).toString("utf8")
  ) as GeoJSON.FeatureCollection
  // ISO_A3_EH carries standard codes where ISO_A3 is -99 (e.g. France).
  const neByIso = new Map(
    ne.features.map((f) => [f.properties!.ISO_A3_EH as string, f])
  )
  // Natural Earth draws Somaliland separately; include it so the outline has no hole.
  const somaliland = ne.features.filter((f) => f.properties!.ADM0_A3 === "SOL")
  const countryInput = {
    type: "FeatureCollection",
    features: [
      ...REGION_ISO3.map((iso) => {
        const f = neByIso.get(iso) ?? fail(`Natural Earth has no ${iso}`)
        return {
          type: "Feature",
          properties: { kind: "country", name: f.properties!.NAME as string, iso3: iso },
          geometry: f.geometry,
        }
      }),
      ...somaliland.map((f) => ({
        type: "Feature",
        properties: { kind: "country", name: f.properties!.NAME as string, iso3: null },
        geometry: f.geometry,
      })),
    ],
  }
  const countries = await mapshaperRun(
    "-i in.json -simplify 25% keep-shapes -o c.json precision=0.001 format=geojson",
    countryInput,
    "c.json"
  )

  /* 6. Zone features */
  const revisionsOut: Provenance["revisions"] = []
  const zoneFeatures = simplifiedZones.features.map((f) => {
    const ref = f.properties as ZoneRef
    const st = statusByNom.get(ref.nom)!
    const deathSeries = sortByDate(deaths.zones.get(ref.nom) ?? [])
    const lastDeath = [...deathSeries].reverse().find((p) => p.value !== null)
    for (const r of st.revisions) {
      revisionsOut.push({
        zone_id: ref.id,
        nom: ref.nom,
        metric: "cumulative_confirmed_cases",
        ...r,
      })
    }
    const properties: ZoneProperties = {
      id: ref.id,
      nom: ref.nom,
      province: ref.province,
      status: st.status,
      confirmed_cases: st.confirmed_cases,
      confirmed_cases_effective: st.confirmed_cases_effective,
      confirmed_deaths: lastDeath?.value ?? null,
      new_14d: st.new_14d,
      prev_14d: st.prev_14d,
      trend: st.trend,
      last_case_date: st.last_case_date,
      days_since_last_case: st.days_since_last_case,
      days_to_cleared: st.days_to_cleared,
      last_report_date: st.last_report_date,
      stale: st.stale,
      revised: st.revisions.length > 0,
      population: pop.values.has(ref.nom) ? Math.round(pop.values.get(ref.nom)!) : null,
      label_point: pointById.get(ref.id) ?? fail(`no inner point for ${ref.nom}`),
    }
    return { type: "Feature" as const, id: ref.id, properties, geometry: f.geometry }
  })
  const zones = validate(
    ZonesSchema,
    { type: "FeatureCollection", features: zoneFeatures },
    "zones.geojson"
  )
  const context = validate(
    ContextSchema,
    {
      type: "FeatureCollection",
      features: [
        ...otherProvinces.features.map((f) => ({
          type: "Feature",
          properties: { kind: "province", name: f.properties!.province, iso3: null },
          geometry: f.geometry,
        })),
        ...countries.features.map((f) => ({
          type: "Feature",
          properties: f.properties,
          geometry: f.geometry,
        })),
      ],
    },
    "context.geojson"
  )

  /* 7. National figures, unassigned cases and the country summary */
  const nationalDates = (s: LongSeries) =>
    [...s.national.entries()].filter(([, v]) => v !== null).map(([d]) => d).sort()
  const natDate = nationalDates(nationalConfirmed).at(-1) ?? fail("no national confirmed values")
  const natCases = nationalConfirmed.national.get(natDate)!
  const natDeaths = nationalDeaths.national.get(natDate)
  if (natDeaths === undefined || natDeaths === null) {
    fail(`no national deaths value on ${natDate}`)
  }

  // Unassigned = national minus the sum of zone values, on a date both have.
  const unassignedAsOf = nationalConfirmed.national.get(dataAsOf) != null ? dataAsOf : natDate
  const zoneSum = (s: LongSeries) =>
    [...s.zones.values()].reduce((sum, series) => sum + (reportedAt(series, unassignedAsOf) ?? 0), 0)
  const zoneSumCases = zoneSum(confirmed)
  const zoneSumDeaths = zoneSum(deaths)
  const natCasesU = nationalConfirmed.national.get(unassignedAsOf) ?? fail("no national cases")
  const natDeathsU = nationalDeaths.national.get(unassignedAsOf) ?? fail("no national deaths")

  const byStatus = { active: 0, watch: 0, cleared: 0, never: 0 }
  for (const nom of confirmed.zones.keys()) byStatus[statusByNom.get(nom)!.status]++
  const provincesWithCases = new Set(
    [...confirmed.zones.keys()]
      .filter((nom) => statusByNom.get(nom)!.status !== "never")
      .map((nom) => zoneByNom.get(nom)!.province)
  )

  const totals = validate(
    CountryTotalsSchema,
    JSON.parse(await readFile(path.join(ROOT, "data", "country-totals.json"), "utf8")),
    "data/country-totals.json"
  )
  const labelPoint = (iso3: string): [number, number] | null => {
    const f = neByIso.get(iso3)
    const x = f?.properties?.LABEL_X
    const y = f?.properties?.LABEL_Y
    return typeof x === "number" && typeof y === "number" ? [x, y] : null
  }

  const releaseUrl = `https://github.com/${INRB_REPO}/releases/tag/${tag}`
  const crossChecks: Provenance["cross_checks"] = []
  const summaryCountries: CountrySummary[] = []
  for (const c of totals.countries) {
    if (c.reviewed_by === null) {
      log(`warning: ${c.country} in data/country-totals.json has no reviewed_by`)
    }
    if (c.role === "cross_check") {
      if (c.iso3 !== "COD") fail(`cross_check is only supported for COD, not ${c.iso3}`)
      for (const [metric, hand, series] of [
        ["confirmed_cases", c.confirmed_cases, nationalConfirmed],
        ["confirmed_deaths", c.confirmed_deaths, nationalDeaths],
      ] as const) {
        const inrb = c.as_of ? (series.national.get(c.as_of) ?? null) : null
        const result =
          inrb === null ? "no_inrb_value_for_date" : inrb === hand ? "match" : "mismatch"
        crossChecks.push({
          country: c.country,
          metric,
          hand_value: hand,
          hand_as_of: c.as_of,
          inrb_value: inrb,
          result,
        })
        if (result !== "match") {
          log(`WARNING cross-check ${c.country} ${metric}: hand ${hand} (${c.as_of}) vs INRB ${inrb} -> ${result}`)
        }
      }
      const generated = `Active transmission in ${byStatus.active} health zones in the last ${ACTIVE_MAX_DAYS} days`
      summaryCountries.push({
        country: c.country,
        iso3: c.iso3,
        confirmed_cases: natCases,
        confirmed_deaths: natDeaths,
        as_of: natDate,
        source_name: `INSP SitRep MVE, via INRB release ${tag}`,
        source_url: releaseUrl,
        situation: c.situation_override ?? generated,
        situation_is_override: c.situation_override !== null,
        classification: c.classification,
        note: c.note,
        marker_label: c.marker_label,
        map_placement: c.map_placement,
        cases_by_origin: c.cases_by_origin,
        reviewed_by: c.reviewed_by,
        marker_point: null,
        zones: {
          by_status: byStatus,
          provinces_with_cases: provincesWithCases.size,
          unassigned_cases: natCasesU - zoneSumCases,
          unassigned_deaths: natDeathsU - zoneSumDeaths,
          unassigned_as_of: unassignedAsOf,
          zone_sum_cases: zoneSumCases,
          zone_sum_deaths: zoneSumDeaths,
        },
      })
    } else {
      summaryCountries.push({
        country: c.country,
        iso3: c.iso3,
        confirmed_cases: c.confirmed_cases,
        confirmed_deaths: c.confirmed_deaths,
        as_of: c.as_of,
        source_name: c.source_name,
        source_url: c.source_url,
        situation: c.situation_override ?? c.note,
        situation_is_override: c.situation_override !== null,
        classification: c.classification,
        note: c.note,
        marker_label: c.marker_label,
        map_placement: c.map_placement,
        cases_by_origin: c.cases_by_origin,
        reviewed_by: c.reviewed_by,
        marker_point: c.map_placement === "map" ? labelPoint(c.iso3) : null,
      })
    }
  }
  const summary = validate(
    SummarySchema,
    { data_as_of: dataAsOf, countries: summaryCountries },
    "summary.json"
  )

  /* 8. Time series per tracked zone */
  const timeseries = [...confirmed.zones.entries()].map(([nom, series]) => {
    const ref = zoneByNom.get(nom)!
    const { points } = toEffectiveSeries(
      sortByDate(series).filter((p) => daysBetween(p.date, dataAsOf) >= 0)
    )
    return validate(
      TimeseriesSchema,
      {
        id: ref.id,
        nom,
        data_as_of: dataAsOf,
        metric: "cumulative_confirmed_cases",
        points,
      },
      `timeseries/${ref.id}.json`
    )
  })

  const weekly = validate(WeeklySchema, buildWeekly(timeseries, dataAsOf), "weekly.json")

  /* 9. Provenance */
  const anomalies: Anomaly[] = [
    ...confirmed.anomalies,
    ...deaths.anomalies,
    ...nationalConfirmed.anomalies,
    ...nationalDeaths.anomalies,
  ]
  const insp = datasets.get("insp_sitrep")!
  const worldpop = datasets.get("worldpop")!
  const provenance = validate(
    ProvenanceSchema,
    {
      generated_at: NOW,
      sources: [
        {
          id: "inrb-release",
          name: `INRB-UMIE BDBV2026-Data, release ${tag}`,
          url: releaseUrl,
          retrieved_at: NOW,
          reference: tag,
          licence:
            "Repository code MIT (Kraemer Lab, University of Oxford). Epidemiological data is preliminary; the maintainers ask to be contacted before use prior to publication. Third-party layers keep their own licences.",
          note: "Cite the repository (Zenodo DOI 10.5281/zenodo.21223302 per the README badge; the README citation section gives 10.5281/zenodo.20922946) and Mbulayi et al., Lancet Infectious Diseases: https://www.thelancet.com/journals/laninf/article/PIIS1473-3099(26)00330-0/fulltext",
        },
        {
          id: "insp-sitrep",
          name: insp.source,
          url: insp.source_url,
          retrieved_at: NOW,
          reference: `SitRep MVE report dates up to ${dataAsOf} (transcribed by INRB)`,
          licence: insp.license,
          note: insp.citation,
        },
        {
          id: "worldpop",
          name: worldpop.source,
          url: worldpop.source_url,
          retrieved_at: NOW,
          reference: `retrieved by INRB ${worldpop.retrieved_on}`,
          licence: worldpop.license,
          note: worldpop.citation,
        },
        {
          id: "health-zones",
          name: "GRID3 COD Health Zones v8.0, via the INRB build",
          url: "https://data.grid3.org/datasets/GRID3::grid3-cod-health-zones-v8-0",
          retrieved_at: NOW,
          reference: `${tag} build/drc_health_zones.geojson`,
          licence: "Not stated in the INRB repository; to be confirmed on the GRID3 dataset page before launch.",
          note: "Simplified with mapshaper. Unaffected provinces are dissolved into outlines.",
        },
        {
          id: "natural-earth",
          name: "Natural Earth 1:50m Admin 0 countries",
          url: "https://www.naturalearthdata.com/",
          retrieved_at: NOW,
          reference: `natural-earth-vector ${NATURAL_EARTH_TAG}`,
          licence: "Public domain",
          note: "Country outlines and country label points (used to place country-level markers; not exact locations).",
        },
        ...totals.countries.map((c) => ({
          id: `country-${c.iso3.toLowerCase()}`,
          name: c.source_name,
          url: c.source_url,
          retrieved_at: `${totals.collected_on}T00:00:00Z`,
          reference: `${c.country}, as of ${c.as_of ?? "n/a"}`,
          licence: "Figures as published by the source; see the source's terms.",
          note: c.note,
        })),
      ],
      release: {
        tag,
        tarball_url: tarballUrl,
        sha256,
        bytes: tarball.length,
        manifest_built_at: manifest.built_at,
        manifest_commit: manifest.commit,
      },
      revisions: revisionsOut,
      input_anomalies: anomalies,
      cross_checks: crossChecks,
      notes: [
        "Status uses the running maximum of each zone's cumulative confirmed series, so a revision never produces negative cases; the published value is shown on cards.",
        `"Cleared" means no confirmed case for more than 42 days in this app's reading of the data. It is not an official end-of-outbreak declaration.`,
        "INSP carries a zone's previous cumulative value forward when the zone is not reported, so a flat series means no new cases reported, not confirmed zero.",
        "Suspected cases are not shown: the zone-level series ends on 2026-05-30.",
        "Province- and national-grain values in INRB's GeoJSON are ignored; every number comes from build/long/.",
        "Basemap tiles, when a Mapbox token is configured, are loaded from Mapbox at view time (© Mapbox © OpenStreetMap).",
      ],
    },
    "provenance.json"
  )

  const latest = validate(
    LatestSchema,
    {
      snapshot: NOW,
      inrb_release_tag: tag,
      inrb_build_time: manifest.built_at,
      inrb_commit: manifest.commit,
      inrb_release_url: releaseUrl,
      data_as_of: dataAsOf,
    },
    "latest.json"
  )

  /* 10. Write */
  await rm(OUT, { recursive: true, force: true })
  await writeJson(path.join(OUT, "latest.json"), latest, true)
  await writeJson(path.join(OUT, "summary.json"), summary, true)
  await writeJson(path.join(OUT, "provenance.json"), provenance, true)
  await writeJson(path.join(OUT, "zones.geojson"), zones)
  await writeJson(path.join(OUT, "context.geojson"), context)
  await writeJson(path.join(OUT, "weekly.json"), weekly)
  for (const ts of timeseries) {
    await writeJson(path.join(OUT, "timeseries", `${ts.id}.json`), ts)
  }

  log(`data as of ${dataAsOf}; national ${natCases} cases / ${natDeaths} deaths on ${natDate}`)
  log(`zones: ${zones.features.length} in ${affectedProvinces.size} affected provinces; ${JSON.stringify(byStatus)}`)
  log(`unassigned on ${unassignedAsOf}: ${natCasesU - zoneSumCases} cases, ${natDeathsU - zoneSumDeaths} deaths`)
  log(`revisions: ${revisionsOut.length}; input anomalies: ${anomalies.length}; timeseries: ${timeseries.length}`)
  log(`wrote ${path.relative(ROOT, OUT)}/`)
}

main().catch((err) => {
  console.error(`[build-snapshot] FAILED: ${err instanceof Error ? err.message : err}`)
  process.exit(1)
})
