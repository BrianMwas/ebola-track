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

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

/** True when the viewer asked for less motion. Assumes reduced before hydration, so nothing jumps. */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION)
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true
  )
}

/**
 * True once the element has been at least a quarter on screen; it then stays
 * true. Reveals wait for this so they play where someone can see them.
 */
export function useInViewOnce<T extends Element>(): [(node: T | null) => void, boolean] {
  const [node, setNode] = React.useState<T | null>(null)
  const [seen, setSeen] = React.useState(false)

  React.useEffect(() => {
    if (!node || seen) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true)
      },
      { threshold: 0.25 }
    )
    io.observe(node)
    return () => io.disconnect()
  }, [node, seen])

  return [setNode, seen]
}
