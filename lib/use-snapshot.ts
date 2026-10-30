"use client"

import * as React from "react"

import type {
  Context,
  Latest,
  Summary,
  Timeseries,
  Weekly,
  Zones,
} from "./schema"

export type Snapshot = {
  latest: Latest
  summary: Summary
  zones: Zones
  context: Context
  weekly: Weekly
}

type State =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; data: Snapshot }

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return (await res.json()) as T
}

/**
 * Load the static snapshot from /data. latest.json is never cached; the other
 * files are keyed by its snapshot timestamp so a new snapshot is never mixed
 * with a cached old one.
 */
export function useSnapshot(): State {
  const [state, setState] = React.useState<State>({ state: "loading" })

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const latest = await getJson<Latest>("/data/latest.json", {
        cache: "no-store",
      })
      const v = encodeURIComponent(latest.snapshot)
      const [summary, zones, context, weekly] = await Promise.all([
        getJson<Summary>(`/data/summary.json?v=${v}`),
        getJson<Zones>(`/data/zones.geojson?v=${v}`),
        getJson<Context>(`/data/context.geojson?v=${v}`),
        getJson<Weekly>(`/data/weekly.json?v=${v}`),
      ])
      if (!cancelled) {
        setState({ state: "ready", data: { latest, summary, zones, context, weekly } })
      }
    })().catch((err: unknown) => {
      if (!cancelled) {
        setState({
          state: "error",
          message: err instanceof Error ? err.message : String(err),
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

export function useTimeseries(
  zoneId: string | null,
  snapshot: string
): Timeseries | null {
  const [loaded, setLoaded] = React.useState<Timeseries | null>(null)

  React.useEffect(() => {
    if (!zoneId) return
    let cancelled = false
    getJson<Timeseries>(
      `/data/timeseries/${zoneId}.json?v=${encodeURIComponent(snapshot)}`
    )
      .then((ts) => {
        if (!cancelled) setLoaded(ts)
      })
      // Untracked zones have no series file; the card shows no chart.
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [zoneId, snapshot])

  // Never return a previously selected zone's series.
  return loaded && loaded.id === zoneId ? loaded : null
}
