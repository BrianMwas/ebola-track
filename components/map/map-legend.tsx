"use client"

import { formatNumber } from "@/lib/format"
import { en } from "@/lib/strings"
import { StatusMark } from "@/components/status-mark"

import { INK, circleRadius, type CircleMetric } from "./map-style"

const NICE = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]

/** Up to three round reference values for the circle-size legend. */
export function legendValues(max: number): number[] {
  const pick = (limit: number) => [...NICE].reverse().find((v) => v <= limit)
  const values = [pick(max), pick(max / 4), pick(max / 16)].filter(
    (v): v is number => v !== undefined
  )
  return [...new Set(values)].sort((a, b) => a - b)
}

const STATUS_ITEMS = [
  ["active", en.mapSection.legendActive],
  ["watch", en.mapSection.legendWatch],
  ["cleared", en.mapSection.legendCleared],
  ["never", en.mapSection.legendNever],
] as const

/** Compact legend above the map attribution: status, stale hatch and circle sizes (circles from sm up). */
export function MapLegend({
  metric,
  scale,
  maxValue,
}: {
  metric: CircleMetric
  scale: number
  maxValue: number
}) {
  const values = legendValues(maxValue)
  const radii = values.map((v) => circleRadius(v, scale))
  const height = Math.ceil((radii.at(-1) ?? 0) * 2 + 4)
  // Circles side by side, 6 px apart.
  const circles = radii.map((r, i) => ({
    r,
    cx: 2 + radii.slice(0, i).reduce((s, prev) => s + prev * 2 + 6, 0) + r,
    v: values[i],
  }))
  const x = 2 + radii.reduce((s, r) => s + r * 2 + 6, 0)

  return (
    <div className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-5rem)] sm:top-auto sm:right-3 sm:bottom-9 sm:left-auto sm:max-w-[calc(100%-1.5rem)] flex-col gap-2 rounded-lg border border-control bg-background/95 px-3 py-2.5 text-[13px] text-foreground">
      <ul aria-label={en.map.legendStatus} className="grid grid-cols-2 gap-x-4 gap-y-1">
        {STATUS_ITEMS.map(([s, label]) => (
          <li key={s} className="flex items-center gap-1.5">
            <StatusMark status={s} className="size-3" />
            {label}
          </li>
        ))}
        <li className="col-span-2 flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3 rounded-[2px] ring-1 ring-[#b7c2cf] ring-inset"
            style={{
              backgroundColor: "#eef2f7",
              backgroundImage: "repeating-linear-gradient(135deg, #44546a 0 1.5px, transparent 1.5px 4px)", /* taste-skill-ignore: hatch is the map's own stale-data mark, not a gradient fill */
            }}
          />
          {en.map.legendStale}
        </li>
      </ul>
      {values.length > 0 && (
        <div className="hidden items-end gap-2.5 border-t pt-2 sm:flex">
          <svg width={x} height={height} aria-hidden>
            {circles.map((c) => (
              <circle
                key={c.v}
                cx={c.cx}
                cy={height - c.r - 2}
                r={c.r}
                fill="#ffffff"
                fillOpacity={0.6}
                stroke={INK}
                strokeWidth={1.5}
              />
            ))}
          </svg>
          <span className="leading-snug text-ink-2">
            {values.map(formatNumber).join(" · ")}
            <br />
            {metric === "new_14d" ? en.map.circlesNew : en.map.circlesTotal}
          </span>
        </div>
      )}
    </div>
  )
}
