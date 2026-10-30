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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import * as ts from "@/components/table-styles"
import { STATUS_COLORS } from "@/components/map/map-style"

/** DRC provinces with cases, with one mark per health zone and the unassigned gap shown openly. */
export function ProvinceTable({ rows, drc }: { rows: ProvinceRow[]; drc: CountrySummary }) {
  const z = drc.zones
  const maxNew = Math.max(1, ...rows.map((r) => r.new_14d))
  const [ref, seen] = useInViewOnce<HTMLElement>()
  return (
    <section
      ref={ref}
      id="provinces"
      className={cn("flex scroll-mt-4 flex-col gap-3", !seen && "reveal-wait")}
      aria-labelledby="prov-title"
    >
      <SectionTitle id="prov-title">{en.provinces.title}</SectionTitle>
      <Table className={cn(ts.table, "min-w-[680px]")}>
        <TableHeader>
          <TableRow className={ts.headRow}>
            <TableHead className={ts.th}>{en.provinces.province}</TableHead>
            <TableHead className={ts.th}>{en.provinces.zones}</TableHead>
            <TableHead className={cn(ts.th, "text-right")}>{en.countries.cases}</TableHead>
            <TableHead className={cn(ts.th, "text-right")}>{en.countries.deaths}</TableHead>
            <TableHead className={cn(ts.th, "text-right")}>{en.countries.new14}</TableHead>
            <TableHead className={cn(ts.th, "w-1/5")}>
              <span className="sr-only">{en.provinces.share}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.province}>
              <TableHead scope="row" className={ts.rowHead}>{r.province}</TableHead>
              <TableCell className={ts.td}>
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
              </TableCell>
              <TableCell className={cn(ts.td, "text-right font-semibold")}>{formatNumber(r.confirmed_cases)}</TableCell>
              <TableCell className={cn(ts.td, "text-right")}>{formatNumber(r.confirmed_deaths)}</TableCell>
              <TableCell className={cn(ts.td, "text-right font-semibold")}>{formatNumber(r.new_14d)}</TableCell>
              <TableCell className={ts.td}>
                <span
                  aria-hidden
                  className="block h-2.5 origin-left bg-chart-2 motion-safe:animate-grow-right"
                  style={{ width: `${(r.new_14d / maxNew) * 100}%` }}
                />
              </TableCell>
            </TableRow>
          ))}
          {z && (
            <TableRow className="text-ink-2">
              <TableHead scope="row" className={cn(ts.rowHead, "font-medium")}>{en.provinces.unlinked}</TableHead>
              <TableCell className={ts.td} />
              <TableCell className={cn(ts.td, "text-right")}>{formatNumber(Math.max(0, z.unassigned_cases))}</TableCell>
              <TableCell className={cn(ts.td, "text-right")}>{formatNumber(Math.max(0, z.unassigned_deaths))}</TableCell>
              <TableCell className={ts.td} />
              <TableCell className={ts.td} />
            </TableRow>
          )}
        </TableBody>
        <TableFooter className="border-t-rule bg-transparent font-bold">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="row" className={cn(ts.rowHead, "font-bold")}>{en.provinces.total}</TableHead>
            <TableCell className={cn(ts.td, "text-[13px] font-medium text-ink-2")}>
              {z && en.provinces.zoneCounts(z.by_status.active, z.by_status.watch, z.by_status.cleared)}
            </TableCell>
            <TableCell className={cn(ts.td, "text-right")}>{formatNumber(drc.confirmed_cases)}</TableCell>
            <TableCell className={cn(ts.td, "text-right")}>{formatNumber(drc.confirmed_deaths)}</TableCell>
            <TableCell className={cn(ts.td, "text-right")}>{formatNumber(rows.reduce((s, r) => s + r.new_14d, 0))}</TableCell>
            <TableCell className={ts.td} />
          </TableRow>
        </TableFooter>
      </Table>
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
