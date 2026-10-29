import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { en } from "@/lib/strings"

/** Required on every page (hard rule 2 of the brief). */
export function SiteBanner() {
  return (
    <div
      role="note"
      className="flex items-start justify-center gap-2.5 bg-sun px-4 py-2.5 text-[13px] leading-relaxed font-medium text-[#0b1b2e] sm:items-center sm:px-8 sm:text-sm"
    >
      <HugeiconsIcon icon={InformationCircleIcon} size={18} className="mt-0.5 shrink-0 sm:mt-0" aria-hidden />
      <p className="max-w-5xl">{en.banner}</p>
    </div>
  )
}
