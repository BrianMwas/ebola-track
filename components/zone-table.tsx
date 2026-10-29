"use client"

import * as React from "react"

import { formatNumber } from "@/lib/format"
import type { Weekly, ZoneProperties } from "@/lib/schema"
import { en } from "@/lib/strings"
import { useInViewOnce } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"
import { StatusMark } from "@/components/status-mark"
import { TrendArrow } from "@/components/trend-arrow"
import { SectionTitle } from "@/components/ui/section-title"

const TOP = 10
const SPARK_WEEKS = 12

/** Health zones by new cases, with a 12-week sparkline each. Selecting a zone opens it on the map. */
export function ZoneTable({
  zones,
  weekly,
  selectedId,
  onSelect,
}: {
  /** Tracked zones, already ordered. */
  zones: ZoneProperties[]
  weekly: Weekly
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [all, setAll] = React.useState(false)
  const [ref, seen] = useInViewOnce<HTMLElement>()
  const shown = all ? zones : zones.slice(0, TOP)
  const th = "px-3 py-2 font-semibold"
  const td = "px-3 py-2.5"
  return (
    <section
      ref={ref}
      id="zones"
      className={cn("flex scroll-mt-4 flex-col gap-3", !seen && "reveal-wait")} aria-labelledby="zones-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <SectionTitle id="zones-title">{en.zoneTable.title}</SectionTitle>
        {zones.length > TOP && (
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            aria-expanded={all}
            className="min-h-11 text-[15px] font-semibold text-link hover:text-link-hover"
          >
            {all ? en.zoneTable.showTop(TOP) : en.zoneTable.showAll(zones.length)}
          </button>
        )}
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-b-rule text-left text-[13px] text-ink-2">
              <th scope="col" className={`${th} pl-0`}>{en.zoneTable.zone}</th>
              <th scope="col" className={`${th} text-right`}>{en.countries.new14}</th>
              <th scope="col" className={`${th} text-right`}>{en.zoneTable.prev}</th>
              <th scope="col" className={th}>{en.zoneTable.trend}</th>
              <th scope="col" className={th}>{en.zoneTable.weekly}</th>
              <th scope="col" className={`${th} pr-0 text-right`}>{en.zoneTable.total}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((z) => {
              const spark = (weekly.zones[z.id] ?? []).slice(-SPARK_WEEKS)
              const peak = Math.max(1, ...spark)
              return (
                <tr key={z.id} className={z.id === selectedId ? "border-b bg-accent" : "border-b"}>
                  <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <StatusMark status={z.status} />
                      <span className="sr-only">{en.status[z.status]}:</span>
                      <button
                        type="button"
                        onClick={() => onSelect(z.id)}
                        aria-pressed={z.id === selectedId}
                        className="min-h-8 text-left font-semibold hover:text-link focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {z.nom}
                      </button>
                      <span className="text-[13px] text-muted-foreground">{z.province}</span>
                    </span>
                  </th>
                  <td className={`${td} text-right font-bold`}>{formatNumber(z.new_14d)}</td>
                  <td className={`${td} text-right text-ink-2`}>{formatNumber(z.prev_14d)}</td>
                  <td className={td}>
                    <span className="inline-flex items-center gap-1 text-sm">
                      <TrendArrow trend={z.trend} size={15} />
                      {en.trendLabel[z.trend]}
                    </span>
                  </td>
                  <td className={td}>
                    <span
                      role="img"
                      aria-label={en.zoneTable.sparkLabel(spark)}
                      className="flex h-6.5 w-30 items-end gap-0.5"
                    >
                      {spark.map((v, i) => (
                        <span
                          key={i}
                          className={`flex-1 origin-bottom motion-safe:animate-grow-up ${i >= spark.length - 2 ? "bg-chart-2" : "bg-chart-1"}`}
                          style={{
                            height: `${Math.max(v ? 8 : 4, (v / peak) * 100)}%`,
                            animationDelay: `${i * 30}ms`,
                          }}
                        />
                      ))}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right text-ink-2">{formatNumber(z.confirmed_cases)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-muted-foreground">{en.zoneTable.note}</p>
    </section>
  )
}
