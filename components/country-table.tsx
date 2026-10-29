import * as React from "react"

import { formatNumber, formatShortDate } from "@/lib/format"
import type { CountrySummary } from "@/lib/schema"
import type { Trend } from "@/lib/status"
import { en } from "@/lib/strings"
import { StatusMark } from "@/components/status-mark"
import { TrendArrow } from "@/components/trend-arrow"
import { SectionTitle } from "@/components/ui/section-title"

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
  const th = "px-3 py-2 font-semibold"
  return (
    <section id="countries" className="flex scroll-mt-4 flex-col gap-3" aria-labelledby="countries-title">
      <SectionTitle id="countries-title">{en.countries.title}</SectionTitle>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-b-rule text-left text-[13px] text-ink-2">
              <th scope="col" className={`${th} pl-0`}>{en.countries.country}</th>
              <th scope="col" className={th}>{en.countries.situation}</th>
              <th scope="col" className={`${th} text-right`}>{en.countries.cases}</th>
              <th scope="col" className={`${th} text-right`}>{en.countries.deaths}</th>
              <th scope="col" className={`${th} text-right`}>{en.countries.new14}</th>
              <th scope="col" className={`${th} pr-0`}>{en.countries.asOf}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const isDrc = c.iso3 === "COD"
              return (
                <tr key={c.iso3} className={isDrc ? "border-b bg-muted/60" : "border-b"}>
                  <th scope="row" className="py-3.5 pr-3 text-left font-bold">
                    <button
                      type="button"
                      onClick={() => onSelect(c.iso3)}
                      className="min-h-8 text-left hover:text-link focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {c.country}
                    </button>
                  </th>
                  <td className={c.classification === "outbreak_over" ? "px-3 py-3.5 text-ink-2" : "px-3 py-3.5"}>
                    <span className="inline-flex items-center gap-2">
                      <SituationMark classification={c.classification} />
                      {c.situation}
                    </span>
                  </td>
                  <td className={isDrc ? "px-3 py-3.5 text-right text-[17px] font-bold" : "px-3 py-3.5 text-right font-semibold"}>
                    {formatNumber(c.confirmed_cases)}
                  </td>
                  <td className="px-3 py-3.5 text-right">{formatNumber(c.confirmed_deaths)}</td>
                  <td className="px-3 py-3.5 text-right">
                    {isDrc && drcNew ? (
                      <span className="inline-flex items-center gap-1 font-semibold">
                        {formatNumber(drcNew.value)}
                        <TrendArrow trend={drcNew.trend} />
                        <span className="sr-only">{en.trendLabel[drcNew.trend]}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{en.countries.notReported}</span>
                    )}
                  </td>
                  <td className="py-3.5 pl-3 text-[13px] text-muted-foreground">
                    {c.as_of ? formatShortDate(c.as_of) : en.countries.dateNotGiven} ·{" "}
                    <a href={c.source_url} target="_blank" rel="noreferrer">
                      {c.source_name}
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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
