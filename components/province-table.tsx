"use client"

import * as React from "react"

import type { ProvinceRow } from "@/lib/chart-data"
import { formatNumber } from "@/lib/format"
import type { CountrySummary } from "@/lib/schema"
import { en } from "@/lib/strings"
import { useInViewOnce } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"
import { Disclosure } from "@/components/ui/disclosure"
import { SectionTitle } from "@/components/ui/section-title"
import { STATUS_COLORS } from "@/components/map/map-style"

/** DRC provinces with cases, with one mark per health zone and the unassigned gap shown openly. */
export function ProvinceTable({ rows, drc }: { rows: ProvinceRow[]; drc: CountrySummary }) {
  const z = drc.zones
  const maxNew = Math.max(1, ...rows.map((r) => r.new_14d))
  const th = "px-3 py-2 font-semibold"
  const td = "px-3 py-2.5"
  const [ref, seen] = useInViewOnce<HTMLElement>()
  return (
    <section
      ref={ref}
      id="provinces"
      className={cn("flex scroll-mt-4 flex-col gap-3", !seen && "reveal-wait")} aria-labelledby="prov-title">
      <SectionTitle id="prov-title">{en.provinces.title}</SectionTitle>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-[15px]">
          <thead>
            <tr className="border-b border-b-rule text-left text-[13px] text-ink-2">
              <th scope="col" className={`${th} pl-0`}>{en.provinces.province}</th>
              <th scope="col" className={th}>{en.provinces.zones}</th>
              <th scope="col" className={`${th} text-right`}>{en.countries.cases}</th>
              <th scope="col" className={`${th} text-right`}>{en.countries.deaths}</th>
              <th scope="col" className={`${th} text-right`}>{en.countries.new14}</th>
              <th scope="col" className={`${th} w-1/5 pr-0`}>
                <span className="sr-only">{en.provinces.share}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.province} className="border-b">
                <th scope="row" className="py-2.5 pr-3 text-left font-semibold">{r.province}</th>
                <td className={td}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      role="img"
                      aria-label={en.provinces.zoneCounts(r.active, r.watch, r.cleared)}
                      className="inline-flex gap-0.5"
                    >
                      {(["active", "watch", "cleared"] as const)
                        .flatMap((s) => Array.from({ length: r[s] }, () => s))
                        .map((s, i) => (
                          <span
                            key={i}
                            className="h-3.5 w-2 rounded-[1px] motion-safe:animate-fade-in"
                            style={{ background: STATUS_COLORS[s], animationDelay: `${i * 20}ms` }}
                          />
                        ))}
                    </span>
                    <span aria-hidden className="text-[13px] text-ink-2">
                      {en.provinces.zonesShort(r.active, r.watch, r.cleared)}
                    </span>
                  </span>
                </td>
                <td className={`${td} text-right font-semibold`}>{formatNumber(r.confirmed_cases)}</td>
                <td className={`${td} text-right`}>{formatNumber(r.confirmed_deaths)}</td>
                <td className={`${td} text-right font-semibold`}>{formatNumber(r.new_14d)}</td>
                <td className="py-2.5 pl-3">
                  <span
                    aria-hidden
                    className="block h-2.5 origin-left bg-chart-2 motion-safe:animate-grow-right"
                    style={{ width: `${(r.new_14d / maxNew) * 100}%` }}
                  />
                </td>
              </tr>
            ))}
            {z && (
              <tr className="border-b text-ink-2">
                <th scope="row" className="py-2.5 pr-3 text-left font-medium">{en.provinces.unlinked}</th>
                <td className={td} />
                <td className={`${td} text-right`}>{formatNumber(Math.max(0, z.unassigned_cases))}</td>
                <td className={`${td} text-right`}>{formatNumber(Math.max(0, z.unassigned_deaths))}</td>
                <td className={td} />
                <td />
              </tr>
            )}
            <tr className="border-t border-t-rule font-bold">
              <th scope="row" className="py-2.5 pr-3 text-left">{en.provinces.total}</th>
              <td className={`${td} text-[13px] font-medium text-ink-2`}>
                {z && en.provinces.zoneCounts(z.by_status.active, z.by_status.watch, z.by_status.cleared)}
              </td>
              <td className={`${td} text-right`}>{formatNumber(drc.confirmed_cases)}</td>
              <td className={`${td} text-right`}>{formatNumber(drc.confirmed_deaths)}</td>
              <td className={`${td} text-right`}>
                {formatNumber(rows.reduce((s, r) => s + r.new_14d, 0))}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[13px] text-muted-foreground">{en.provinces.note}</p>
      {z && z.unassigned_deaths > 0 && (
        <Disclosure summary={en.drc.whyUnassigned}>
          <p>
            {en.drc.unassignedDeathsExplain(
              z.unassigned_deaths,
              z.zone_sum_deaths + z.unassigned_deaths,
              z.unassigned_as_of
            )}
          </p>
        </Disclosure>
      )}
    </section>
  )
}
