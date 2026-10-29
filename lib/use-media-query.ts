"use client"

import * as React from "react"

const DESKTOP = "(min-width: 1024px)"

/** True at the `lg` breakpoint and up. Assumes desktop before hydration. */
export function useIsDesktop(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESKTOP)
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    },
    () => window.matchMedia(DESKTOP).matches,
    () => true
  )
}
