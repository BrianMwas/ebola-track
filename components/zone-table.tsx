"use client"

import * as React from "react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { formatNumber } from "@/lib/format"
import type { Weekly, ZoneProperties } from "@/lib/schema"
import type { ZoneStatus } from "@/lib/status"
import { en } from "@/lib/strings"
import { useInViewOnce } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"
import { StatusMark } from "@/components/status-mark"
import { TrendArrow } from "@/components/trend-arrow"
import { SectionTitle } from "@/components/ui/section-title"
import {
  SortableDataTable,
  type DataColumn,
  type SortState,
} from "@/components/sortable-data-table/sortable-data-table"

const TOP = 10
const SPARK_WEEKS = 12
const STATUSES: ZoneStatus[] = ["active", "watch", "cleared", "never"]
const DEFAULT_SORT: SortState = { key: "new_14d", direction: "desc" }

/** Matches the zone or province name, ignoring case and accents. */
const fold = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })

/** The table's own order, so "top 10" is the top 10 of whatever the table is sorted by. */
function bySort(sort: SortState) {
  return (a: ZoneProperties, b: ZoneProperties) => {
    const left = a[sort.key as keyof ZoneProperties]
    const right = b[sort.key as keyof ZoneProperties]
    const result =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : collator.compare(String(left), String(right))
    return sort.direction === "asc" ? result : -result
  }
}

/**
 * Tracked health zones: search (zone or province) and status filters above a sortable
 * table with a 12-week sparkline each. Selecting a zone opens it on the map.
 */
export function ZoneTable({
  zones,
  weekly,
  onSelect,
}: {
  zones: ZoneProperties[]
  weekly: Weekly
  onSelect: (id: string) => void
}) {
  const [all, setAll] = React.useState(false)
  const [sort, setSort] = React.useState<SortState>(DEFAULT_SORT)
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState<ZoneStatus | null>(null)
  const [ref, seen] = useInViewOnce<HTMLElement>()
  const searchId = React.useId()

  const filtering = query.trim() !== "" || status !== null
  const matches = React.useMemo(() => {
    const q = fold(query.trim())
    return zones.filter(
      (z) =>
        (!q || fold(z.nom).includes(q) || fold(z.province).includes(q)) &&
        (status === null || z.status === status)
    )
  }, [zones, query, status])
  // Filters show every match; otherwise the top 10 until "See all".
  const rows = React.useMemo(
    () => (all || filtering ? matches : [...matches].sort(bySort(sort)).slice(0, TOP)),
    [all, filtering, matches, sort]
  )
  const clear = () => {
    setQuery("")
    setStatus(null)
  }

  const columns = React.useMemo<DataColumn<ZoneProperties>[]>(
    () => [
      {
        key: "nom",
        label: en.zoneTable.zone,
        render: (_, z) => (
          <span className="flex items-center gap-2">
            <StatusMark status={z.status} />
            <span className="sr-only">{en.status[z.status]}:</span>
            <button
              type="button"
              onClick={() => onSelect(z.id)}
              className="min-h-8 text-left font-semibold hover:text-link focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {z.nom}
            </button>
            <span className="text-[13px] text-muted-foreground">{z.province}</span>
          </span>
        ),
      },
      {
        key: "new_14d",
        label: en.countries.new14,
        render: (v, z) => (
          <span className="inline-flex items-center gap-1 font-bold">
            {formatNumber(v as number)}
            <TrendArrow trend={z.trend} size={15} />
            <span className="sr-only">{en.trendLabel[z.trend]}</span>
          </span>
        ),
      },
      {
        key: "weekly",
        label: en.zoneTable.weekly,
        sortable: false,
        render: (_, z) => <Sparkline values={(weekly.zones[z.id] ?? []).slice(-SPARK_WEEKS)} />,
      },
      {
        key: "confirmed_cases",
        label: en.zoneTable.total,
        phone: false,
        render: (v) => <span className="text-ink-2">{formatNumber(v as number)}</span>,
      },
    ],
    [weekly, onSelect]
  )

  return (
    <section
      ref={ref}
      id="zones"
      className={cn("flex scroll-mt-4 flex-col gap-3", !seen && "reveal-wait")}
      aria-labelledby="zones-title"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <SectionTitle
          id="zones-title"
          helpLabel={en.help(en.zoneTable.title)}
          help={<p>{en.zoneTable.note}</p>}
        >
          {all || filtering ? en.zoneTable.title : en.zoneTable.titleTop}
        </SectionTitle>
        {zones.length > TOP && !filtering && (
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

      <div role="search" aria-label={en.zoneTable.filters} className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="flex w-full flex-col gap-1 sm:w-64">
          <label htmlFor={searchId} className="text-[13px] font-semibold text-ink-2">
            {en.zoneTable.search}
          </label>
          <div className="flex min-h-10 items-center gap-2 rounded-lg border border-input px-2.5 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
            <HugeiconsIcon icon={Search01Icon} size={18} aria-hidden />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={en.zoneTable.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span id={`${searchId}-status`} className="text-[13px] font-semibold text-ink-2">
            {en.zoneTable.status}
          </span>
          <div
            role="group"
            aria-labelledby={`${searchId}-status`}
            className="flex flex-wrap overflow-hidden rounded-lg border border-control"
          >
            {[null, ...STATUSES].map((st, i) => (
              <button
                key={st ?? "all"}
                type="button"
                aria-pressed={status === st}
                onClick={() => setStatus(st)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  i > 0 && "border-l border-control",
                  status === st
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "bg-background font-medium text-foreground hover:bg-muted"
                )}
              >
                {st && <StatusMark status={st} />}
                {st ? en.zoneTable.statusShort[st] : en.zoneTable.all}
              </button>
            ))}
          </div>
        </div>
        <p aria-live="polite" className="flex min-h-10 items-center gap-3 text-sm text-ink-2">
          {filtering && en.zoneTable.count(rows.length, zones.length)}
          {filtering && (
            <button type="button" onClick={clear} className="font-semibold text-link hover:text-link-hover">
              {en.zoneTable.clear}
            </button>
          )}
        </p>
      </div>

      <SortableDataTable
        rows={rows}
        columns={columns}
        rowKey="id"
        caption={en.zoneTable.title}
        emptyMessage={en.zoneTable.noMatch}
        defaultSort={DEFAULT_SORT}
        onSortChange={setSort}
      />
    </section>
  )
}

/** Weekly new cases, scaled to the zone's own peak; the last two weeks in blue. */
function Sparkline({ values }: { values: number[] }) {
  const peak = Math.max(1, ...values)
  return (
    <span role="img" aria-label={en.zoneTable.sparkLabel(values)} className="flex h-6.5 w-30 items-end gap-0.5">
      {values.map((v, i) => (
        <span
          key={i}
          className={`flex-1 origin-bottom motion-safe:animate-grow-up ${i >= values.length - 2 ? "bg-chart-2" : "bg-chart-1"}`}
          style={{ height: `${Math.max(v ? 8 : 4, (v / peak) * 100)}%`, animationDelay: `${i * 30}ms` }}
        />
      ))}
    </span>
  )
}
