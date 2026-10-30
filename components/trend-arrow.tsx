import { ArrowDown02Icon, ArrowRight02Icon, ArrowUp02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { Trend } from "@/lib/status"

const ICON = { up: ArrowUp02Icon, flat: ArrowRight02Icon, down: ArrowDown02Icon } as const

/** Trend direction in ink; never a status colour. */
export function TrendArrow({ trend, size = 16 }: { trend: Trend; size?: number }) {
  return <HugeiconsIcon icon={ICON[trend]} size={size} strokeWidth={2} aria-hidden />
}
