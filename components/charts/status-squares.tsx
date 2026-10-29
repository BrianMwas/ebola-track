"use client"

import type { StatusSquare } from "@/lib/chart-data"
import { formatNumber } from "@/lib/format"
import type { ZoneStatus } from "@/lib/status"
import { en } from "@/lib/strings"
import { cn } from "@/lib/utils"

import { STATUS_COLORS } from "@/components/map/map-style"

const ORDER: ZoneStatus[] = ["active", "watch", "cleared", "never"]

/**
 * One square per health zone in the INSP reports, coloured by status.
 * Each square selects its zone.
 *
 * Stand-in for the mebius "charts-budget" card.
 */
export function StatusSquares({
  squares,
  selectedId,
  onSelect,
}: {
  squares: StatusSquare[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const counts = Object.fromEntries(
    ORDER.map((s) => [s, squares.filter((q) => q.status === s).length])
  ) as Record<ZoneStatus, number>

  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="flex flex-col gap-1 text-sm">
        <span>{en.drc.zonesByStatus}</span>
        <span className="text-xs text-muted-foreground">{en.drc.zonesByStatusHint}</span>
      </figcaption>
      <ul className="flex flex-wrap gap-1" aria-label={en.drc.zonesByStatus}>
        {squares.map((q) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => onSelect(q.id)}
              aria-label={`${q.nom}: ${en.status[q.status]}${q.stale ? `, ${en.stale.toLowerCase()}` : ""}, ${en.map.hoverNew(formatNumber(q.new14))}`}
              aria-pressed={selectedId === q.id}
              title={`${q.nom}: ${en.status[q.status]}`}
              className={cn(
                "block size-4 rounded-[3px] ring-1 ring-black/15 outline-none focus-visible:ring-2 focus-visible:ring-foreground",
                selectedId === q.id && "ring-2 ring-foreground"
              )}
              style={{
                backgroundColor: STATUS_COLORS[q.status],
                backgroundImage: q.stale
                  ? "repeating-linear-gradient(135deg, #5a5a5a 0 1.5px, transparent 1.5px 4px)"
                  : undefined,
              }}
            />
          </li>
        ))}
      </ul>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {ORDER.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 rounded-[2px] ring-1 ring-black/15"
              style={{ background: STATUS_COLORS[s] }}
            />
            <dt>{en.status[s]}</dt>
            <dd className="font-medium tabular-nums">{counts[s]}</dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}
