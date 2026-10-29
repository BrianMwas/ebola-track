import { formatNumber } from "@/lib/format"
import { en } from "@/lib/strings"
import { Disclosure } from "@/components/ui/disclosure"

/**
 * National deaths split into "linked to a health zone" and "not linked".
 * The gap is shown openly; it is never pushed into a zone.
 */
export function UnassignedMeter({
  unassigned,
  total,
  date,
}: {
  unassigned: number
  total: number
  date: string
}) {
  const share = total > 0 ? Math.max(0, unassigned) / total : 0
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex items-baseline justify-between gap-4 text-sm">
        <span>{en.drc.unassignedDeaths}</span>
        <span className="font-medium tabular-nums">
          {formatNumber(unassigned)}{" "}
          <span className="font-normal text-muted-foreground">
            {en.drc.ofTotal(formatNumber(total))}
          </span>
        </span>
      </figcaption>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={unassigned}
        aria-label={`${en.drc.unassignedDeaths}: ${formatNumber(unassigned)} ${en.drc.ofTotal(formatNumber(total))}`}
        className="flex h-2 overflow-hidden rounded-full bg-muted-foreground/60"
      >
        <span
          aria-hidden
          className="h-full border-l-2 border-background"
          style={{
            marginLeft: "auto",
            width: `${share * 100}%`,
            background:
              "repeating-linear-gradient(135deg, var(--muted-foreground) 0 1.5px, var(--muted) 1.5px 4px)",
          }}
        />
      </div>
      <Disclosure summary={en.drc.whyUnassigned}>
        <p>{en.drc.unassignedDeathsExplain(unassigned, total, date)}</p>
      </Disclosure>
    </figure>
  )
}
