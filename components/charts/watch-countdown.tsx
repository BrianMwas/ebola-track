import { ACTIVE_MAX_DAYS, WATCH_MAX_DAYS } from "@/lib/status"
import { en } from "@/lib/strings"
import { cn } from "@/lib/utils"

import { STATUS_COLORS } from "@/components/map/map-style"

/**
 * 42 ticks, one per day since the last case. Days up to 21 sit in the
 * "active" band; the zone counts as cleared after day 42.
 *
 * Stand-in for the mebius "charts-total-balance" card.
 */
export function WatchCountdown({
  daysSinceLastCase,
  daysToCleared,
}: {
  daysSinceLastCase: number
  daysToCleared: number
}) {
  const ticks = Array.from({ length: WATCH_MAX_DAYS }, (_, i) => i + 1)
  return (
    <figure className="flex flex-col gap-3 rounded-lg bg-muted p-4">
      <figcaption className="text-sm font-medium">{en.zone.countdownTitle}</figcaption>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={WATCH_MAX_DAYS}
        aria-valuenow={daysSinceLastCase}
        aria-label={en.zone.countdownAxis(daysSinceLastCase)}
        className="flex h-7 items-end gap-[2px]"
      >
        {ticks.map((day) => (
          <span
            key={day}
            aria-hidden
            className={cn(
              "flex-1 rounded-[1px]",
              day === ACTIVE_MAX_DAYS ? "h-7" : "h-5",
              day > daysSinceLastCase && "bg-muted"
            )}
            style={
              day <= daysSinceLastCase
                ? {
                    background:
                      day <= ACTIVE_MAX_DAYS ? "var(--muted-foreground)" : STATUS_COLORS.watch,
                  }
                : undefined
            }
          />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{en.zone.day(1)}</span>
        <span>{en.zone.day(ACTIVE_MAX_DAYS)}</span>
        <span>{en.zone.day(WATCH_MAX_DAYS)}</span>
      </div>
      <p className="text-sm leading-relaxed">{en.daysToCleared(daysToCleared)}</p>
    </figure>
  )
}
