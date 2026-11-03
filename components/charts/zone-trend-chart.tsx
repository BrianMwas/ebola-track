"use client"

import * as React from "react"
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts"

import type { DailyBar } from "@/lib/chart-data"
import { formatDate, formatNumber, formatShortDate } from "@/lib/format"
import { en } from "@/lib/strings"
import { usePrefersReducedMotion } from "@/lib/use-media-query"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const config = {
  recent: { label: en.zone.chartLast14, color: "var(--chart-2)" },
  earlier: { label: en.zone.chartEarlier, color: "var(--chart-1)" },
} satisfies ChartConfig

/**
 * Daily new confirmed cases by report date, on the shadcn Chart. The last 14 days are
 * brand blue and earlier days pale blue. Status colours mean status and nothing else.
 */
export default function ZoneTrendChart({ bars, summary }: { bars: DailyBar[]; summary: string }) {
  const reducedMotion = usePrefersReducedMotion()
  const ticks = [bars[0]?.date, bars[Math.floor(bars.length / 2)]?.date, bars.at(-1)?.date].filter(
    Boolean
  ) as string[]

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-xs text-muted-foreground">{en.zone.chartTitle}</figcaption>
      <div role="img" aria-label={`${en.zone.chartTitle}. ${summary}`}>
        <ChartContainer config={config} className="aspect-auto h-36 w-full">
          <BarChart data={bars} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={1}>
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={formatShortDate}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis width={30} allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip
              isAnimationActive={false}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_, payload) => formatDate((payload?.[0]?.payload as DailyBar).date)}
                  formatter={(value) =>
                    value == null ? en.zone.chartNoReport : en.zone.chartNew(formatNumber(value as number))
                  }
                />
              }
            />
            <Bar dataKey="new" isAnimationActive={!reducedMotion} animationDuration={600} animationEasing="ease-out">
              {bars.map((b) => (
                <Cell key={b.date} fill={b.recent ? "var(--color-recent)" : "var(--color-earlier)"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <div className="flex gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-2.5 bg-chart-2" />
          {en.zone.chartLast14}
        </span>
        <span className="flex items-center gap-1">
          <span aria-hidden className="size-2.5 bg-chart-1" />
          {en.zone.chartEarlier}
        </span>
      </div>
    </figure>
  )
}
