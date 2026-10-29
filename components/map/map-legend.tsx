"use client"

import { formatNumber } from "@/lib/format"
import { en } from "@/lib/strings"
import { cn } from "@/lib/utils"
import { Disclosure } from "@/components/ui/disclosure"

import {
  INK,
  STATUS_COLORS,
  circleRadius,
  type CircleMetric,
} from "./map-style"

const NICE = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]

/** Up to three round reference values for the circle-size legend. */
export function legendValues(max: number): number[] {
  const pick = (limit: number) => [...NICE].reverse().find((v) => v <= limit)
  const values = [pick(max), pick(max / 4), pick(max / 16)].filter(
    (v): v is number => v !== undefined
  )
  return [...new Set(values)].sort((a, b) => a - b)
}

const STATUS_ORDER = ["active", "watch", "cleared", "never"] as const

export function MapLegend({
  metric,
  onMetricChange,
  scale,
  maxValue,
}: {
  metric: CircleMetric
  onMetricChange: (m: CircleMetric) => void
  scale: number
  maxValue: number
}) {
  const values = legendValues(maxValue)
  const largest = values.length ? circleRadius(values.at(-1)!, scale) : 0
  const size = Math.ceil(largest * 2 + 4)

  return (
    <div className="flex flex-col gap-6 rounded-2xl border bg-card p-6 text-sm text-card-foreground">
      <div className="flex flex-col gap-8 sm:flex-row sm:flex-wrap sm:items-start sm:gap-16">
      <div>
        <div className="mb-3 font-medium">{en.map.legendStatus}</div>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-2.5">
          {STATUS_ORDER.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-3.5 rounded-[3px] ring-1 ring-black/20"
                style={{ background: STATUS_COLORS[s] }}
              />
              {en.status[s]}
            </li>
          ))}
          <li className="col-span-2 flex items-center gap-2">
            <span
              aria-hidden
              className="size-3.5 rounded-[3px] ring-1 ring-black/20"
              style={{
                background:
                  "repeating-linear-gradient(135deg, #5a5a5a 0 1.5px, transparent 1.5px 4px)",
              }}
            />
            {en.map.legendStale}
          </li>
        </ul>
      </div>

      <div>
        <div className="mb-3 font-medium" id="circle-metric-label">
          {en.map.circleMetric}
        </div>
        <div
          role="group"
          aria-labelledby="circle-metric-label"
          className="mb-4 inline-flex rounded-lg bg-muted p-1"
        >
          {(["new_14d", "confirmed_cases"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metric === m}
              onClick={() => onMetricChange(m)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                metric === m
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "new_14d" ? en.map.circlesNew : en.map.circlesTotal}
            </button>
          ))}
        </div>
        {values.length > 0 && (
          <div className="flex items-end gap-5">
            {values.map((v) => {
              const r = circleRadius(v, scale)
              return (
                <figure key={v} className="flex flex-col items-center gap-1.5">
                  <svg width={size} height={size} aria-hidden>
                    <circle
                      cx={size / 2}
                      cy={size - r - 2}
                      r={r}
                      fill="#ffffff"
                      fillOpacity={0.45}
                      stroke={INK}
                      strokeWidth={1.5}
                    />
                  </svg>
                  <figcaption className="text-xs tabular-nums">{formatNumber(v)}</figcaption>
                </figure>
              )
            })}
          </div>
        )}
      </div>
      </div>
      <Disclosure summary={en.map.howToRead}>
        <p>{en.map.legendExplain}</p>
        <p>{en.map.circleExplain}</p>
        <p>{en.map.countryLevel}</p>
      </Disclosure>
    </div>
  )
}
