import * as React from "react"
import { cn } from "cn"

/** Section heading: the page's one heading style above tables and charts. */
function SectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("font-heading text-[22px] leading-tight font-bold tracking-[-0.01em]", className)}
      {...props}
    />
  )
}

export { SectionTitle }
