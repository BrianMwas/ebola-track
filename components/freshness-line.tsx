"use client"

import * as React from "react"

import { formatRelative } from "@/lib/format"
import type { Latest } from "@/lib/schema"
import { isDatasetStale } from "@/lib/status"
import { en } from "@/lib/strings"
import { cn } from "@/lib/utils"

/** "Data as of … · INRB release … · checked … ago"; warning style when stale. */
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
    <div
      role="status"
      className={cn(
        "flex flex-col gap-1 rounded-xl px-4 py-3 text-sm",
        stale
          ? "border border-amber-600/40 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
          : "bg-muted text-muted-foreground"
      )}
    >
      <p>{en.freshness(latest.data_as_of, latest.inrb_release_tag, checked)}</p>
      {stale && <p className="font-medium">{en.freshnessStale}</p>}
    </div>
  )
}
