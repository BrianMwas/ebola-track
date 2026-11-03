"use client"

import CountUp from "@/components/react-bits/count-up"
import { Badge } from "@/components/ui/badge"

/**
 * A compact metric in the zone panel: label and change on top, the number, one line of
 * context. Ruled rather than boxed, to match the page. The number counts up with React
 * Bits CountUp; the change is a shadcn Badge in ink, never a status colour.
 */
export function MetricCard({
  label,
  value,
  context,
  change,
}: {
  label: string
  value: number
  context: string
  change?: string
}) {
  return (
    <article className="flex min-w-0 flex-col gap-0.5 border-t py-2.5">
      <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
        <span>{label}</span>
        {change && (
          <Badge variant="outline" className="border-control font-semibold text-foreground tabular-nums">
            {change}
          </Badge>
        )}
      </div>
      <span className="font-heading text-[22px] leading-tight font-bold">
        <span className="sr-only">{value.toLocaleString("en")}</span>
        <span aria-hidden>
          <CountUp to={value} separator="," duration={1.2} />
        </span>
      </span>
      <p className="text-[13px] leading-snug text-ink-2">{context}</p>
    </article>
  )
}
