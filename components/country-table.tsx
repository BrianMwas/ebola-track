"use client"

import * as React from "react"

import { formatNumber, formatShortDate } from "@/lib/format"
import type { CountrySummary } from "@/lib/schema"
import type { Trend } from "@/lib/status"
import { en } from "@/lib/strings"
import { StatusMark } from "@/components/status-mark"
import { TrendArrow } from "@/components/trend-arrow"
import { SectionTitle } from "@/components/ui/section-title"
import { SortableDataTable, type DataColumn } from "@/components/sortable-data-table/sortable-data-table"

type Row = {
  iso3: string
  country: string
  situation: string
  classification: CountrySummary["classification"]
  confirmed_cases: number
  confirmed_deaths: number
  /** From the zone data, so the DRC only; null elsewhere (sorts last). */
  new_14d: number | null
  as_of: string | null
  source_name: string
  source_url: string
}

/** Cases by country, largest first. The first thing on the page. */
export function CountryTable({
  countries,
  drcNew,
  onSelect,
}: {
  countries: CountrySummary[]
  drcNew: { value: number; trend: Trend } | null
  onSelect: (iso3: string) => void
}) {
  const rows = React.useMemo<Row[]>(
    () =>
      countries.map((c) => ({
        iso3: c.iso3,
        country: c.country,
        situation: c.situation,
        classification: c.classification,
        confirmed_cases: c.confirmed_cases,
        confirmed_deaths: c.confirmed_deaths,
        new_14d: c.iso3 === "COD" && drcNew ? drcNew.value : null,
        as_of: c.as_of,
        source_name: c.source_name,
        source_url: c.source_url,
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
            className="min-h-8 text-left font-bold hover:text-link focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {r.country}
          </button>
        ),
      },
      {
        key: "situation",
        label: en.countries.situation,
        sortable: false,
        width: "30%",
        render: (_, r) => (
          <span
            className={
              r.classification === "outbreak_over"
                ? "inline-flex items-center gap-2 text-ink-2"
                : "inline-flex items-center gap-2"
            }
          >
            <SituationMark classification={r.classification} />
            {r.situation}
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
        render: (v) => formatNumber(v as number),
      },
      {
        key: "new_14d",
        label: en.countries.new14,
        numeric: true,
        render: (v) =>
          v === null || !drcNew ? (
            <span className="text-muted-foreground">{en.countries.notReported}</span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold">
              {formatNumber(v as number)}
              <TrendArrow trend={drcNew.trend} />
              <span className="sr-only">{en.trendLabel[drcNew.trend]}</span>
            </span>
          ),
      },
      {
        key: "as_of",
        label: en.countries.asOf,
        render: (_, r) => (
          <span className="text-[13px] text-muted-foreground">
            {r.as_of ? formatShortDate(r.as_of) : en.countries.dateNotGiven} ·{" "}
            <a href={r.source_url} target="_blank" rel="noreferrer">
              {r.source_name}
            </a>
          </span>
        ),
      },
    ],
    [drcNew, onSelect]
  )

  return (
    <section id="countries" className="flex scroll-mt-4 flex-col gap-3" aria-labelledby="countries-title">
      <SectionTitle id="countries-title">{en.countries.title}</SectionTitle>
      <SortableDataTable
        rows={rows}
        columns={columns}
        rowKey="iso3"
        caption={en.countries.title}
        defaultSort={{ key: "confirmed_cases", direction: "desc" }}
      />
      <p className="text-[13px] text-muted-foreground">{en.countries.note}</p>
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
