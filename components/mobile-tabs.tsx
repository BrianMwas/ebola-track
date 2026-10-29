import { Analytics01Icon, FirstAidKitIcon, MapsIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { en } from "@/lib/strings"

const TABS = [
  { href: "#countries", label: en.nav.countries, icon: Analytics01Icon },
  { href: "#map", label: en.nav.map, icon: MapsIcon },
  { href: "#what-to-do", label: en.nav.whatToDo, icon: FirstAidKitIcon },
] as const

/** Bottom tab bar on phones: jumps to the three things people come for. */
export function MobileTabs() {
  return (
    <nav
      aria-label={en.nav.label}
      className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-3 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {TABS.map((t) => (
        <a
          key={t.href}
          href={t.href}
          className="flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-ink-2 hover:text-foreground"
        >
          <HugeiconsIcon icon={t.icon} size={22} aria-hidden />
          {t.label}
        </a>
      ))}
    </nav>
  )
}
