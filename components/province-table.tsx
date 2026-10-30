"use client"

import * as React from "react"

import type { ProvinceRow } from "@/lib/chart-data"
import { formatNumber } from "@/lib/format"
import type { CountrySummary } from "@/lib/schema"
import { en } from "@/lib/strings"
import { useInViewOnce } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"
import { SectionTitle } from "@/components/ui/section-title"
import { StatusMark } from "@/components/status-mark"
import { SortableDataTable, type DataColumn } from "@/components/sortable-data-table/sortable-data-table"

/** DRC provinces with cases: active zones and new cases. Its "?" explains deaths with no health zone. */
export function ProvinceTable({ rows, drc }: { rows: ProvinceRow[]; drc: CountrySummary | undefined }) {
  const z = drc?.zones
  const unlinked =
    z && z.unassigned_deaths > 0
      ? en.drc.unassignedDeathsExplain(z.unassigned_deaths, z.zone_sum_deaths + z.unassigned_deaths, z.unassigned_as_of)
      : null
  const maxNew = Math.max(1, ...rows.map((r) => r.new_14d))
  const [ref, seen] = useInViewOnce<HTMLElement>()

  const columns = React.useMemo<DataColumn<ProvinceRow>[]>(
    () => [
      { key: "province", label: en.provinces.province, render: (v) => <span className="font-semibold">{v as string}</span> },
      {
        key: "active",
        label: en.provinces.activeZones,
        phone: false,
        render: (_, r) => (
          <span className="inline-flex items-center gap-1.5">
            {r.active > 0 && <StatusMark status="active" />}
            <span className={r.active > 0 ? "font-semibold" : "text-ink-2"}>{r.active}</span>
          </span>
        ),
      },
      { key: "confirmed_cases", label: en.countries.cases, render: (v) => <span className="font-semibold">{formatNumber(v as number)}</span> },
      { key: "confirmed_deaths", label: en.countries.deaths, phone: false, render: (v) => <span className="text-ink-2">{formatNumber(v as number)}</span> },
      {
        key: "new_14d",
        label: en.countries.new14,
        width: "30%",
        render: (v) => (
          <span className="flex items-center gap-3 sm:justify-end">
            <span
              aria-hidden
              className="hidden h-1 max-w-32 flex-1 justify-end sm:flex"
            >
              <span
                className="block h-full rounded-full bg-chart-2"
                style={{ width: `${((v as number) / maxNew) * 100}%` }}
              />
            </span>
            <span className="font-semibold sm:w-12">{formatNumber(v as number)}</span>
          </span>
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
      <SectionTitle
        id="prov-title"
        helpLabel={en.help(en.provinces.title)}
        help={unlinked ? <p>{unlinked}</p> : undefined}
      >
        {en.provinces.title}
      </SectionTitle>
      <SortableDataTable
        rows={rows}
        columns={columns}
        rowKey="province"
        caption={en.provinces.title}
        defaultSort={{ key: "new_14d", direction: "desc" }}
      />
    </section>
  )
}
