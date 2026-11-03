import * as React from "react"
import { cn } from "cn"

import { InfoTip } from "@/components/ui/info-tip"

/** Section heading: the page's one heading style above tables and charts. `help` adds a "?" beside it.
 * It grows to fill its row, so the red rule runs up to whatever sits beside it. */
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
        "flex grow items-center gap-1 font-heading text-[22px] leading-tight font-bold tracking-[-0.01em]",
        className
      )}
      {...props}
    >
      {/* The id sits on the words, so sections labelled by it don't take in the button's name. */}
      <span id={id}>{children}</span>
      {help && <InfoTip label={helpLabel ?? "About this section"}>{help}</InfoTip>}
      {/* Brand accent, as on digital4africa: a hairline from the title to the end of the row. */}
      <span aria-hidden className="ml-2 h-px min-w-8 flex-1 bg-brand-red" />
    </h2>
  )
}

export { SectionTitle }
