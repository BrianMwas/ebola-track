"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { animate, useInView, useReducedMotion } from "motion/react"

import { motionTokens } from "@/lib/motion-tokens"

import styles from "./animated-counter.module.css"

export interface AnimatedCounterProps {
  value: number
  suffix?: string
  decimals?: number
  /** Count up the first time the number is on screen (otherwise straight away). */
  animateOnView?: boolean
  /** Seconds. */
  duration?: number
  locale?: string
}

/**
 * A number that counts up to its value, then follows later changes from where
 * it is. The final value reserves the width underneath so nothing beside it
 * moves; screen readers get only the final value.
 */
export function AnimatedCounter({
  value,
  suffix,
  decimals = 0,
  animateOnView = false,
  duration = 1.2,
  locale = "en",
}: AnimatedCounterProps) {
  const root = useRef<HTMLSpanElement>(null)
  const live = useRef<HTMLSpanElement>(null)
  const current = useRef(0)
  const started = useRef(false)
  const reduced = useReducedMotion() ?? false
  const inView = useInView(root, { once: true, amount: 0.5 })
  const run = !animateOnView || inView

  const format = useMemo(() => {
    const f = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return (n: number) => f.format(n)
  }, [decimals, locale])
  const final = format(value)

  // Before the first count, show zero rather than flashing the final value.
  useLayoutEffect(() => {
    if (!reduced && !started.current && live.current) live.current.textContent = format(0)
  }, [format, reduced])

  useEffect(() => {
    const node = live.current
    if (!node) return
    if (reduced) {
      node.textContent = final
      current.current = value
      started.current = true
      return
    }
    if (!run) return
    started.current = true
    const controls = animate(current.current, value, {
      duration: current.current === 0 ? duration : motionTokens.duration.standard * 2,
      ease: [...motionTokens.ease.enter],
      onUpdate: (latest) => {
        current.current = latest
        node.textContent = format(latest)
      },
      onComplete: () => {
        current.current = value
        node.textContent = final
      },
    })
    return () => controls.stop()
  }, [run, reduced, value, duration, format, final])

  return (
    <span ref={root} className={styles.counter}>
      <span className={styles.srOnly}>
        {final}
        {suffix}
      </span>
      <span className={styles.number} aria-hidden="true">
        <span className={styles.digits}>
          <span className={styles.sizer}>{final}</span>
          <span ref={live} className={styles.live}>
            {final}
          </span>
        </span>
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </span>
    </span>
  )
}

export default AnimatedCounter
