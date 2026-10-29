"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { DailyBar } from "@/lib/chart-data"
import { formatDate, formatNumber, formatShortDate } from "@/lib/format"
import { en } from "@/lib/strings"
import { usePrefersReducedMotion } from "@/lib/use-media-query"

/**
 * Daily new confirmed cases by report date, with the last 14 days
 * emphasised in blue and earlier days in pale blue-grey. Neutral colours on purpose:
 * the status colours on this site mean status and nothing else.
 *
 * Stand-in for the mebius "charts-overview" card until its registry can be
 * reached; it takes the same prepared bars (lib/chart-data.ts).
 */
export default function ZoneTrendChart({
  bars,
  summary,
}: {
  bars: DailyBar[]
  summary: string
}) {
  const reducedMotion = usePrefersReducedMotion()
  const ticks = [bars[0]?.date, bars[Math.floor(bars.length / 2)]?.date, bars.at(-1)?.date]
    .filter(Boolean) as string[]

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-xs text-muted-foreground">{en.zone.chartTitle}</figcaption>
      <div role="img" aria-label={`${en.zone.chartTitle}. ${summary}`} className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap={1}>
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={formatShortDate}
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              width={30}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, payload }) => (
                <BarTooltip active={active} bar={payload?.[0]?.payload as DailyBar | undefined} />
              )}
              isAnimationActive={false}
            />
            <Bar
              dataKey="new"
              isAnimationActive={!reducedMotion}
              animationDuration={600}
              animationEasing="ease-out"
            >
              {bars.map((b) => (
                <Cell
                  key={b.date}
                  fill={b.recent ? "var(--chart-2)" : "var(--chart-1)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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

function BarTooltip({ active, bar }: { active?: boolean; bar?: DailyBar }) {
  if (!active || !bar) return null
  return (
    <div className="rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10">
      <div className="font-medium">{formatDate(bar.date)}</div>
      <div>
        {bar.new === null ? en.zone.chartNoReport : en.zone.chartNew(formatNumber(bar.new))}
      </div>
    </div>
  )
}
