"use client"

import * as React from "react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { provinceRows, trackedZones } from "@/lib/chart-data"
import type { Latest, Summary, Weekly, Zones } from "@/lib/schema"
import { trendOf } from "@/lib/status"
import { en } from "@/lib/strings"
import { FreshnessLine } from "@/components/freshness-line"
import { STATUS_COLORS } from "@/components/map/map-style"
import { StatsBand, type Stat } from "@/components/stats-band/stats-band"

/** Days per bar in the "active health zones" histogram, and how many bars. */
const BIN_DAYS = 7
const BINS = 9

/** Page title, freshness and the headline numbers. */
export function Overview({
  latest,
  summary,
  zones,
  weekly,
}: {
  latest: Latest
  summary: Summary
  zones: Zones
  weekly: Weekly
}) {
  const stats = React.useMemo(() => headlineStats(summary, zones, weekly), [summary, zones, weekly])

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
        <p role="note" className="text-[13px] text-muted-foreground">
          {en.disclaimer}
        </p>
      </div>
      {/* Inked histogram bars are active zones, so they take the active status colour. */}
      <div style={{ "--stats-ink": STATUS_COLORS.active } as React.CSSProperties}>
        <StatsBand stats={stats} layout="divided" locale="en" />
      </div>
      <p className="flex items-start gap-2 text-[15px] leading-relaxed text-ink-2">
        <HugeiconsIcon icon={InformationCircleIcon} size={18} className="mt-0.5 shrink-0" aria-hidden />
        {en.overview.undercount}
      </p>
    </section>
  )
}

function headlineStats(summary: Summary, zones: Zones, weekly: Weekly): Stat[] {
  const drc = summary.countries.find((c) => c.iso3 === "COD")
  const others = summary.countries.filter((c) => c.iso3 !== "COD")
  const tracked = trackedZones(zones)
  const new14 = tracked.reduce((s, z) => s + z.new_14d, 0)
  const prev14 = tracked.reduce((s, z) => s + z.prev_14d, 0)
  const active = tracked.filter((z) => z.status === "active").length
  const activeProvinces = provinceRows(zones).filter((p) => p.active > 0).length

  // Running total of zone cases at the end of each week, ending on today's zone total.
  const zoneTotal = tracked.reduce((s, z) => s + z.confirmed_cases_effective, 0)
  let running = zoneTotal - weekly.zone_total.reduce((s, v) => s + v, 0)
  const cumulative = weekly.zone_total.map((v) => (running += v))

  // Zones that have had a case, by days since their last one; the last bar holds everything older.
  const bins = Array.from({ length: BINS }, () => 0)
  for (const z of tracked) {
    if (z.days_since_last_case === null) continue
    bins[Math.min(BINS - 1, Math.floor(z.days_since_last_case / BIN_DAYS))]++
  }

  const stats: Stat[] = []
  if (drc) {
    stats.push(
      {
        label: en.overview.casesDrc,
        value: drc.confirmed_cases,
        detail: en.overview.otherCountries(others.length),
        context: en.overview.casesContext(weekly.zone_total.length),
        visual: { kind: "trend", values: cumulative },
      },
      {
        label: en.overview.deathsDrc,
        value: drc.confirmed_deaths,
        detail: en.overview.otherCountries(others.length),
        context: drc.zones ? en.overview.deathsContext(Math.max(0, drc.zones.unassigned_deaths)) : undefined,
      }
    )
  }
  stats.push(
    {
      label: en.overview.new14,
      value: new14,
      detail: en.overview.new14Note(trendOf(new14, prev14), prev14),
      context: en.overview.new14Context(weekly.zone_total.length),
      visual: { kind: "trend", values: weekly.zone_total },
    },
    {
      label: en.overview.activeZones,
      value: active,
      detail: en.overview.activeNote(tracked.length, activeProvinces),
      context: en.overview.activeContext,
      // Bars left of day 21 are active zones.
      visual: { kind: "distribution", bins, max: BINS * BIN_DAYS, marker: 21 },
    }
  )
  return stats
}
