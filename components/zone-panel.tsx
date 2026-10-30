"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { dailyNewBars } from "@/lib/chart-data"
import { formatNumber, formatShortDate } from "@/lib/format"
import type { Latest, ZoneProperties } from "@/lib/schema"
import { en } from "@/lib/strings"
import { useTimeseries } from "@/lib/use-snapshot"
import { Disclosure } from "@/components/ui/disclosure"
import { WatchCountdown } from "@/components/charts/watch-countdown"
import { STATUS_TEXT } from "@/components/map/map-style"
import { StatusMark } from "@/components/status-mark"
import { TrendArrow } from "@/components/trend-arrow"
import { MetricCard } from "@/components/metric-card/metric-card"

const ZoneTrendChart = dynamic(() => import("@/components/charts/zone-trend-chart"), {
  ssr: false,
  loading: () => <div className="h-44 animate-pulse rounded-lg bg-muted" aria-hidden />,
})

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
    <article className="flex flex-col gap-4" aria-labelledby={`zone-${zone.id}`}>
      <header className="flex flex-col gap-2.5">
        <div className="flex flex-col">
          <h2
            id={`zone-${zone.id}`}
            className="font-heading text-2xl leading-tight font-bold tracking-[-0.02em]"
          >
            {zone.nom}
          </h2>
          <p className="text-sm text-muted-foreground">{en.zone.province(zone.province)}</p>
        </div>
        <p className="text-[15px] leading-relaxed">
          <span
            className="mr-1 inline-flex items-center gap-1.5 font-bold"
            style={{ color: STATUS_TEXT[zone.status] }}
          >
            <StatusMark status={zone.status} />
            {en.status[zone.status]}.
          </span>
          {en.statusExplain(zone.status, zone.last_case_date, zone.days_since_last_case)}
        </p>
        {(zone.stale || zone.revised) && (
          <div className="flex flex-wrap gap-1.5">
            {zone.stale && <Tag>{en.stale}</Tag>}
            {zone.revised && <Tag>{en.revisedBadge}</Tag>}
          </div>
        )}
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

      <div className="grid grid-cols-2 gap-x-4">
        <MetricCard
          label={en.zone.new14}
          value={zone.new_14d}
          change={signed(zone.new_14d - zone.prev_14d)}
          context={en.zone.new14Context(zone.prev_14d)}
        />
        <MetricCard
          label={en.zone.cumulative}
          value={zone.confirmed_cases}
          context={
            zone.last_case_date
              ? en.zone.lastCaseOn(formatShortDate(zone.last_case_date))
              : en.zone.none
          }
        />
        {zone.confirmed_deaths !== null ? (
          <MetricCard label={en.zone.deaths} value={zone.confirmed_deaths} context={en.zone.deathsContext} />
        ) : (
          <div className="flex flex-col border-t py-2.5">
            <span className="text-[13px] text-muted-foreground">{en.zone.deaths}</span>
            <span className="text-base font-semibold">{en.zone.notReported}</span>
          </div>
        )}
      </div>

      {zone.status !== "never" && (
        <section className="flex flex-col gap-3" aria-label={en.zone.trend}>
          <p className="text-[15px] leading-relaxed">
            <span className="mr-1 inline-flex items-center gap-0.5 font-bold">
              <TrendArrow trend={zone.trend} />
              {en.trendLabel[zone.trend]}.
            </span>
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

      <footer className="flex flex-col gap-0.5 border-t pt-3 text-[13px] leading-relaxed text-muted-foreground">
        <p>{en.zone.source(latest.data_as_of, latest.inrb_release_tag)}</p>
        <a href={latest.inrb_release_url} target="_blank" rel="noreferrer" className="w-fit font-semibold">
          {en.zone.viewRelease}
        </a>
      </footer>
    </article>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-control px-1.5 py-0.5 text-[13px] font-semibold text-ink-2">
      {children}
    </span>
  )
}

/** "+55", "−20" or "±0": the change as text, with a true minus sign. */
function signed(n: number): string {
  if (n === 0) return "±0"
  return n > 0 ? `+${formatNumber(n)}` : `−${formatNumber(-n)}`
}
