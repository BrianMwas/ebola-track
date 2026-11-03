"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingFn,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUp02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type SortDirection = "asc" | "desc"
export type SortState = { key: string; direction: SortDirection }

export type DataColumn<T> = {
  key: string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
  /** Right-aligns the column. Detected when every value is a number. */
  numeric?: boolean
  /** Fixed width such as 120 or "20%". */
  width?: number | string
  /** False hides the column below 640 px. Its value can live in a detail panel. */
  phone?: boolean
}

export type DataTableProps<T extends Record<string, unknown>> = {
  rows: T[]
  columns: DataColumn<T>[]
  rowKey: keyof T | ((row: T) => string)
  /** Read by screen readers; the section heading already names the table on screen. */
  caption?: string
  emptyMessage?: string
  /** Sort applied on the first render. */
  defaultSort?: SortState
  onSortChange?: (sort: SortState) => void
}

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" })
const isEmpty = (value: unknown) => value == null || value === ""

/** Numbers by value, everything else as text with numbers inside it ordered naturally. */
const naturalSort: SortingFn<Record<string, unknown>> = (a, b, id) => {
  const left = a.getValue(id)
  const right = b.getValue(id)
  return typeof left === "number" && typeof right === "number"
    ? left - right
    : collator.compare(String(left), String(right))
}

/**
 * The shadcn data table: shadcn Table for the markup, TanStack Table for sorting.
 * Empty values stay at the bottom whichever way a column is sorted.
 */
export function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  rowKey,
  caption = "Data table",
  emptyMessage = "No rows to show",
  defaultSort,
  onSortChange,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    defaultSort ? [{ id: defaultSort.key, desc: defaultSort.direction === "desc" }] : []
  )
  const [announcement, setAnnouncement] = React.useState("")

  const numeric = React.useMemo(
    () =>
      new Set(
        columns
          .filter(
            (c) =>
              c.numeric ??
              (rows.some((r) => typeof r[c.key] === "number") &&
                rows.every((r) => typeof r[c.key] === "number" || isEmpty(r[c.key])))
          )
          .map((c) => c.key)
      ),
    [columns, rows]
  )

  const defs = React.useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((c) => ({
        id: c.key,
        // Empty cells sort as undefined, which TanStack keeps last in both directions.
        accessorFn: (row) => {
          const value = row[c.key]
          return isEmpty(value) ? undefined : value instanceof Date ? value.getTime() : value
        },
        sortUndefined: "last",
        sortingFn: naturalSort as SortingFn<T>,
        enableSorting: c.sortable !== false,
        header: c.label,
        cell: ({ row }) => {
          const value = row.original[c.key]
          return c.render ? c.render(value, row.original) : String(value ?? "–")
        },
        meta: c,
      })),
    [columns]
  )

  const table = useReactTable({
    data: rows,
    columns: defs,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(typeof rowKey === "function" ? rowKey(row) : row[rowKey]),
  })

  // First click sorts ascending, the next one flips it.
  function sortBy(column: DataColumn<T>) {
    const current = sorting[0]
    const direction: SortDirection = current?.id === column.key && !current.desc ? "desc" : "asc"
    setSorting([{ id: column.key, desc: direction === "desc" }])
    onSortChange?.({ key: column.key, direction })
    setAnnouncement(`Sorted by ${column.label}, ${direction === "asc" ? "ascending" : "descending"}`)
  }

  const sorted = sorting[0]
  const cellClass = (c: DataColumn<T>) =>
    cn(
      "px-2 first:pl-0 last:pr-0 sm:px-3",
      numeric.has(c.key) && "text-right",
      sorted?.id === c.key && "bg-link/6",
      c.phone === false && "hidden sm:table-cell"
    )

  return (
    <>
      <Table className="text-[15px]">
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader className="[&_tr]:border-rule">
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => {
              const active = sorted?.id === c.key
              const direction = active ? (sorted.desc ? "descending" : "ascending") : undefined
              return (
                <TableHead
                  key={c.key}
                  scope="col"
                  aria-sort={c.sortable === false ? undefined : (direction ?? "none")}
                  style={c.width !== undefined ? { width: c.width } : undefined}
                  className={cn(cellClass(c), "text-[13px] font-semibold text-ink-2", active && "text-foreground")}
                >
                  {c.sortable === false ? (
                    c.label
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => sortBy(c)}
                      aria-label={`Sort by ${c.label}${direction ? `, currently ${direction}` : ""}`}
                      className={cn(
                        "group/sort h-8 px-0 font-semibold text-inherit hover:bg-transparent hover:text-foreground",
                        numeric.has(c.key) && "flex-row-reverse"
                      )}
                    >
                      {c.label}
                      <HugeiconsIcon
                        icon={ArrowUp02Icon}
                        size={16}
                        strokeWidth={1.75}
                        aria-hidden
                        className={cn(
                          "transition-[transform,opacity] duration-200 motion-reduce:transition-none",
                          active
                            ? cn("text-link", sorted.desc && "rotate-180")
                            : "opacity-0 group-hover/sort:opacity-40 group-focus-visible/sort:opacity-40"
                        )}
                      />
                    </Button>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const c = cell.column.columnDef.meta as DataColumn<T>
                  return (
                    <TableCell key={cell.id} className={cn(cellClass(c), "py-2.5 whitespace-normal")}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="py-6 text-center text-ink-2">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </>
  )
}
