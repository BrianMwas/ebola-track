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
 * Counts from 0 up to `target` once `start` is true, easing out over `duration` ms.
 * Returns the target straight away when motion is reduced.
 */
export function useCountUp(target: number, start = true, duration = 900): number {
  const reduced = usePrefersReducedMotion()
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    if (reduced || !start) return
    let frame = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      setValue(Math.round(target * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration, reduced, start])

  return reduced ? target : value
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
