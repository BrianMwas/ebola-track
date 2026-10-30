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
import { SortableDataTable, type DataColumn } from "@/components/sortable-data-table/sortable-data-table"

/** DRC provinces with cases, with one mark per health zone and the unassigned gap shown openly. */
export function ProvinceTable({ rows, drc }: { rows: ProvinceRow[]; drc: CountrySummary }) {
  const z = drc.zones
  const maxNew = Math.max(1, ...rows.map((r) => r.new_14d))
  const [ref, seen] = useInViewOnce<HTMLElement>()

  const columns = React.useMemo<DataColumn<ProvinceRow>[]>(
    () => [
      { key: "province", label: en.provinces.province, render: (v) => <span className="font-semibold">{v as string}</span> },
      {
        key: "active",
        label: en.provinces.zones,
        // Sorts by active zones, but shows marks, so it reads left-aligned like text.
        numeric: false,
        width: "30%",
        render: (_, r) => (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span role="img" aria-label={en.provinces.zoneCounts(r.active, r.watch, r.cleared)} className="inline-flex gap-0.5">
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
        ),
      },
      { key: "confirmed_cases", label: en.countries.cases, render: (v) => <span className="font-semibold">{formatNumber(v as number)}</span> },
      { key: "confirmed_deaths", label: en.countries.deaths, render: (v) => formatNumber(v as number) },
      { key: "new_14d", label: en.countries.new14, render: (v) => <span className="font-semibold">{formatNumber(v as number)}</span> },
      {
        key: "share",
        label: en.provinces.share,
        sortable: false,
        width: "18%",
        render: (_, r) => (
          <span
            aria-hidden
            className="block h-2.5 origin-left bg-chart-2 motion-safe:animate-grow-right"
            style={{ width: `${(r.new_14d / maxNew) * 100}%` }}
          />
        ),
      },
    ],
    [maxNew]
  )

  return (
    <section
      ref={ref}
      id="provinces"
      className={cn("flex scroll-mt-4 flex-col gap-3", !seen && "reveal-wait")}
      aria-labelledby="prov-title"
    >
      <SectionTitle id="prov-title">{en.provinces.title}</SectionTitle>
      <SortableDataTable
        rows={rows}
        columns={columns}
        rowKey="province"
        caption={en.provinces.title}
        defaultSort={{ key: "new_14d", direction: "desc" }}
      />
      <dl className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-6 text-[15px]">
        {z && (
          <div className="col-span-3 grid grid-cols-subgrid border-b py-2.5 text-ink-2">
            <dt>{en.provinces.unlinked}</dt>
            <dd className="text-right">{en.provinces.casesShort(Math.max(0, z.unassigned_cases))}</dd>
            <dd className="text-right">{en.provinces.deathsShort(Math.max(0, z.unassigned_deaths))}</dd>
          </div>
        )}
        <div className="col-span-3 grid grid-cols-subgrid border-t border-t-rule py-2.5 font-bold">
          <dt>
            {en.provinces.total}
            {z && (
              <span className="ml-2 text-[13px] font-medium text-ink-2">
                {en.provinces.zoneCounts(z.by_status.active, z.by_status.watch, z.by_status.cleared)}
              </span>
            )}
          </dt>
          <dd className="text-right">{en.provinces.casesShort(drc.confirmed_cases)}</dd>
          <dd className="text-right">{en.provinces.deathsShort(drc.confirmed_deaths)}</dd>
        </div>
      </dl>
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
