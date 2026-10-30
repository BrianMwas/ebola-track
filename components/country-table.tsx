import * as React from "react"

import { formatNumber, formatShortDate } from "@/lib/format"
import type { CountrySummary } from "@/lib/schema"
import type { Trend } from "@/lib/status"
import { en } from "@/lib/strings"
import { StatusMark } from "@/components/status-mark"
import { TrendArrow } from "@/components/trend-arrow"
import { SectionTitle } from "@/components/ui/section-title"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRowHead,
} from "@/components/ui/table"

/** Cases by country, largest first. The first thing on the page. */
export function CountryTable({
  countries,
  drcNew,
  onSelect,
}: {
  countries: CountrySummary[]
  /** New cases in 14 days from the zone data (the DRC only). */
  drcNew: { value: number; trend: Trend } | null
  onSelect: (iso3: string) => void
}) {
  const rows = [...countries].sort((a, b) => b.confirmed_cases - a.confirmed_cases)
  return (
    <section id="countries" className="flex scroll-mt-4 flex-col gap-3" aria-labelledby="countries-title">
      <SectionTitle id="countries-title">{en.countries.title}</SectionTitle>
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>{en.countries.country}</TableHead>
            <TableHead>{en.countries.situation}</TableHead>
            <TableHead className="text-right">{en.countries.cases}</TableHead>
            <TableHead className="text-right">{en.countries.deaths}</TableHead>
            <TableHead className="text-right">{en.countries.new14}</TableHead>
            <TableHead>{en.countries.asOf}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => {
            const isDrc = c.iso3 === "COD"
            return (
              <TableRow key={c.iso3} className={isDrc ? "bg-muted/60" : undefined}>
                <TableRowHead className="py-3.5 font-bold">
                  <button
                    type="button"
                    onClick={() => onSelect(c.iso3)}
                    className="min-h-8 text-left hover:text-link focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {c.country}
                  </button>
                </TableRowHead>
                <TableCell className={c.classification === "outbreak_over" ? "py-3.5 text-ink-2" : "py-3.5"}>
                  <span className="inline-flex items-center gap-2">
                    <SituationMark classification={c.classification} />
                    {c.situation}
                  </span>
                </TableCell>
                <TableCell
                  className={isDrc ? "py-3.5 text-right text-[17px] font-bold" : "py-3.5 text-right font-semibold"}
                >
                  {formatNumber(c.confirmed_cases)}
                </TableCell>
                <TableCell className="py-3.5 text-right">{formatNumber(c.confirmed_deaths)}</TableCell>
                <TableCell className="py-3.5 text-right">
                  {isDrc && drcNew ? (
                    <span className="inline-flex items-center gap-1 font-semibold">
                      {formatNumber(drcNew.value)}
                      <TrendArrow trend={drcNew.trend} />
                      <span className="sr-only">{en.trendLabel[drcNew.trend]}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{en.countries.notReported}</span>
                  )}
                </TableCell>
                <TableCell className="py-3.5 text-[13px] text-muted-foreground">
                  {c.as_of ? formatShortDate(c.as_of) : en.countries.dateNotGiven} ·{" "}
                  <a href={c.source_url} target="_blank" rel="noreferrer">
                    {c.source_name}
                  </a>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
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
