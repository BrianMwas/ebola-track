import { Call02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { en } from "@/lib/strings"

/** "What should I do?": numbered steps and hotlines. Sun yellow is kept for this block. */
export function Guide() {
  return (
    <section
      id="what-to-do"
      className="flex scroll-mt-4 flex-col gap-4 rounded-lg bg-sun-soft p-5 text-foreground"
      aria-labelledby="guide-title"
    >
      <h2 id="guide-title" className="font-heading text-[22px] leading-tight font-bold tracking-[-0.01em]">
        {en.guide.title}
      </h2>
      <ol className="flex flex-col gap-3.5">
        {en.guide.steps.map((step, i) => (
          <li key={step.title} className="grid grid-cols-[26px_minmax(0,1fr)] gap-2.5">
            <span
              aria-hidden
              className="flex size-6.5 items-center justify-center rounded-full bg-[#0b1b2e] text-sm font-bold text-sun"
            >
              {i + 1}
            </span>
            <div>
              <h3 className="text-base font-bold">{step.title}</h3>
              <p className="mt-0.5 text-[15px] text-sun-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-1 border-t border-[#e6d27a] pt-3 dark:border-[#5c5000]">
        <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold">
          <HugeiconsIcon icon={Call02Icon} size={18} aria-hidden />
          {en.guide.hotlinesTitle}
        </h3>
        {en.guide.hotlines.map((h) => (
          <p key={h.country} className="flex justify-between gap-3 text-[15px]">
            <span>{h.country}</span>
            {h.number ? (
              <a href={`tel:${h.number.replace(/\s/g, "")}`} className="font-bold text-foreground">
                {h.number}
              </a>
            ) : (
              <span className="text-sun-foreground">{en.guide.numberPending}</span>
            )}
          </p>
        ))}
      </div>
      <p className="text-[13px] text-sun-foreground">{en.guide.source}</p>
    </section>
  )
}
