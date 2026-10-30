import * as React from "react"
import { cn } from "cn"

import { InfoTip } from "@/components/ui/info-tip"

/** Section heading: the page's one heading style above tables and charts. `help` adds a "?" beside it. */
function SectionTitle({
  className,
  children,
  help,
  helpLabel,
  id,
  ...props
}: React.ComponentProps<"h2"> & { help?: React.ReactNode; helpLabel?: string }) {
  return (
    <h2
      className={cn(
        "flex items-center gap-1 font-heading text-[22px] leading-tight font-bold tracking-[-0.01em]",
        className
      )}
      {...props}
    >
      {/* The id sits on the words, so sections labelled by it don't take in the button's name. */}
      <span id={id}>{children}</span>
      {help && <InfoTip label={helpLabel ?? "About this section"}>{help}</InfoTip>}
    </h2>
  )
}

export { SectionTitle }
