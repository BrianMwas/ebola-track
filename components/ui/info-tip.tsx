"use client"

import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { BulbIcon, HelpCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "cn"

/** A "?" button that opens a short explanation beside what it explains. */
function InfoTip({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={label}
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-muted data-[popup-open]:text-foreground",
          className
        )}
      >
        <HugeiconsIcon icon={HelpCircleIcon} size={18} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} collisionPadding={16} className="z-50">
          <Popover.Popup className="flex max-w-[min(340px,calc(100vw-32px))] origin-[var(--transform-origin)] flex-col gap-2 rounded-lg border bg-background p-4 text-[14px] leading-relaxed font-normal tracking-normal text-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** One short hint, marked with a bulb. */
function Tip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-1.5 text-[14px] text-ink-2", className)}>
      <HugeiconsIcon icon={BulbIcon} size={16} className="shrink-0 text-sun-foreground" aria-hidden />
      {children}
    </p>
  )
}

export { InfoTip, Tip }
