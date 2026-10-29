import type { ZoneStatus } from "@/lib/status"
import { cn } from "@/lib/utils"
import { STATUS_COLORS } from "@/components/map/map-style"

/** A small status swatch. Status colours mean status and nothing else. */
export function StatusMark({ status, className }: { status: ZoneStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-[2px]",
        status === "never" && "ring-1 ring-[#b7c2cf] ring-inset",
        className
      )}
      style={{ background: STATUS_COLORS[status] }}
    />
  )
}
