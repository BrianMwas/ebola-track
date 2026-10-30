"use client"

import * as React from "react"

import { formatNumber } from "@/lib/format"
import type { CountrySummary, Summary } from "@/lib/schema"
import type { Trend } from "@/lib/status"
import { en } from "@/lib/strings"
import { StatusMark } from "@/components/status-mark"
import { TrendArrow } from "@/components/trend-arrow"
import { Tip } from "@/components/ui/info-tip"
import { SectionTitle } from "@/components/ui/section-title"
import { SortableDataTable, type DataColumn } from "@/components/sortable-data-table/sortable-data-table"

type Row = {
  iso3: string
  country: string
  classification: CountrySummary["classification"]
  confirmed_cases: number
  confirmed_deaths: number
  /** From the zone data, so the DRC only; null elsewhere (sorts last). */
  new_14d: number | null
}

/** Cases by country, largest first. Situation and source open in the side panel. */
export function CountryTable({
  countries,
  noCases,
  drcNew,
  onSelect,
}: {
  countries: CountrySummary[]
  /** Countries a named source says have no confirmed case. */
  noCases: Summary["no_cases_reported"]
  drcNew: { value: number; trend: Trend } | null
  onSelect: (iso3: string) => void
}) {
  const rows = React.useMemo<Row[]>(
    () =>
      countries.map((c) => ({
        iso3: c.iso3,
        country: c.country,
        classification: c.classification,
        confirmed_cases: c.confirmed_cases,
        confirmed_deaths: c.confirmed_deaths,
        new_14d: c.iso3 === "COD" && drcNew ? drcNew.value : null,
      })),
    [countries, drcNew]
  )

  const columns = React.useMemo<DataColumn<Row>[]>(
    () => [
      {
        key: "country",
        label: en.countries.country,
        render: (_, r) => (
          <button
            type="button"
            onClick={() => onSelect(r.iso3)}
            className="inline-flex min-h-8 items-center gap-2 text-left font-bold hover:text-link focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <SituationMark classification={r.classification} />
            {r.country}
          </button>
        ),
      },
      {
        key: "classification",
        label: en.zoneTable.status,
        sortable: false,
        phone: false,
        render: (_, r) => (
          <span className="whitespace-nowrap text-ink-2">
            {en.countries.statusLabel[r.classification] ?? r.classification}
          </span>
        ),
      },
      {
        key: "confirmed_cases",
        label: en.countries.cases,
        render: (v) => <span className="font-semibold">{formatNumber(v as number)}</span>,
      },
      {
        key: "confirmed_deaths",
        label: en.countries.deaths,
        phone: false,
        render: (v) => <span className="text-ink-2">{formatNumber(v as number)}</span>,
      },
      {
        key: "new_14d",
        label: en.countries.new14,
        numeric: true,
        render: (v) =>
          v === null || !drcNew ? (
            <span className="text-muted-foreground">
              <span aria-hidden>—</span>
              <span className="sr-only">{en.countries.notReported}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold">
              {formatNumber(v as number)}
              <TrendArrow trend={drcNew.trend} />
              <span className="sr-only">{en.trendLabel[drcNew.trend]}</span>
            </span>
          ),
      },
    ],
    [drcNew, onSelect]
  )

  return (
    <section id="countries" className="flex scroll-mt-4 flex-col gap-3" aria-labelledby="countries-title">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <SectionTitle
          id="countries-title"
          helpLabel={en.help(en.countries.title)}
          help={<p>{en.countries.note}</p>}
        >
          {en.countries.title}
        </SectionTitle>
        <Tip>{en.countries.tip}</Tip>
      </div>
      <SortableDataTable
        rows={rows}
        columns={columns}
        rowKey="iso3"
        caption={en.countries.title}
        defaultSort={{ key: "confirmed_cases", direction: "desc" }}
      />
      {noCases.length > 0 && (
        <p className="text-[15px] text-ink-2">
          {noCases.map((c, i) => (
            <React.Fragment key={c.iso3}>
              {i > 0 && " · "}
              <a href={c.source_url} target="_blank" rel="noreferrer" title={c.note}>
                {en.countries.noCasesLine(c.country, c.as_of)}
              </a>
            </React.Fragment>
          ))}
        </p>
      )}
    </section>
  )
}

/** Same marks as the map: a status square for local spread, rings for country-level markers. */
function SituationMark({ classification }: { classification: CountrySummary["classification"] }) {
  if (classification === "local_transmission") return <StatusMark status="active" />
  if (classification === "outbreak_over") {
    return <span aria-hidden className="size-2.5 shrink-0 rounded-full border-2 border-dashed border-muted-foreground" />
  }
  if (classification === "imported_cluster") {
    return <span aria-hidden className="size-2.5 shrink-0 rounded-full border-2 border-foreground" />
  }
  return null
}
