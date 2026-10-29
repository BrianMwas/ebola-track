import { describe, expect, it } from "vitest"

import { contactWindow, infectionWindow } from "./exposure"

describe("contactWindow", () => {
  it("watches for 21 days after the last contact", () => {
    expect(contactWindow("2026-10-22", "2026-10-29")).toEqual({
      watchUntil: "2026-11-12",
      day: 7,
      daysLeft: 14,
      ended: false,
    })
  })

  it("ends after day 21 and refuses future dates", () => {
    expect(contactWindow("2026-10-01", "2026-10-29")?.ended).toBe(true)
    expect(contactWindow("2026-10-21", "2026-10-29")?.ended).toBe(false)
    expect(contactWindow("2026-10-30", "2026-10-29")).toBeNull()
  })
})

describe("infectionWindow", () => {
  it("runs from 21 to 2 days before symptoms started", () => {
    expect(infectionWindow("2026-10-27", "2026-10-29")).toEqual({
      earliest: "2026-10-06",
      latest: "2026-10-25",
      onset: "2026-10-27",
    })
    expect(infectionWindow("2026-11-01", "2026-10-29")).toBeNull()
  })
})
