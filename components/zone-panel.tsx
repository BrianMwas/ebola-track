"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { dailyNewBars } from "@/lib/chart-data"
import { formatDate, formatNumber } from "@/lib/format"
import type { Latest, ZoneProperties } from "@/lib/schema"
import { en } from "@/lib/strings"
import { useTimeseries } from "@/lib/use-snapshot"
import { Badge } from "@/components/ui/badge"
import { Disclosure } from "@/components/ui/disclosure"
import { WatchCountdown } from "@/components/charts/watch-countdown"
import { STATUS_COLORS } from "@/components/map/map-style"

const ZoneTrendChart = dynamic(() => import("@/components/charts/zone-trend-chart"), {
  ssr: false,
  loading: () => <div className="h-44 animate-pulse rounded-lg bg-muted" aria-hidden />,
})

const TREND_ARROW = { up: "↑", flat: "→", down: "↓" } as const

export function ZonePanel({
  zone,
  latest,
}: {
  zone: ZoneProperties
  latest: Latest
}) {
  const ts = useTimeseries(zone.last_report_date || zone.stale ? zone.id : null, latest.snapshot)
  const bars = React.useMemo(
    () => (ts ? dailyNewBars(ts, latest.data_as_of) : null),
    [ts, latest.data_as_of]
  )
  const notes = [
    zone.status === "cleared" ? en.clearedIsOurLabel : null,
    zone.revised ? en.revised : null,
  ].filter((n): n is string => n !== null)

  return (
    <article className="flex flex-col gap-7" aria-labelledby={`zone-${zone.id}`}>
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={`zone-${zone.id}`} className="font-heading text-xl leading-tight font-medium">
            {zone.nom}
          </h2>
          <p className="text-sm text-muted-foreground">{en.zone.province(zone.province)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-2 py-1 text-sm">
            <span
              aria-hidden
              className="size-2.5 rounded-[2px] ring-1 ring-black/15"
              style={{ background: STATUS_COLORS[zone.status] }}
            />
            {en.status[zone.status]}
          </Badge>
          {zone.stale && <Badge variant="secondary" className="px-2 py-1 text-sm">{en.stale}</Badge>}
          {zone.revised && (
            <Badge variant="secondary" className="px-2 py-1 text-sm">{en.revisedBadge}</Badge>
          )}
        </div>
        <p className="text-base leading-relaxed">
          {en.statusExplain(zone.status, zone.last_case_date, zone.days_since_last_case)}
        </p>
        {zone.stale && (
          <p className="text-sm text-muted-foreground">{en.staleExplain(zone.last_report_date)}</p>
        )}
      </header>

      {zone.status === "watch" &&
        zone.days_since_last_case !== null &&
        zone.days_to_cleared !== null && (
          <WatchCountdown
            daysSinceLastCase={zone.days_since_last_case}
            daysToCleared={zone.days_to_cleared}
          />
        )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
        <Stat label={en.zone.cumulative} value={formatNumber(zone.confirmed_cases)} />
        <Stat
          label={en.zone.deaths}
          value={
            zone.confirmed_deaths === null
              ? en.zone.notReported
              : formatNumber(zone.confirmed_deaths)
          }
        />
        <Stat
          label={en.zone.lastCase}
          value={zone.last_case_date ? formatDate(zone.last_case_date) : en.zone.none}
        />
      </dl>

      {zone.status !== "never" && (
        <section className="flex flex-col gap-4" aria-label={en.zone.trend}>
          <p className="text-sm leading-relaxed">
            <span className="font-medium">
              <span aria-hidden>{TREND_ARROW[zone.trend]} </span>
              {en.trendLabel[zone.trend]}.
            </span>{" "}
            {en.trendSentence(zone.new_14d, zone.prev_14d)}
          </p>
          {bars && (
            <ZoneTrendChart bars={bars} summary={en.trendSentence(zone.new_14d, zone.prev_14d)} />
          )}
        </section>
      )}

      {notes.length > 0 && (
        <Disclosure summary={en.zone.aboutStatus}>
          {notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </Disclosure>
      )}

      <footer className="flex flex-col gap-1 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
        <p>{en.zone.source(latest.data_as_of, latest.inrb_release_tag)}</p>
        <a
          href={latest.inrb_release_url}
          target="_blank"
          rel="noreferrer"
          className="w-fit underline underline-offset-2 hover:text-foreground"
        >
          {en.zone.viewRelease}
        </a>
      </footer>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-lg font-medium tabular-nums">{value}</dd>
    </div>
  )
}
