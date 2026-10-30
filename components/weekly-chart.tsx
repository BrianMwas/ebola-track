"use client"

import * as React from "react"

import { niceMax } from "@/lib/chart-data"
import { formatNumber, formatShortDate } from "@/lib/format"
import type { Weekly } from "@/lib/schema"
import { en } from "@/lib/strings"
import { useInViewOnce } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"
import { SectionTitle } from "@/components/ui/section-title"

/**
 * New confirmed cases per week across all health zones. The last two weeks
 * (the 14-day trend window) are blue; status colours are not used.
 */
export function WeeklyChart({ weekly }: { weekly: Weekly }) {
  const values = weekly.zone_total
  const n = values.length
  const top = niceMax(Math.max(...values))
  const ticks = [1, 0.75, 0.5, 0.25].map((f) => top * f)
  const peak = Math.max(...values)
  const peakEnd = weekly.week_ends[values.indexOf(peak)]

  const [ref, seen] = useInViewOnce<HTMLElement>()
  return (
    <section
      ref={ref}
      id="weekly"
      className={cn("flex scroll-mt-4 flex-col gap-3", !seen && "reveal-wait")} aria-labelledby="weekly-title">
      <div className="flex flex-col gap-0.5">
        <SectionTitle
          id="weekly-title"
          helpLabel={en.help(en.weekly.title)}
          help={
            <>
              <p>{en.weekly.reportDate}</p>
              <p>{en.weekly.note}</p>
            </>
          }
        >
          {en.weekly.title}
        </SectionTitle>
        <p className="text-[15px] text-ink-2">
          {en.weekly.summary(values[n - 1] ?? 0, weekly.week_ends[n - 1])}
        </p>
      </div>
      <figure className="flex flex-col gap-1.5">
        <div
          role="img"
          aria-label={en.weekly.chartLabel(n, peak, peakEnd, values[n - 1] ?? 0)}
          className="relative h-56 pl-11"
        >
          {ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className="absolute right-0 left-11 border-t"
              style={{ bottom: `${(t / top) * 100}%` }}
            >
              <span className="absolute -top-2 -left-11 w-10 text-right text-xs text-muted-foreground">
                {formatNumber(t)}
              </span>
            </div>
          ))}
          <div
            className="relative grid h-full items-end gap-1 border-b border-b-rule"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
          >
            {values.map((v, i) => (
              <span
                key={weekly.week_ends[i]}
                title={en.weekly.bar(weekly.week_ends[i], v)}
                className={`origin-bottom motion-safe:animate-grow-up ${i >= n - 2 ? "bg-chart-2" : "bg-chart-1"}`}
                style={{ height: `${(v / top) * 100}%`, animationDelay: `${i * 35}ms` }}
              />
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className="grid gap-1 pl-11 text-xs text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        >
          {weekly.week_ends.map((d, i) => (
            // The last label grows leftwards so it never pokes past the edge.
            <span key={d} className={i === n - 1 ? "flex justify-end whitespace-nowrap" : "flex justify-center whitespace-nowrap"}>
              {i % 4 === (n - 1) % 4 ? formatShortDate(d) : ""}
            </span>
          ))}
        </div>
        <figcaption className="flex flex-wrap gap-x-4 gap-y-1 pl-11 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 bg-chart-2" />
            {en.weekly.recent}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 bg-chart-1" />
            {en.weekly.earlier}
          </span>
        </figcaption>
      </figure>
    </section>
  )
}
