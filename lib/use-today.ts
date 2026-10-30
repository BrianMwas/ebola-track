"use client"

import { useMemo, useSyncExternalStore } from "react"

/** The viewer's local calendar date as YYYY-MM-DD. */
const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Checks once a minute, so a page left open over midnight moves to the new day. */
const subscribe = (onChange: () => void) => {
  const timer = setInterval(onChange, 60_000)
  return () => clearInterval(timer)
}

/**
 * Today in the viewer's time zone, at local midnight. Undefined during server
 * rendering and hydration, so markup never disagrees with the server.
 */
export function useToday(): Date | undefined {
  const key = useSyncExternalStore(subscribe, todayKey, () => "")
  return useMemo(() => {
    if (!key) return undefined
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y!, m! - 1, d!)
  }, [key])
}
