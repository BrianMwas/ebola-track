"use client"

import * as React from "react"
import { BulbIcon, HelpCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** A "?" button that opens a short explanation beside what it explains. Built on the shadcn Popover. */
function InfoTip({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className={cn("rounded-full text-muted-foreground data-popup-open:bg-muted data-popup-open:text-foreground", className)}
          />
        }
      >
        <HugeiconsIcon icon={HelpCircleIcon} size={18} aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto max-w-[min(340px,calc(100vw-32px))] gap-2 p-4 text-[14px] leading-relaxed font-normal tracking-normal"
      >
        {children}
      </PopoverContent>
    </Popover>
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
