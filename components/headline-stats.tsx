"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, Cell, YAxis } from "recharts"

import { en } from "@/lib/strings"
import { useInViewOnce, usePrefersReducedMotion } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"
import { STATUS_COLORS } from "@/components/map/map-style"
import CountUp from "@/components/react-bits/count-up"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { InfoTip } from "@/components/ui/info-tip"

/** A small picture that backs up a number. */
export type StatVisual =
  | { kind: "trend"; values: number[] }
  /** Bars over 0 to `max`; bars left of `marker` are active zones and take the active status colour. */
  | { kind: "distribution"; bins: number[]; max: number; marker: number }

export type Stat = {
  label: string
  value: number
  /** The line under the number. */
  detail?: string
  /** Longer explanation, behind a "?" beside the label. */
  context?: string
  visual?: StatVisual
}

const STAGGER = 0.09
const config = {
  value: { label: "Value", color: "var(--chart-2)" },
  earlier: { label: "Earlier", color: "var(--chart-1)" },
  active: { label: en.status.active, color: STATUS_COLORS.active },
} satisfies ChartConfig

function Trend({ values, animate }: { values: number[]; animate: boolean }) {
  const data = values.map((value, i) => ({ i, value }))
  const last = data.length - 1
  return (
    <ChartContainer config={config} className="aspect-auto h-12 w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={1.5}
          fill="var(--color-earlier)"
          fillOpacity={0.5}
          isAnimationActive={animate}
          animationDuration={900}
          dot={(p: { cx?: number; cy?: number; index?: number }) =>
            p.index === last ? (
              <circle key="end" cx={p.cx} cy={p.cy} r={3} fill="var(--color-value)" />
            ) : (
              <g key={p.index} />
            )
          }
          activeDot={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}

function Distribution({ bins, max, marker, animate }: { bins: number[]; max: number; marker: number; animate: boolean }) {
  const width = max / bins.length
  const peak = Math.max(...bins) || 1
  // A sliver for empty bins, so the axis still reads as a run of days.
  const data = bins.map((count, i) => ({ i, count: Math.max(count, peak * 0.04), active: i * width < marker }))
  return (
    <ChartContainer config={config} className="aspect-auto h-12 w-full">
      <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
        <Bar dataKey="count" isAnimationActive={animate} animationDuration={700}>
          {data.map((d) => (
            <Cell key={d.i} fill={d.active ? "var(--color-active)" : "var(--color-earlier)"} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/**
 * The page's headline numbers: ruled above, divided by hairlines, two across on phones and
 * four on wider screens. Numbers count up once with React Bits CountUp; the small charts are
 * shadcn Charts and draw in when the band comes into view.
 */
export function HeadlineStats({ stats }: { stats: Stat[] }) {
  const [ref, seen] = useInViewOnce<HTMLDListElement>()
  const reduced = usePrefersReducedMotion()
  const withVisuals = stats.some((s) => s.visual)

  return (
    <dl
      ref={ref}
      aria-label="Key numbers"
      className="grid grid-cols-2 border-t-2 border-rule md:grid-cols-4"
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            "flex flex-col gap-1 border-b py-4 pr-3",
            "max-md:odd:border-r max-md:even:pl-3 md:not-last:border-r md:not-first:pl-4"
          )}
        >
          <dt className="flex min-h-8 items-center gap-0.5 text-sm text-ink-2">
            {stat.label}
            {stat.context && (
              <InfoTip label={en.help(stat.label)} className="size-7">
                <p>{stat.context}</p>
              </InfoTip>
            )}
          </dt>
          <dd className="font-heading text-[30px] leading-none font-bold sm:text-[32px]">
            <span className="sr-only">{stat.value.toLocaleString("en")}</span>
            <span aria-hidden>
              <CountUp to={stat.value} separator="," duration={1.6} delay={i * STAGGER} startWhen={seen} />
            </span>
          </dd>
          {stat.detail && <dd className="text-[13px] leading-snug text-ink-2">{stat.detail}</dd>}
          {withVisuals && (
            <dd aria-hidden className="mt-auto h-12 pt-1">
              {seen && stat.visual?.kind === "trend" && <Trend values={stat.visual.values} animate={!reduced} />}
              {seen && stat.visual?.kind === "distribution" && (
                <Distribution {...stat.visual} animate={!reduced} />
              )}
            </dd>
          )}
        </div>
      ))}
    </dl>
  )
}
