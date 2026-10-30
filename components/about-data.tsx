"use client"

import * as React from "react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { formatRelative } from "@/lib/format"
import type { Latest } from "@/lib/schema"
import { en } from "@/lib/strings"
import { Disclosure } from "@/components/ui/disclosure"

/**
 * Sidebar card: the undercount, always shown, and where the data comes from.
 * Each section's own notes sit behind the "?" beside its title.
 */
export function AboutData({ latest }: { latest: Latest }) {
  // Rendered only on the client, after the snapshot has loaded.
  const [now] = React.useState(() => new Date())

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="flex scroll-mt-4 flex-col gap-3 rounded-lg border p-5"
    >
      <h2 id="about-title" className="flex items-center gap-2 font-heading text-lg font-bold">
        <HugeiconsIcon icon={InformationCircleIcon} size={20} aria-hidden />
        {en.about.title}
      </h2>
      <p className="text-[15px] leading-relaxed">{en.about.undercount}</p>
      <div className="flex flex-col">
        <Disclosure summary={en.about.sources}>
          <p>{en.footer}</p>
          <p>{en.about.release(latest.inrb_release_tag, formatRelative(latest.snapshot, now))}</p>
        </Disclosure>
      </div>
    </section>
  )
}
