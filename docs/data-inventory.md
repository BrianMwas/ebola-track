# Data inventory: INRB-UMIE / BDBV2026-Data

Phase 0 deliverable. Everything below was read from the data itself, not from the repo's documentation, unless it says otherwise.

| | |
|---|---|
| Inspected on | 2026-10-29 |
| Repository | [`INRB-UMIE/BDBV2026-Data`](https://github.com/INRB-UMIE/BDBV2026-Data). The README still links to the old name `INRB-UMIE/Ebola_DRC_2026`, which redirects to the same repo and the same release assets |
| Release inspected | `build-2026-10-28-aad9fdd` (latest; adds SitRep 166) |
| Tarball | `build-2026-10-28-aad9fdd.tar.gz`, 5,305,804 bytes, sha256 `c60a0adf1bdb580141ec1284c4caa6690093cf3160992a181af2cc713b85c3a0` |
| Tarball contents | `build/` and `qa/` only (166 entries). It is byte-identical to `build/` on `main` at commit `21928f7`, apart from `build/DESCRIPTION.md` |
| `manifest.json` | `built_at` 2026-10-28T21:50:45Z, `commit` `aad9fdd`, `n_features` 519 |
| Latest data date | **2026-10-27**, in both the zone-level and the national case series |

How it was fetched: I downloaded the tarball from the release-asset URL and unpacked it into a scratch folder outside the project. I also shallow-cloned the repo to read `data/` (aliases, processed headers and metadata), because those are not in the tarball. This sandbox's network policy blocked `api.github.com` for that repo, so I found the latest tag from the README's release table rather than the Releases API. A GitHub Action will be able to use the API normally.

---

## 1. Summary

1. **The data we need exists at zone grain and is current.** `insp_sitrep__cumulative_confirmed_cases` and `insp_sitrep__cumulative_confirmed_deaths` are daily, zone-level and run to 2026-10-27, covering 68 health zones in 8 provinces.
2. **The `build/long/*.csv` files have no header row.** This is a bug in INRB's `tools/build_geojson.py`, which calls `writer.writerows(rows)` without `writeheader()`. The files also start with a UTF-8 BOM and use CRLF line endings. Column names have to come from the matching `data/<dataset>/processed/<file>` at the release commit.
3. **The long files carry raw, un-aliased names.** For example `Gethy`, `Nia-Nia` and a bare `Lubunga` all appear. Every row must go through `data/aliases.csv`, which is not in the tarball.
4. **Zone-level suspected cases are effectively unavailable.** That series stops on 2026-05-30, and national cumulative suspected stops on 2026-08-04. Showing suspected rings would mean showing five-month-old data.
5. **Unassigned confirmed cases are currently 0.** The sum of zone values equals the national figure on every recent date. **Deaths are not assigned in the same way:** on 2026-10-27 the zones sum to 4,467 deaths against a national figure of 4,960, so **493 deaths are unassigned**.
6. **Your DRC country figure matches INRB exactly.** INRB's national series for 2026-10-26 is 10,141 confirmed and 4,928 deaths. INRB has one more day: 10,193 and 4,960 on 2026-10-27.
7. **The series contains 24 revisions (drops) across 16 zones**, and some are permanent. Goma was revised from 2 to 1 and Ariwara from 10 to 8.
8. **The INSP transcription carries values forward.** A zone that is tracked but not reported in a bulletin keeps its previous cumulative value. A flat line therefore means "nothing new reported", not "confirmed zero new cases". Separately, 35 of the 167 calendar days have no zone table at all, including 2026-10-22, 10-23 and 10-24.
9. **The input has a few malformed cells**, listed in section 7. QA in the INRB repo let them through.
10. **Population is available.** WorldPop 2025 `pop_count` covers all 519 zones under CC BY 4.0.
11. **No zone name is left unmatched** once `aliases.csv` is applied. The only non-geographic `nom` in the case series is `NA` (42 rows, 2026-06-01 to 2026-07-20).

---

## 2. Files the MVP will use

| Purpose | `build/long/` file | Columns | Grain | Rows | Dates | Zones |
|---|---|---|---|---:|---|---:|
| Zone cumulative confirmed cases | `insp_sitrep__cumulative_confirmed_cases.csv` | `nom`, `date`, `cumulative_confirmed_cases` | zone (+ 42 `NA` rows) | 6,173 | 2026-05-14 → 2026-10-27 | 68 |
| Zone cumulative confirmed deaths | `insp_sitrep__cumulative_confirmed_deaths.csv` | `nom`, `date`, `cumulative_confirmed_deaths` | zone (+ 42 `NA` rows) | 6,113 | 2026-05-14 → 2026-10-27 | 68 |
| National cumulative confirmed (DRC) | `insp_sitrep__national_cumulative_confirmed_cases.csv` | `nom`, `date`, `national_cumulative_confirmed_cases` | national (`nom` = `DRC`) | 137 | 2026-05-14 → 2026-10-27 | – |
| National cumulative deaths (DRC) | `insp_sitrep__national_cumulative_confirmed_deaths.csv` | `nom`, `date`, `national_cumulative_confirmed_deaths` | national | 137 | 2026-05-14 → 2026-10-27 | – |
| Population | `worldpop__pop_count.csv` | `nom`, `pop_count` | zone, static | 519 | – (2025 estimate) | 519 |
| Geometry and canonical names | `drc_health_zones.geojson` | `nom`, `zscode`, `province` (+ nested dataset values we will **not** read) | zone | 519 features | – | 519 |
| Name aliases (repo, not tarball) | `data/aliases.csv` | `observed_name`, `canonical_nom`, `source_dataset`, `notes` | – | 52 | – | – |
| Build metadata | `manifest.json` | `built_at`, `commit`, per-dataset `source`, `citation`, `license`, `retrieved_on`, `contact`, `outputs[]` | – | – | – | – |

Exact value columns:

- **Cumulative confirmed cases:** `cumulative_confirmed_cases` (zone) and `national_cumulative_confirmed_cases` (DRC).
- **Confirmed deaths:** `cumulative_confirmed_deaths` (zone) and `national_cumulative_confirmed_deaths` (DRC).
- **Suspected cases:** `cumulative_suspected_cases` (zone, 22 zones, **ends 2026-05-30**) and `national_cumulative_suspected_cases` (DRC, **ends 2026-08-04**, last value 270). INSP split suspected cases into "under investigation" and "in isolation" from SitRep 16. `national_suspected_cases_in_isolation` is still reported (936 on 2026-10-27), but it is a count of people currently isolated, not a cumulative total.
- `new_confirmed_cases` exists but **ends 2026-07-15**, so it can't be used. Daily new cases will be derived from the cumulative series instead.

### Join key and IDs

- `nom` is unique across all 519 features. The province suffix appears on exactly four names: `Bili (Bas-Uele)`, `Bili (Nord-Ubangi)`, `Lubunga (Kasaï-Central)` and `Lubunga (Tshopo)`.
- `zscode` (for example `LOm8B3vy1qR`) is unique and URL-safe. **I propose using `zscode` as the zone `id`** and as the filename in `timeseries/<id>.json`, because names contain spaces, accents and parentheses.
- Kinshasa, Lualaba and Tshopo are each both a province and a zone. A bare `Tshopo` row means the **zone**, which is INRB's rule too. The case series has a real `Tshopo` zone row (5 cases).

---

## 3. Grain: zone, province or national

Grain is taken from the `nom` values actually present in each file and checked against `metadata.yaml` and `tools/lib/schema.py`. The appendix covers every file.

- **Zone grain:** every non-`national_` `insp_sitrep__*` file. INRB's build drops any province or national row it finds in these files (`requires_zone_only_noms`). Also zone grain: `worldpop`, `ccvi`, `fao_lccs`, `gdp_pc`, `grid3_healthsites`, `healthsites_io`, `refugee_sites`, `testing_capacity`, `genomic_surveillance`, `cross_border`, `epi`, `epi_mve_inrb_app` and `flowminder_short_trips`.
- **National grain** (`nom` = `DRC`): every `insp_sitrep__national_*` file, `aggregated_insp_linelist__national_*` and `public_health_response__national_*`. One file is mixed: `public_health_response__national_epidemiological_monitoring_en` has 9 province rows.
- **Province grain:** `aggregated_insp_linelist__provincial_confirmed_cases_onset` (one row, value `NA`) and `public_health_response__provincial_*`, which is free text.
- **Mixed zone and province:** `public_health_response__epidemiological_protection_sexual_exploitation_abuse_{en,fr}` (2 province rows) and `public_health_response__provincial_epidemiological_coordination_{en,fr}` (1 zone row).

**The broadcast trap is confirmed and avoidable.** In `drc_health_zones.geojson`, each `insp_sitrep.national_*` value (for example `national_cumulative_confirmed_cases` = 10,193) is copied onto **all 519 features**. Province roll-ups in other datasets are copied onto every zone in their province. **The pipeline will read only geometry, `nom`, `zscode` and `province` from the GeoJSON, and take every number from `build/long/`.** That keeps broadcast values out of the UI entirely. I'll add a test that fails if any `national_*` or province-grain metric reaches a zone feature.

**Out of scope or excluded:**

- `aggregated_insp_linelist` and `epi_mve_inrb_app` are licensed "Internal operational data; redistribution subject to INSP/INRB approval". Both are also near-empty (1 row with `NA`, and 5 rows from May respectively).
- `epi` is a single WHO weekly sitrep from 2026-05-18.
- `public_health_response`, `flowminder*`, `IDP`, `osrm`, `ccvi`, `gdp_pc`, the health-facility layers and `refugee_sites` are out of scope for the MVP.
- `ACLED_conflict` is not in the build, as the brief says.

---

## 4. Population

Yes. `worldpop__pop_count` (people) and `worldpop__pop_density` (people/km²) cover all 519 zones and are static.

- Source: WorldPop, 2025 estimates, aggregated to the GRID3 v8.0 zones.
- Licence: **CC BY 4.0**.
- That is enough for a cases-per-100,000 fill.

---

## 5. Name matching

Applying `data/aliases.csv` (52 aliases) to the case series:

| Observed in `build/long/` | Canonical `nom` |
|---|---|
| `Gethy` | `Gety` |
| `Lubunga` | `Lubunga (Tshopo)` |
| `Makiso-Kisangani` | `Makiso Kisangani` |
| `Miti-Murhesa` | `Miti Murhesa` |
| `Nia-Nia` | `Nia Nia` |
| `Rumba` | `Rimba` |

- **Unmatched zone names in the case and death series: none.** 75 raw names resolve to 68 zones, plus the non-geographic `NA`.
- No duplicate (`nom`, `date`) keys remain after aliasing.
- Across all 113 manifest-listed vector files the only unmatched values are non-geographic labels. The pipeline will still write `data/unmatched-names.json` on every build (currently `[]`) and fail if an unmatched name shows up in a file we use.
- The insp_sitrep README says aliases go `Mongbwalu → Mongbalu` and `Nyankunde → Nyakunde`. **That is out of date.** Since the 13 July shapefile change, `Mongbwalu` and `Nyankunde` are the canonical names.

---

## 6. Data timeliness and coverage

- **Zone rows on the latest date (2026-10-27):** 66 of 68 tracked zones. The two without a row are `Karisimbi` (last row 2026-05-30, cumulative 0) and `Jiba` (only `ND` values, 2026-05-28 to 2026-06-03).
- **Calendar days with no zone table:** 35 of 167 between 2026-05-14 and 2026-10-27. The recent ones are 2026-10-07, 10-08, 10-20, 10-22, 10-23 and 10-24. National figures exist for some of those days but not all.
- **Carry-forward.** From the insp_sitrep README: once a zone is tracked it gets a row on every later report date. If the zone isn't reported, cumulative is carried forward unchanged, or the cell is `ND`. As a result, **the brief's per-zone staleness test ("no new row in 48 h") will almost never trigger**, because carried-forward rows always exist. The real staleness signal is at dataset level (the latest date across the series) and, for a zone, its absence from the latest report date.
- **Freshness right now:** the data is as of 2026-10-27 and today is 2026-10-29, so the dataset is **more than 48 hours old today**. Read literally, the brief's rule 6 would hatch every zone grey. See decision 5 in section 11.
- **Bulletin traceability.** The long CSVs carry a report date but no SitRep number. The only number-to-date mapping is in `data/insp_sitrep/reports/SitRep_MVE_###-2026.md`, which is hand-filled and has errors: SitRep 166 is dated "27th September, 2026" where the data date is 2026-10-27. The repo also holds PDFs for only 136 bulletins. So every number can cite *INSP SitRep MVE, report date YYYY-MM-DD, via INRB release `<tag>`*, but **not reliably a SitRep number**.

---

## 7. Data-quality anomalies in the input

QA in the INRB repo let all of these through:

| File | Row | Problem |
|---|---|---|
| `insp_sitrep__cumulative_confirmed_cases.csv` | `Nyankunde,2026-06-25],93` | Date has a trailing `]` (not ISO) |
| `insp_sitrep__cumulative_confirmed_cases.csv` | `NA,2026-06-18,17-` | Value `17-` |
| `insp_sitrep__cumulative_confirmed_cases.csv` | 10 rows (`Kyondo`, `Jiba`, `Karisimbi`, `Manguredjipa`) | Value `ND` (documented: not reported) |
| `insp_sitrep__cumulative_confirmed_deaths.csv` | `Drodro,2026-06-24,1]` | Value `1]` |
| `insp_sitrep__cumulative_confirmed_deaths.csv` | 20 rows `ND`; `Jiba` and `Karisimbi` on 2026-06-03 | Values `ND` and `NA` |
| `aggregated_insp_linelist__*` | `11/06/2026` | DD/MM/YYYY date (file excluded anyway) |
| `public_health_response__*` | e.g. `02-06-2026`, `13/07/2026` | DD-MM-YYYY dates (out of scope) |

All of these are old (June) or in files we don't use, so none of them changes the current status of any zone.

### Revisions: 24 drops across 16 zones

The brief's rule keeps the running maximum for status and records each drop:

| Zone | From | To |
|---|---|---|
| Mongbwalu | 14 (05-21) | 10 (05-22) |
| Rwampara | 25 (05-19) | 24 (05-20) |
| Rwampara | 192 (06-15) | 172 (06-16) |
| Nyankunde | 11 (05-21) | 9 (05-22) |
| Goma | 2 (07-02) | 1 (07-03), **permanent** |
| Katwa | 1 → 0 (05-22) | |
| Katwa | 18 → 16 (06-11) | |
| Katwa | 25 → 23 (06-16) | |
| Butembo | 2 → 1 (05-23) | |
| Butembo | 5 → 2 (06-01) | |
| Butembo | 9 → 7 (06-11) | |
| Butembo | 88 → 87 (08-02) | |
| Bambu | 1 → 0 (05-23) | |
| Bambu | 2 → 0 (05-25) | |
| Miti Murhesa | 3 → 1 (06-04) | |
| Miti Murhesa | 3 → 1 (06-08) | |
| Oicha | 2 → 1 (05-28) | |
| Kalunguta | 2 → 1 (05-28) | |
| Mambasa | 8 → 7 (07-22) | |
| Aungba | 6 → 4 (07-22) | |
| Wamba | 16 → 6 (07-18) | |
| Makiso Kisangani | 4 → 3 (08-01) | |
| Ariwara | 10 → 7 (07-22), **permanent** (currently 8) | |
| Adja | 12 (10-06) | 11 (10-12), **permanent** |

**Adja shows why the revision rule matters.** INSP reported 11 → 12 on 2026-10-06, then 11 again from 2026-10-12. Under running-max, 2026-10-06 counts as a case date, which makes Adja "active" at exactly 21 days today. On the verbatim series, Adja's last increase is much earlier. See decision 3 in section 11.

---

## 8. Cross-check against the hand-entered country totals

| | Your table | INRB national series |
|---|---|---|
| DRC confirmed | 10,141 (26 Oct, ECDC) | **10,141 on 2026-10-26**; 10,193 on 2026-10-27 |
| DRC deaths | 4,928 (26 Oct, ECDC) | **4,928 on 2026-10-26**; 4,960 on 2026-10-27 |
| DRC provinces | 8 | **8** with ≥ 1 confirmed: Ituri (29 zones), Nord-Kivu (18), Haut-Uele (7), Tshopo (7), Bas-Uele (4), Sud-Kivu (1), Sud-Ubangi (1), Nord-Ubangi (1) |

No disagreement. INRB also reports 2,749 recoveries and 936 suspected cases in isolation on 2026-10-27; we don't plan to show either.

**Unassigned** (national minus the sum of zone values):

- **Confirmed cases:** 0 on every date from 2026-10-12 to 2026-10-27. During June–July, INSP reported 17–97 confirmed cases under `nom` = `NA`. Those rows stop on 2026-07-20.
- **Deaths:** 493 on 2026-10-27 (4,960 − 4,467). That gap has held at about 493 since at least 2026-10-19 (4,646 − 4,153).

The country card will show both gaps.

---

## 9. Draft status preview (non-binding)

This is a throwaway script applying the brief's rules (running max, `data_as_of` = 2026-10-27). It is **not** the app's `status.ts`; the real worked examples come in Phase 1.

| Status | Zones |
|---|---:|
| active (≤ 21 days since last increase) | 49 |
| watch (22–42 days) | 6: Kilo, Logo, Viadana, Kayna, Bulu, Dungu |
| cleared (> 42 days) | 11: Goma, Miti Murhesa, Aungba, Kambala, Drodro, Boga, Lubunga (Tshopo), Ariwara, Wanierukula, Gombari, Buta |
| tracked, never a confirmed case | 1: Karisimbi |
| tracked, no valid value | 1: Jiba |
| never affected (no rows) | 451 |

Largest 14-day increases: Mandima +187, Beni +163, Bunia +111, Rwampara +54, Mabalako +40.

---

## 10. Where the brief and the repo disagree

1. **`build/long/<dataset>__<metric>.csv` has no header row.** Columns come from `data/<dataset>/processed/` instead (section 1, point 2).
2. **The tarball doesn't contain `data/aliases.csv`** (or `province_aliases.csv`). Both are fetched from the repo at the release tag's commit.
3. **"Province-level values are copied onto every health zone in the build."** This is true for the GeoJSON, and the national `DRC` values are even copied onto all 519 zones. It does **not** happen in `build/long/`, and INRB's build drops province and national rows from zone-level insp_sitrep files. We avoid the issue by reading numbers only from `build/long/`.
4. **Health-zone polygons are no longer "MoH via HDX".** Since 2026-07-13 they come from **GRID3 COD Health Zones v8.0** ([data.grid3.org](https://data.grid3.org/datasets/GRID3::grid3-cod-health-zones-v8-0)). The root README's "Data sources" still says HDX. The repo doesn't state the GRID3 licence; I'll confirm it on the GRID3 page before the credits page goes in.
5. **Suspected cases are not usable for the map** (section 2).
6. **The 48-hour stale rule doesn't fit carried-forward data** (section 6).
7. **The repo shows two Zenodo DOIs.** The badge uses `10.5281/zenodo.21223302`; the "Citation" section uses `10.5281/zenodo.20922946`.
   - Lancet ID paper (Mbulayi et al.): <https://www.thelancet.com/journals/laninf/article/PIIS1473-3099(26)00330-0/fulltext>
8. **29 files in `build/long/` are stale leftovers** that aren't listed in `manifest.json`, such as `osrm__travel_time.csv` and unsuffixed `public_health_response__*`. INRB's build never clears that folder, so the pipeline will only read files the manifest lists.
9. **INSP's licence note** (from `metadata.yaml`) reads: "reuse with attribution to INSP and citation of the specific report number and date. Confirm distribution terms with INSP before external republication." That is consistent with your `PUBLIC_LAUNCH_BLOCKED` rule, but we can't give a report number reliably (section 6).
10. **Stack.** The brief assumes Vite (`VITE_BASEMAP_PMTILES_URL`) and pnpm. This repo is **Next.js 16** (App Router, shadcn `base-nova` on Base UI, Hugeicons) with a **bun** lockfile. Env vars have to be `NEXT_PUBLIC_*`, and the site can still be fully static via `output: 'export'`.

---

## 11. Decisions needed before Phase 1

1. **Map library.** The brief says MapLibre with no Mapbox. The kickoff message asks for Mapbox with a token. Pick one.
2. **Package manager.** The repo has `bun.lock`; the brief says `pnpm`. Do we use bun (`bun run build-snapshot && bun dev`) or switch to pnpm?
3. **Revisions.** The brief says to use the running maximum for status. Two choices to confirm:
   - The card shows the **latest reported** cumulative value (INSP verbatim) with a "revised" marker.
   - A bump that is later revised away (Adja, 2026-10-06) still counts as a case date.
4. **Suspected cases.** Leave them out of the map and zone cards for the MVP, because the latest zone value is from 2026-05-30.
5. **Staleness.** Proposed rules:
   - **Zone-level stale** = the zone has no row on `data_as_of`.
   - **Dataset-level stale** = `data_as_of` is more than 2 calendar days before today (dates have no time). This turns the freshness line and banner to warning style; it does **not** hatch every zone.
6. **Malformed input cells** (section 7). Treat unparseable values and dates as missing, list each one in `provenance.json` under `input_anomalies`, and fail the build only on an unmatched zone name, a missing file or a changed header. Or fail on anything?
7. **Citation granularity.** Each number would cite "INSP SitRep MVE, report date YYYY-MM-DD, via INRB release `<tag>`" with no SitRep number, because none is in the data.
8. **Zenodo DOI.** Which one to cite: `10.5281/zenodo.21223302` or `10.5281/zenodo.20922946`?

---

## Appendix: every file in `build/long/`

Grain comes from classifying each `nom` value: canonical zone, alias of a zone, province, `DRC`, or non-geographic. Columns come from the matching `data/<dataset>/processed/` file, because the long files are headerless. All 113 manifest-listed files are vector files.

| `build/long/` file | Res. | Grain (from `nom` values) | Columns (from `processed/` header) | Rows | Date range | Notes |
|---|---|---|---|---:|---|---|
| `aggregated_insp_linelist__national_confirmed_cases_onset.csv` | daily | national | `nom`, `date`, `national_confirmed_cases_onset` | 1 | unparseable (non-ISO) | 1 non-ISO date value(s), e.g. `11/06/2026` |
| `aggregated_insp_linelist__provincial_confirmed_cases_onset.csv` | daily | province | `nom`, `date`, `confirmed_cases_onset` | 1 | unparseable (non-ISO) | 1 non-ISO date value(s), e.g. `11/06/2026` |
| `ccvi__socioeconomic_deprivation.csv` | static | zone | `nom`, `socioeconomic_deprivation` | 519 | — (static) |  |
| `ccvi__socioeconomic_inequality.csv` | static | zone | `nom`, `socioeconomic_inequality` | 519 | — (static) |  |
| `cross_border__poe_passengers.csv` | static | zone | `nom`, `n_poes`, `mean_daily_passengers`, `mean_weekly_passengers`, `poe_names` | 7 | — (static) |  |
| `epi__cases.csv` | weekly | zone | `nom`, `date`, `suspected_cases`, `suspected_deaths`, `confirmed_cases`, `confirmed_deaths` | 7 | 2026-05-18 → 2026-05-18 | 2 rows need `aliases.csv` |
| `epi_mve_inrb_app__recorded_cases.csv` | daily | zone | `nom`, `date`, `recorded_cases` | 5 | 2026-05-25 → 2026-05-27 | 2 rows need `aliases.csv` |
| `fao_lccs__urban_fraction.csv` | static | zone | `nom`, `urban_fraction` | 519 | — (static) |  |
| `flowminder_short_trips__ituri_subscriber_days_followup_20260608.csv` | static | zone | `nom`, `ituri_subscriber_days_followup_20260608` | 428 | — (static) |  |
| `flowminder_short_trips__ituri_subscriber_days_prior_20260503.csv` | static | zone | `nom`, `ituri_subscriber_days_prior_20260503` | 428 | — (static) |  |
| `flowminder_short_trips__nk_subscriber_days_followup_20260608.csv` | static | zone | `nom`, `nk_subscriber_days_followup_20260608` | 429 | — (static) |  |
| `flowminder_short_trips__nk_subscriber_days_prior_20260503.csv` | static | zone | `nom`, `nk_subscriber_days_prior_20260503` | 429 | — (static) |  |
| `flowminder_short_trips__outflow_20260430.csv` | static | zone | `nom`, `outflow_20260430` | 130 | — (static) |  |
| `flowminder_short_trips__outflow_20260507.csv` | static | zone | `nom`, `outflow_20260507` | 130 | — (static) |  |
| `flowminder_short_trips__outflow_20260514.csv` | static | zone | `nom`, `outflow_20260514` | 130 | — (static) |  |
| `flowminder_short_trips__outflow_20260521.csv` | static | zone | `nom`, `outflow_20260521` | 130 | — (static) |  |
| `flowminder_short_trips__outflow_20260524.csv` | static | zone | `nom`, `outflow_20260524` | 130 | — (static) |  |
| `gdp_pc__gdp_pc.csv` | static | zone | `nom`, `gdp_pc` | 519 | — (static) |  |
| `genomic_surveillance__sequence_count.csv` | static | zone | `nom`, `sequence_count` | 16 | — (static) |  |
| `grid3_healthsites__healthsite_count.csv` | static | zone | `nom`, `healthsite_count` | 519 | — (static) |  |
| `grid3_healthsites__healthsite_density.csv` | static | zone | `nom`, `healthsite_density` | 519 | — (static) |  |
| `healthsites_io__healthsite_count.csv` | static | zone | `nom`, `healthsite_count` | 519 | — (static) | 47 rows need `aliases.csv` |
| `healthsites_io__healthsite_density.csv` | static | zone | `nom`, `healthsite_density` | 519 | — (static) | 47 rows need `aliases.csv` |
| `insp_sitrep__contacts_seen.csv` | daily | zone | `nom`, `date`, `contacts_seen` | 46 | 2026-05-14 → 2026-05-24 |  |
| `insp_sitrep__cumulative_confirmed_cases.csv` | daily | zone | `nom`, `date`, `cumulative_confirmed_cases` | 6173 | 2026-05-14 → 2026-10-27 | 384 rows need `aliases.csv`; 42 non-zone rows (`NA`/`Sans Fiche`); 1 non-ISO date value(s), e.g. `2026-06-25]` |
| `insp_sitrep__cumulative_confirmed_deaths.csv` | daily | zone | `nom`, `date`, `cumulative_confirmed_deaths` | 6113 | 2026-05-14 → 2026-10-27 | 384 rows need `aliases.csv`; 42 non-zone rows (`NA`/`Sans Fiche`) |
| `insp_sitrep__cumulative_contacts_isolated.csv` | daily | zone | `nom`, `date`, `cumulative_contacts_isolated` | 48 | 2026-05-14 → 2026-05-24 |  |
| `insp_sitrep__cumulative_contacts_traced.csv` | daily | zone | `nom`, `date`, `cumulative_contacts_traced` | 131 | 2026-05-14 → 2026-05-30 |  |
| `insp_sitrep__cumulative_suspected_cases.csv` | daily | zone | `nom`, `date`, `cumulative_suspected_cases` | 189 | 2026-05-14 → 2026-05-30 |  |
| `insp_sitrep__cumulative_suspected_deaths.csv` | daily | zone | `nom`, `date`, `cumulative_suspected_deaths` | 187 | 2026-05-14 → 2026-05-30 |  |
| `insp_sitrep__hosp_escaped.csv` | daily | zone | `nom`, `date`, `escaped` | 40 | 2026-05-20 → 2026-05-30 |  |
| `insp_sitrep__hospitalised.csv` | daily | zone | `nom`, `date`, `hospitalised` | 35 | 2026-05-20 → 2026-05-30 |  |
| `insp_sitrep__in_bed_previous_day.csv` | daily | zone | `nom`, `date`, `in_bed_previous_day` | 35 | 2026-05-20 → 2026-05-30 |  |
| `insp_sitrep__national_cumulative_confirmed_cases.csv` | daily | national | `nom`, `date`, `national_cumulative_confirmed_cases` | 137 | 2026-05-14 → 2026-10-27 |  |
| `insp_sitrep__national_cumulative_confirmed_deaths.csv` | daily | national | `nom`, `date`, `national_cumulative_confirmed_deaths` | 137 | 2026-05-14 → 2026-10-27 |  |
| `insp_sitrep__national_cumulative_recovered_cases.csv` | daily | national | `nom`, `date`, `national_cumulative_recovered_cases` | 126 | 2026-05-27 → 2026-10-27 |  |
| `insp_sitrep__national_cumulative_suspected_cases.csv` | daily | national | `nom`, `date`, `national_cumulative_suspected_cases` | 70 | 2026-05-14 → 2026-08-04 |  |
| `insp_sitrep__national_cumulative_suspected_deaths.csv` | daily | national | `nom`, `date`, `national_cumulative_suspected_deaths` | 42 | 2026-05-14 → 2026-07-11 |  |
| `insp_sitrep__national_suspected_cases_in_isolation.csv` | daily | national | `nom`, `date`, `national_suspected_cases_in_isolation` | 122 | 2026-05-30 → 2026-10-27 |  |
| `insp_sitrep__national_suspected_cases_under_investigation.csv` | daily | national | `nom`, `date`, `national_suspected_cases_under_investigation` | 18 | 2026-05-30 → 2026-08-04 |  |
| `insp_sitrep__new_confirmed_cases.csv` | daily | zone | `nom`, `date`, `new_confirmed_cases` | 212 | 2026-05-14 → 2026-07-15 | 2 rows need `aliases.csv`; 1 non-zone rows (`NA`/`Sans Fiche`) |
| `insp_sitrep__new_contacts_isolated.csv` | daily | zone | `nom`, `date`, `new_contacts_isolated` | 51 | 2026-05-14 → 2026-05-24 |  |
| `insp_sitrep__new_contacts_listed.csv` | daily | zone | `nom`, `date`, `new_contacts_listed` | 136 | 2026-05-14 → 2026-05-30 |  |
| `insp_sitrep__new_hosp_admissions.csv` | daily | zone | `nom`, `date`, `new_all_admissions` | 28 | 2026-05-20 → 2026-05-27 |  |
| `insp_sitrep__new_hosp_detainees.csv` | daily | zone | `nom`, `date`, `new_hosp_detainees` | 40 | 2026-05-20 → 2026-05-30 |  |
| `insp_sitrep__new_hosp_other.csv` | daily | zone | `nom`, `date`, `new_other` | 28 | 2026-05-20 → 2026-05-27 |  |
| `insp_sitrep__new_suspected_cases.csv` | daily | zone | `nom`, `date`, `new_suspected_cases` | 155 | 2026-05-14 → 2026-05-29 |  |
| `insp_sitrep__new_suspected_deaths.csv` | daily | zone | `nom`, `date`, `new_suspected_deaths` | 155 | 2026-05-14 → 2026-05-29 |  |
| `insp_sitrep__total_poe_hand_washing.csv` | daily | zone | `nom`, `date`, `total_poe_hand_washing` | 28 | 2026-05-20 → 2026-05-23 |  |
| `insp_sitrep__total_poe_passed.csv` | daily | zone | `nom`, `date`, `total_poe_passed` | 28 | 2026-05-20 → 2026-05-23 |  |
| `insp_sitrep__total_poe_refused_hand_washing.csv` | daily | zone | `nom`, `date`, `total_poe_refused_hand_washing` | 28 | 2026-05-20 → 2026-05-23 |  |
| `insp_sitrep__total_poe_refused_screening.csv` | daily | zone | `nom`, `date`, `total_poe_refused_screening` | 28 | 2026-05-20 → 2026-05-23 |  |
| `insp_sitrep__total_poe_sanitised.csv` | daily | zone | `nom`, `date`, `total_poe_sanitised` | 28 | 2026-05-20 → 2026-05-23 |  |
| `insp_sitrep__total_poe_screened.csv` | daily | zone | `nom`, `date`, `total_poe_screened` | 28 | 2026-05-20 → 2026-05-23 |  |
| `public_health_response__epidemiological_community_engagement_en.csv` | daily | zone | `nom`, `date`, `community_engagement_en` | 30 | unparseable (non-ISO) | 7 rows need `aliases.csv`; 8 non-ISO date value(s), e.g. `02-06-2026`, `03-06-2026` |
| `public_health_response__epidemiological_community_engagement_fr.csv` | daily | zone | `nom`, `date`, `community_engagement_fr` | 30 | unparseable (non-ISO) | 7 rows need `aliases.csv`; 8 non-ISO date value(s), e.g. `02-06-2026`, `03-06-2026` |
| `public_health_response__epidemiological_coordination_en.csv` | daily | zone | `nom`, `date`, `coordination_en` | 37 | unparseable (non-ISO) | 11 non-ISO date value(s), e.g. `03-06-2026`, `07-06-2026` |
| `public_health_response__epidemiological_coordination_fr.csv` | daily | zone | `nom`, `date`, `coordination_fr` | 36 | unparseable (non-ISO) | 10 non-ISO date value(s), e.g. `03-06-2026`, `07-06-2026` |
| `public_health_response__epidemiological_infection_prevention_controle_en.csv` | daily | zone | `nom`, `date`, `infection_prevention_controle_en` | 99 | unparseable (non-ISO) | 7 rows need `aliases.csv`; 23 non-ISO date value(s), e.g. `01-06-2026`, `02-06-2026` |
| `public_health_response__epidemiological_infection_prevention_controle_fr.csv` | daily | zone | `nom`, `date`, `infection_prevention_controle_fr` | 93 | unparseable (non-ISO) | 6 rows need `aliases.csv`; 22 non-ISO date value(s), e.g. `01-06-2026`, `02-06-2026` |
| `public_health_response__epidemiological_laboratory_en.csv` | daily | zone | `nom`, `date`, `laboratory_en` | 21 | unparseable (non-ISO) | 5 rows need `aliases.csv`; 7 non-ISO date value(s), e.g. `01-06-2026`, `02-06-2026` |
| `public_health_response__epidemiological_laboratory_fr.csv` | daily | zone | `nom`, `date`, `laboratory_fr` | 21 | unparseable (non-ISO) | 5 rows need `aliases.csv`; 7 non-ISO date value(s), e.g. `01-06-2026`, `02-06-2026` |
| `public_health_response__epidemiological_logistics_en.csv` | daily | zone | `nom`, `date`, `logistics_en` | 61 | unparseable (non-ISO) | 5 rows need `aliases.csv`; 14 non-ISO date value(s), e.g. `02-06-2026`, `03-06-2026` |
| `public_health_response__epidemiological_logistics_fr.csv` | daily | zone | `nom`, `date`, `logistics_fr` | 58 | unparseable (non-ISO) | 5 rows need `aliases.csv`; 13 non-ISO date value(s), e.g. `02-06-2026`, `03-06-2026` |
| `public_health_response__epidemiological_management_en.csv` | daily | zone | `nom`, `date`, `management_en` | 97 | unparseable (non-ISO) | 4 rows need `aliases.csv`; 13 non-ISO date value(s), e.g. `02-06-2026`, `03-06-2026` |
| `public_health_response__epidemiological_management_fr.csv` | daily | zone | `nom`, `date`, `management_fr` | 97 | unparseable (non-ISO) | 4 rows need `aliases.csv`; 13 non-ISO date value(s), e.g. `02-06-2026`, `03-06-2026` |
| `public_health_response__epidemiological_monitoring_en.csv` | daily | zone | `nom`, `date`, `monitoring_en` | 138 | unparseable (non-ISO) | 5 rows need `aliases.csv`; 16 non-ISO date value(s), e.g. `01-06-2026`, `02-06-2026` |
| `public_health_response__epidemiological_monitoring_fr.csv` | daily | zone | `nom`, `date`, `monitoring_fr` | 137 | unparseable (non-ISO) | 5 rows need `aliases.csv`; 15 non-ISO date value(s), e.g. `01-06-2026`, `02-06-2026` |
| `public_health_response__epidemiological_protection_sexual_exploitation_abuse_en.csv` | daily | zone + province | `nom`, `date`, `protection_sexual_exploitation_abuse_en` | 36 | unparseable (non-ISO) | 10 rows need `aliases.csv`; 11 non-ISO date value(s), e.g. `01-06-2026`, `02-06-2026` |
| `public_health_response__epidemiological_protection_sexual_exploitation_abuse_fr.csv` | daily | zone + province | `nom`, `date`, `protection_sexual_exploitation_abuse_fr` | 36 | unparseable (non-ISO) | 10 rows need `aliases.csv`; 11 non-ISO date value(s), e.g. `01-06-2026`, `02-06-2026` |
| `public_health_response__epidemiological_security_en.csv` | daily | zone | `nom`, `date`, `security_en` | 57 | unparseable (non-ISO) | 1 rows need `aliases.csv`; 31 non-ISO date value(s), e.g. `02-06-2026`, `02-07-2026` |
| `public_health_response__epidemiological_security_fr.csv` | daily | zone | `nom`, `date`, `security_fr` | 56 | unparseable (non-ISO) | 1 rows need `aliases.csv`; 30 non-ISO date value(s), e.g. `02-06-2026`, `02-07-2026` |
| `public_health_response__national_epidemiological_community_engagement_en.csv` | daily | national | `nom`, `date`, `national_community_engagement_en` | 55 | unparseable (non-ISO) | 55 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_community_engagement_fr.csv` | daily | national | `nom`, `date`, `national_community_engagement_fr` | 55 | unparseable (non-ISO) | 55 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_coordination_en.csv` | daily | national | `nom`, `date`, `national_coordination_en` | 72 | unparseable (non-ISO) | 72 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_coordination_fr.csv` | daily | national | `nom`, `date`, `national_coordination_fr` | 72 | unparseable (non-ISO) | 72 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_infection_prevention_controle_en.csv` | daily | national | `nom`, `date`, `national_infection_prevention_controle_en` | 53 | unparseable (non-ISO) | 53 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_infection_prevention_controle_fr.csv` | daily | national | `nom`, `date`, `national_infection_prevention_controle_fr` | 53 | unparseable (non-ISO) | 53 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_laboratory_en.csv` | daily | national | `nom`, `date`, `national_laboratory_en` | 53 | unparseable (non-ISO) | 53 non-ISO date value(s), e.g. `01-07-2026`, `01-08-2026` |
| `public_health_response__national_epidemiological_laboratory_fr.csv` | daily | national | `nom`, `date`, `national_laboratory_fr` | 53 | unparseable (non-ISO) | 53 non-ISO date value(s), e.g. `01-07-2026`, `01-08-2026` |
| `public_health_response__national_epidemiological_logistics_en.csv` | daily | national | `nom`, `date`, `national_logistics_en` | 55 | unparseable (non-ISO) | 55 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_logistics_fr.csv` | daily | national | `nom`, `date`, `national_logistics_fr` | 55 | unparseable (non-ISO) | 55 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_management_en.csv` | daily | national | `nom`, `date`, `national_management_en` | 56 | unparseable (non-ISO) | 56 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_management_fr.csv` | daily | national | `nom`, `date`, `national_management_fr` | 56 | unparseable (non-ISO) | 56 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_monitoring_en.csv` | daily | province + national | `nom`, `date`, `national_monitoring_en` | 62 | unparseable (non-ISO) | 56 non-ISO date value(s), e.g. `01-07-2026`, `01-08-2026` |
| `public_health_response__national_epidemiological_monitoring_fr.csv` | daily | national | `nom`, `date`, `national_monitoring_fr` | 53 | unparseable (non-ISO) | 53 non-ISO date value(s), e.g. `01-07-2026`, `01-08-2026` |
| `public_health_response__national_epidemiological_protection_sexual_exploitation_abuse_en.csv` | daily | national | `nom`, `date`, `protection_sexual_exploitation_abuse_en` | 52 | unparseable (non-ISO) | 52 non-ISO date value(s), e.g. `01-06-2026`, `01-08-2026` |
| `public_health_response__national_epidemiological_protection_sexual_exploitation_abuse_fr.csv` | daily | national | `nom`, `date`, `protection_sexual_exploitation_abuse_fr` | 52 | unparseable (non-ISO) | 52 non-ISO date value(s), e.g. `01-06-2026`, `01-08-2026` |
| `public_health_response__national_epidemiological_security_en.csv` | daily | national | `nom`, `date`, `national_security_en` | 57 | unparseable (non-ISO) | 57 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__national_epidemiological_security_fr.csv` | daily | national | `nom`, `date`, `national_security_fr` | 57 | unparseable (non-ISO) | 57 non-ISO date value(s), e.g. `01-06-2026`, `01-07-2026` |
| `public_health_response__provincial_epidemiological_community_engagement_en.csv` | daily | province | `nom`, `date`, `provincial_community_engagement_en` | 63 | unparseable (non-ISO) | 30 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_community_engagement_fr.csv` | daily | province | `nom`, `date`, `provincial_community_engagement_fr` | 62 | unparseable (non-ISO) | 28 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_coordination_en.csv` | daily | zone + province | `nom`, `date`, `provincial_coordination_en` | 20 | unparseable (non-ISO) | 11 non-ISO date value(s), e.g. `05-06-2026`, `06-06-2026` |
| `public_health_response__provincial_epidemiological_coordination_fr.csv` | daily | zone + province | `nom`, `date`, `provincial_coordination_fr` | 20 | unparseable (non-ISO) | 11 non-ISO date value(s), e.g. `05-06-2026`, `06-06-2026` |
| `public_health_response__provincial_epidemiological_infection_prevention_controle_en.csv` | daily | province | `nom`, `date`, `provincial_infection_prevention_controle_en` | 54 | unparseable (non-ISO) | 27 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_infection_prevention_controle_fr.csv` | daily | province | `nom`, `date`, `provincial_infection_prevention_controle_fr` | 53 | unparseable (non-ISO) | 26 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_laboratory_en.csv` | daily | province | `nom`, `date`, `provincial_laboratory_en` | 74 | unparseable (non-ISO) | 29 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_laboratory_fr.csv` | daily | province | `nom`, `date`, `provincial_laboratory_fr` | 73 | unparseable (non-ISO) | 28 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_logistics_en.csv` | daily | province | `nom`, `date`, `provincial_logistics_en` | 32 | unparseable (non-ISO) | 20 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_logistics_fr.csv` | daily | province | `nom`, `date`, `provincial_logistics_fr` | 32 | unparseable (non-ISO) | 20 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_management_en.csv` | daily | province | `nom`, `date`, `provincial_management_en` | 71 | unparseable (non-ISO) | 24 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_management_fr.csv` | daily | province | `nom`, `date`, `provincial_management_fr` | 68 | unparseable (non-ISO) | 23 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_monitoring_en.csv` | daily | province | `nom`, `date`, `provincial_monitoring_en` | 71 | unparseable (non-ISO) | 28 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_monitoring_fr.csv` | daily | province | `nom`, `date`, `provincial_monitoring_fr` | 75 | unparseable (non-ISO) | 29 non-ISO date value(s), e.g. `02-07-2026`, `04-07-2026` |
| `public_health_response__provincial_epidemiological_protection_sexual_exploitation_abuse_en.csv` | daily | province | `nom`, `date`, `provincial_protection_sexual_exploitation_abuse_en` | 24 | unparseable (non-ISO) | 18 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_protection_sexual_exploitation_abuse_fr.csv` | daily | province | `nom`, `date`, `provincial_protection_sexual_exploitation_abuse_fr` | 23 | unparseable (non-ISO) | 17 non-ISO date value(s), e.g. `02-07-2026`, `03-07-2026` |
| `public_health_response__provincial_epidemiological_security_en.csv` | daily | province | `nom`, `date`, `provincial_security_en` | 7 | unparseable (non-ISO) | 4 non-ISO date value(s), e.g. `05-06-2026`, `06-06-2026` |
| `public_health_response__provincial_epidemiological_security_fr.csv` | daily | province | `nom`, `date`, `provincial_security_fr` | 7 | unparseable (non-ISO) | 4 non-ISO date value(s), e.g. `05-06-2026`, `06-06-2026` |
| `refugee_sites__sites.csv` | static | zone | `nom`, `sites` | 23 | — (static) |  |
| `testing_capacity__pcr_machines.csv` | static | zone | `nom`, `pcr_machines` | 19 | — (static) | 2 rows need `aliases.csv` |
| `testing_capacity__pcr_tests.csv` | static | zone | `nom`, `pcr_tests` | 19 | — (static) | 2 rows need `aliases.csv` |
| `worldpop__pop_count.csv` | static | zone | `nom`, `pop_count` | 519 | — (static) |  |
| `worldpop__pop_density.csv` | static | zone | `nom`, `pop_density` | 519 | — (static) |  |

**Files present in `build/long/` but not listed in `manifest.json`** (left over from earlier builds; `tools/build_geojson.py` never clears `build/long/`, so these are stale and must be ignored):

- `osrm__road_distance.csv` (520 rows)
- `osrm__travel_time.csv` (520 rows)
- `public_health_response__epidemiological_community_engagement.csv` (30 rows)
- `public_health_response__epidemiological_coordination.csv` (34 rows)
- `public_health_response__epidemiological_infection_prevention_controle.csv` (92 rows)
- `public_health_response__epidemiological_laboratory.csv` (21 rows)
- `public_health_response__epidemiological_logistics.csv` (59 rows)
- `public_health_response__epidemiological_management.csv` (97 rows)
- `public_health_response__epidemiological_monitoring.csv` (135 rows)
- `public_health_response__epidemiological_protection_sexual_exploitation_abuse.csv` (36 rows)
- `public_health_response__epidemiological_security.csv` (45 rows)
- `public_health_response__national_epidemiological_community_engagement.csv` (5 rows)
- `public_health_response__national_epidemiological_coordination.csv` (10 rows)
- `public_health_response__national_epidemiological_infection_prevention_controle.csv` (2 rows)
- `public_health_response__national_epidemiological_laboratory.csv` (2 rows)
- `public_health_response__national_epidemiological_logistics.csv` (4 rows)
- `public_health_response__national_epidemiological_management.csv` (5 rows)
- `public_health_response__national_epidemiological_monitoring.csv` (2 rows)
- `public_health_response__national_epidemiological_protection_sexual_exploitation_abuse.csv` (3 rows)
- `public_health_response__national_epidemiological_security.csv` (4 rows)
- `public_health_response__provincial_epidemiological_community_engagement.csv` (35 rows)
- `public_health_response__provincial_epidemiological_coordination.csv` (15 rows)
- `public_health_response__provincial_epidemiological_infection_prevention_controle.csv` (24 rows)
- `public_health_response__provincial_epidemiological_laboratory.csv` (30 rows)
- `public_health_response__provincial_epidemiological_logistics.csv` (8 rows)
- `public_health_response__provincial_epidemiological_management.csv` (30 rows)
- `public_health_response__provincial_epidemiological_monitoring.csv` (35 rows)
- `public_health_response__provincial_epidemiological_protection_sexual_exploitation_abuse.csv` (11 rows)
- `public_health_response__provincial_epidemiological_security.csv` (7 rows)
