"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import { niceMax } from "@/lib/chart-data"
import { formatNumber, formatShortDate } from "@/lib/format"
import type { Weekly } from "@/lib/schema"
import { en } from "@/lib/strings"
import { useInViewOnce, usePrefersReducedMotion } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { SectionTitle } from "@/components/ui/section-title"

type Row = { week: string; cases: number; recent: boolean }

const config = {
  recent: { label: en.weekly.recent, color: "var(--chart-2)" },
  earlier: { label: en.weekly.earlier, color: "var(--chart-1)" },
} satisfies ChartConfig

/**
 * New confirmed cases per week across all health zones, on the shadcn Chart. The last
 * two weeks (the 14-day trend window) are brand blue; status colours are not used.
 */
export function WeeklyChart({ weekly }: { weekly: Weekly }) {
  const values = weekly.zone_total
  const n = values.length
  const top = niceMax(Math.max(...values))
  const ticks = [0.25, 0.5, 0.75, 1].map((f) => top * f)
  // The last two weeks are the 14-day trend window.
  const data: Row[] = values.map((cases, i) => ({ week: weekly.week_ends[i]!, cases, recent: i >= n - 2 }))
  // A date under every fourth bar, ending on the latest week.
  const dateTicks = weekly.week_ends.filter((_, i) => i % 4 === (n - 1) % 4)
  const reducedMotion = usePrefersReducedMotion()
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
        <div role="img" aria-label={en.weekly.chartLabel(n, peak, peakEnd, values[n - 1] ?? 0)} className="h-60">
          {/* Mounted once in view, so the bars grow in when the reader arrives. */}
          {seen && (
            <ChartContainer config={config} className="aspect-auto h-full w-full">
              <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap={4}>
                <CartesianGrid vertical={false} />
                <YAxis
                  width={44}
                  domain={[0, top]}
                  ticks={ticks}
                  tickFormatter={formatNumber}
                  tickLine={false}
                  axisLine={false}
                />
                <XAxis
                  dataKey="week"
                  ticks={dateTicks}
                  tickFormatter={formatShortDate}
                  tickLine={false}
                  axisLine={{ stroke: "var(--rule)" }}
                  interval={0}
                />
                <ChartTooltip
                  isAnimationActive={false}
                  content={
                    <ChartTooltipContent
                      hideIndicator
                      labelFormatter={(_, payload) => en.weekly.bar((payload?.[0]?.payload as Row).week, (payload?.[0]?.payload as Row).cases)}
                      formatter={() => null}
                    />
                  }
                />
                <Bar dataKey="cases" isAnimationActive={!reducedMotion} animationDuration={700} animationEasing="ease-out">
                  {data.map((d) => (
                    <Cell key={d.week} fill={d.recent ? "var(--color-recent)" : "var(--color-earlier)"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
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
