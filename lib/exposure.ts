/**
 * Exposure-window arithmetic for the "Exposure window" tool.
 *
 * Uses WHO's incubation period of 2 to 21 days. The "someone is sick" mode
 * follows the method of CDC's Ebola Exposure Window Calculator: the likely
 * exposure window runs from onset minus the longest incubation period to
 * onset minus the shortest. People do not pass Ebola on before symptoms start.
 */
import { addDays, daysBetween } from "./status"

export const INCUBATION_MIN_DAYS = 2
export const INCUBATION_MAX_DAYS = 21

export type ContactWindow = {
  /** Last day of the 21-day watch. */
  watchUntil: string
  /** Days since the last contact (0 on the day of contact). */
  day: number
  daysLeft: number
  ended: boolean
}

/** After a contact: how long to watch for symptoms. Null for a future date. */
export function contactWindow(lastContact: string, today: string): ContactWindow | null {
  const day = daysBetween(lastContact, today)
  if (day < 0) return null
  return {
    watchUntil: addDays(lastContact, INCUBATION_MAX_DAYS),
    day,
    daysLeft: Math.max(0, INCUBATION_MAX_DAYS - day),
    ended: day > INCUBATION_MAX_DAYS,
  }
}

export type InfectionWindow = { earliest: string; latest: string; onset: string }

/** For someone with symptoms: when they most likely caught it. Null for a future date. */
export function infectionWindow(onset: string, today: string): InfectionWindow | null {
  if (daysBetween(onset, today) < 0) return null
  return {
    earliest: addDays(onset, -INCUBATION_MAX_DAYS),
    latest: addDays(onset, -INCUBATION_MIN_DAYS),
    onset,
  }
}
