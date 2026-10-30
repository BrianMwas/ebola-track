import { Radar01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { en } from "@/lib/strings"

export const SECTIONS = [
  { id: "countries", label: en.nav.countries },
  { id: "map", label: en.nav.map },
  { id: "weekly", label: en.nav.trend },
  { id: "provinces", label: en.nav.provinces },
  { id: "zones", label: en.nav.zones },
  { id: "what-to-do", label: en.nav.whatToDo },
] as const

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex min-h-15 max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 sm:px-8">
        <a href="#top" className="flex min-h-11 items-center gap-2.5 text-foreground hover:text-foreground">
          <HugeiconsIcon icon={Radar01Icon} size={24} strokeWidth={1.8} className="text-link" aria-hidden />
          <span className="font-heading text-lg font-bold tracking-[-0.01em]">{en.appName}</span>
          <span className="rounded-lg border border-control px-1.5 text-xs font-semibold text-muted-foreground">
            {en.privatePreview}
          </span>
        </a>
        <nav aria-label={en.nav.label} className="hidden flex-wrap gap-x-5 text-[15px] font-medium md:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex min-h-11 items-center text-ink-2 hover:text-foreground"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
