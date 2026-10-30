"use client"

import * as React from "react"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type FilterFn,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import * as ts from "@/components/table-styles"

const TOP = 10
const SPARK_WEEKS = 12

type Meta = { align?: "right"; rowHeader?: boolean }

const STATUSES: ZoneStatus[] = ["active", "watch", "cleared", "never"]

/** Matches the zone or province name, ignoring case and accents. */
const fold = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
const nameOrProvince: FilterFn<ZoneProperties> = (row, _columnId, query: string) => {
  const q = fold(query.trim())
  return !q || fold(row.original.nom).includes(q) || fold(row.original.province).includes(q)
}

/**
 * Data table of tracked health zones: sortable columns, the top 10 by default,
 * a 12-week sparkline each. Selecting a zone opens it on the map.
 */
export function ZoneTable({
  zones,
  weekly,
  selectedId,
  onSelect,
}: {
  zones: ZoneProperties[]
  weekly: Weekly
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [all, setAll] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "new_14d", desc: true }])
  const [query, setQuery] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const searchId = React.useId()
  const provinceId = React.useId()
  const provinces = React.useMemo(
    () => [...new Set(zones.map((z) => z.province))].sort((a, b) => a.localeCompare(b)),
    [zones]
  )
  const [ref, seen] = useInViewOnce<HTMLElement>()

  const columns = React.useMemo<ColumnDef<ZoneProperties>[]>(
    () => [
      {
        id: "nom",
        accessorKey: "nom",
        header: en.zoneTable.zone,
        sortingFn: (a, b) => a.original.nom.localeCompare(b.original.nom),
        meta: { rowHeader: true } satisfies Meta,
        cell: ({ row: { original: z } }) => (
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
            <span className="text-[13px] font-normal text-muted-foreground">{z.province}</span>
          </span>
        ),
      },
      {
        id: "new_14d",
        accessorKey: "new_14d",
        header: en.countries.new14,
        sortDescFirst: true,
        meta: { align: "right" } satisfies Meta,
        cell: ({ getValue }) => <span className="font-bold">{formatNumber(getValue<number>())}</span>,
      },
      {
        id: "prev_14d",
        accessorKey: "prev_14d",
        header: en.zoneTable.prev,
        sortDescFirst: true,
        meta: { align: "right" } satisfies Meta,
        cell: ({ getValue }) => <span className="text-ink-2">{formatNumber(getValue<number>())}</span>,
      },
      {
        id: "trend",
        header: en.zoneTable.trend,
        enableSorting: false,
        cell: ({ row: { original: z } }) => (
          <span className="inline-flex items-center gap-1 text-sm">
            <TrendArrow trend={z.trend} size={15} />
            {en.trendLabel[z.trend]}
          </span>
        ),
      },
      {
        id: "weekly",
        header: en.zoneTable.weekly,
        enableSorting: false,
        cell: ({ row: { original: z } }) => <Sparkline values={(weekly.zones[z.id] ?? []).slice(-SPARK_WEEKS)} />,
      },
      {
        id: "confirmed_cases",
        accessorKey: "confirmed_cases",
        header: en.zoneTable.total,
        sortDescFirst: true,
        meta: { align: "right" } satisfies Meta,
        cell: ({ getValue }) => <span className="text-ink-2">{formatNumber(getValue<number>())}</span>,
      },
      // Filter-only columns, never shown.
      { id: "status", accessorKey: "status", filterFn: "equals" },
      { id: "province", accessorKey: "province", filterFn: "equals" },
    ],
    [weekly, selectedId, onSelect]
  )

  // TanStack Table returns a new object each render, so the React Compiler skips this component; that is fine here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: zones,
    columns,
    state: {
      sorting,
      globalFilter: query,
      columnFilters,
      columnVisibility: { status: false, province: false },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: nameOrProvince,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (z) => z.id,
  })
  const rows = table.getRowModel().rows
  const filtering = query.trim() !== "" || columnFilters.length > 0
  // Filters show every match; otherwise the top 10 until "See all".
  const shown = all || filtering ? rows : rows.slice(0, TOP)
  const statusFilter = (table.getColumn("status")?.getFilterValue() as ZoneStatus | undefined) ?? null
  const provinceFilter = (table.getColumn("province")?.getFilterValue() as string | undefined) ?? ""
  const clear = () => {
    setQuery("")
    setColumnFilters([])
  }

  return (
    <section
      ref={ref}
      id="zones"
      className={cn("flex scroll-mt-4 flex-col gap-3", !seen && "reveal-wait")}
      aria-labelledby="zones-title"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-0.5">
          <SectionTitle id="zones-title">{en.zoneTable.title}</SectionTitle>
          <p className="text-[15px] text-ink-2">{en.zoneTable.sortHint}</p>
        </div>
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
          <div className="flex min-h-10 items-center gap-2 rounded border border-input px-2.5 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
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
          <div role="group" aria-labelledby={`${searchId}-status`} className="flex flex-wrap overflow-hidden rounded border border-control">
            {[null, ...STATUSES].map((st, i) => (
              <button
                key={st ?? "all"}
                type="button"
                aria-pressed={statusFilter === st}
                onClick={() => table.getColumn("status")?.setFilterValue(st ?? undefined)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  i > 0 && "border-l border-control",
                  statusFilter === st
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
        <div className="flex flex-col gap-1">
          <label htmlFor={provinceId} className="text-[13px] font-semibold text-ink-2">
            {en.provinces.province}
          </label>
          <select
            id={provinceId}
            value={provinceFilter}
            onChange={(e) => table.getColumn("province")?.setFilterValue(e.target.value || undefined)}
            className="min-h-10 rounded border border-input bg-background px-2.5 text-[15px] text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <option value="">{en.zoneTable.allProvinces}</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <p aria-live="polite" className="flex min-h-10 items-center gap-3 text-sm text-ink-2">
          {en.zoneTable.count(filtering ? rows.length : shown.length, zones.length)}
          {filtering && (
            <button type="button" onClick={clear} className="font-semibold text-link hover:text-link-hover">
              {en.zoneTable.clear}
            </button>
          )}
        </p>
      </div>
      <Table className={cn(ts.table, "min-w-[720px]")}>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className={ts.headRow}>
              {group.headers.map((header) => {
                const meta = header.column.columnDef.meta as Meta | undefined
                const sorted = header.column.getIsSorted()
                const label = flexRender(header.column.columnDef.header, header.getContext())
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                    className={cn(ts.th, meta?.align === "right" && "text-right")}
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "inline-flex min-h-8 items-center gap-1 rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          sorted && "text-foreground",
                          meta?.align === "right" && "flex-row-reverse"
                        )}
                      >
                        {label}
                        <HugeiconsIcon
                          icon={sorted === "asc" ? ArrowUp01Icon : sorted === "desc" ? ArrowDown01Icon : ArrowUpDownIcon}
                          size={14}
                          strokeWidth={2}
                          className={sorted ? undefined : "opacity-50"}
                          aria-hidden
                        />
                      </button>
                    ) : (
                      <span className="inline-flex min-h-8 items-center">{label}</span>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {shown.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={table.getVisibleLeafColumns().length} className="py-8 text-center text-ink-2">
                {en.zoneTable.noMatch}
              </TableCell>
            </TableRow>
          )}
          {shown.map((row) => (
            <TableRow key={row.id} data-state={row.id === selectedId ? "selected" : undefined}>
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as Meta | undefined
                const content = flexRender(cell.column.columnDef.cell, cell.getContext())
                return meta?.rowHeader ? (
                  <TableHead key={cell.id} scope="row" className={cn(ts.rowHead, "font-normal")}>
                    {content}
                  </TableHead>
                ) : (
                  <TableCell key={cell.id} className={cn(ts.td, meta?.align === "right" && "text-right")}>
                    {content}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-[13px] text-muted-foreground">{en.zoneTable.note}</p>
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
