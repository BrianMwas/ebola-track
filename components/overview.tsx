import * as React from "react"

import { provinceRows, trackedZones } from "@/lib/chart-data"
import { formatNumber } from "@/lib/format"
import type { Latest, Summary, Zones } from "@/lib/schema"
import { trendOf } from "@/lib/status"
import { en } from "@/lib/strings"
import { FreshnessLine } from "@/components/freshness-line"
import { STATUS_TEXT } from "@/components/map/map-style"

/** Page title, freshness and the headline numbers. */
export function Overview({
  latest,
  summary,
  zones,
}: {
  latest: Latest
  summary: Summary
  zones: Zones
}) {
  const drc = summary.countries.find((c) => c.iso3 === "COD")
  const others = summary.countries.filter((c) => c.iso3 !== "COD")
  const tracked = trackedZones(zones)
  const new14 = tracked.reduce((s, z) => s + z.new_14d, 0)
  const prev14 = tracked.reduce((s, z) => s + z.prev_14d, 0)
  const active = tracked.filter((z) => z.status === "active").length
  const activeProvinces = provinceRows(zones).filter((p) => p.active > 0).length

  return (
    <section className="flex flex-col gap-5" aria-labelledby="page-title">
      <div className="flex flex-col gap-1.5">
        <h1
          id="page-title"
          className="font-heading text-[28px] leading-tight font-bold tracking-[-0.025em] sm:text-[40px]"
        >
          {en.overview.title}
        </h1>
        <FreshnessLine latest={latest} />
      </div>
      <dl className="grid grid-cols-2 border-t-2 border-t-rule sm:grid-cols-4 sm:border-b">
        {drc && (
          <Stat
            label={en.overview.casesDrc}
            value={formatNumber(drc.confirmed_cases)}
            note={en.overview.elsewhereCases(
              others.reduce((s, c) => s + c.confirmed_cases, 0),
              others.length
            )}
          />
        )}
        {drc && (
          <Stat
            label={en.overview.deathsDrc}
            value={formatNumber(drc.confirmed_deaths)}
            note={en.overview.elsewhereDeaths(others.reduce((s, c) => s + c.confirmed_deaths, 0))}
          />
        )}
        <Stat
          label={en.overview.new14}
          value={formatNumber(new14)}
          note={en.overview.new14Note(trendOf(new14, prev14), prev14)}
        />
        <Stat
          label={en.overview.activeZones}
          value={formatNumber(active)}
          valueColor={STATUS_TEXT.active}
          note={en.overview.activeNote(tracked.length, activeProvinces)}
        />
      </dl>
    </section>
  )
}

function Stat({
  label,
  value,
  note,
  valueColor,
}: {
  label: string
  value: string
  note: string
  valueColor?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b py-3.5 pr-4 even:border-l even:pl-4 sm:border-b-0 sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0">
      <dt className="text-sm text-ink-2">{label}</dt>
      <dd
        className="font-heading text-[28px] leading-tight font-bold tracking-[-0.02em] sm:text-[34px]"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </dd>
      <dd className="text-[13px] text-muted-foreground">{note}</dd>
    </div>
  )
}
