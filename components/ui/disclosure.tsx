import * as React from "react"
import { cn } from "cn"

/** A native <details> disclosure for secondary explanations. No JavaScript. */
function Disclosure({
  summary,
  className,
  children,
}: {
  summary: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <details data-slot="disclosure" className={cn("group text-sm", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md text-muted-foreground outline-none select-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="inline-block transition-transform group-open:rotate-90"
        >
          ›
        </span>
        {summary}
      </summary>
      <div className="mt-3 flex flex-col gap-2 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  )
}

export { Disclosure }
