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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionTitle } from "@/components/ui/section-title"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  DataTable,
  type DataColumn,
  type SortState,
} from "@/components/data-table"

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
            <span className="flex flex-wrap items-baseline gap-x-2">
              <button
                type="button"
                onClick={() => onSelect(z.id)}
                className="min-h-8 text-left font-semibold hover:text-link focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {z.nom}
              </button>
              <span className="text-[13px] whitespace-nowrap text-muted-foreground">{z.province}</span>
            </span>
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
          <Button
            variant="link"
            onClick={() => setAll((v) => !v)}
            aria-expanded={all}
            className="h-11 px-0 text-[15px] font-semibold text-link hover:text-link-hover"
          >
            {all ? en.zoneTable.showTop(TOP) : en.zoneTable.showAll(zones.length)}
          </Button>
        )}
      </div>

      <div role="search" aria-label={en.zoneTable.filters} className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="flex w-full flex-col gap-1 sm:w-64">
          <label htmlFor={searchId} className="text-[13px] font-semibold text-ink-2">
            {en.zoneTable.search}
          </label>
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={en.zoneTable.searchPlaceholder}
              className="h-10 pl-9 text-[15px] md:text-[15px]"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span id={`${searchId}-status`} className="text-[13px] font-semibold text-ink-2">
            {en.zoneTable.status}
          </span>
          <ToggleGroup
            aria-labelledby={`${searchId}-status`}
            variant="outline"
            spacing={0}
            value={[status ?? "all"]}
            onValueChange={(v) => setStatus(v[0] && v[0] !== "all" ? (v[0] as ZoneStatus) : null)}
            className="flex-wrap"
          >
            {(["all", ...STATUSES] as const).map((st) => (
              <ToggleGroupItem
                key={st}
                value={st}
                className="h-10 gap-1.5 border-control px-3 font-medium aria-pressed:bg-primary aria-pressed:font-semibold aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
              >
                {st !== "all" && <StatusMark status={st} />}
                {st !== "all" ? en.zoneTable.statusShort[st] : en.zoneTable.all}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <p aria-live="polite" className="flex min-h-10 items-center gap-3 text-sm text-ink-2">
          {filtering && en.zoneTable.count(rows.length, zones.length)}
          {filtering && (
            <Button variant="link" onClick={clear} className="h-auto px-0 font-semibold text-link hover:text-link-hover">
              {en.zoneTable.clear}
            </Button>
          )}
        </p>
      </div>

      <DataTable
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
    <span role="img" aria-label={en.zoneTable.sparkLabel(values)} className="flex h-6.5 w-20 items-end gap-px sm:w-30 sm:gap-0.5">
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
