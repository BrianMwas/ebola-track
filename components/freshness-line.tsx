"use client"

import * as React from "react"

import { formatRelative } from "@/lib/format"
import type { Latest } from "@/lib/schema"
import { isDatasetStale } from "@/lib/status"
import { en } from "@/lib/strings"

/** "Data as of … · INRB release … · checked … ago"; a warning when stale. */
export function FreshnessLine({ latest }: { latest: Latest }) {
  // Rendered only on the client, after the snapshot has loaded.
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const stale = isDatasetStale(latest.data_as_of, now)
  const checked = formatRelative(latest.snapshot, now)

  return (
    <div role="status" className="flex flex-col gap-2">
      <p className="text-[15px] text-ink-2">
        {en.freshness(latest.data_as_of, latest.inrb_release_tag, checked)}
      </p>
      {stale && (
        <p className="w-fit rounded-lg bg-sun-soft px-3 py-2 text-sm font-medium text-sun-foreground">
          {en.freshnessStale}
        </p>
      )}
    </div>
  )
}
