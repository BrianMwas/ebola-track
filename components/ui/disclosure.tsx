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
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded font-semibold text-link outline-none select-none hover:text-link-hover focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="inline-block transition-transform group-open:rotate-90"
        >
          ›
        </span>
        {summary}
      </summary>
      <div className="mt-1 flex flex-col gap-2 pl-4 leading-relaxed text-ink-2">
        {children}
      </div>
    </details>
  )
}

export { Disclosure }
