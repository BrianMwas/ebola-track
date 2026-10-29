const numberFormat = new Intl.NumberFormat("en")
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})
const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

export function formatNumber(n: number): string {
  return numberFormat.format(n)
}

/** "27 Oct 2026" from an ISO date (YYYY-MM-DD). */
export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`))
}

/** "27 Oct" from an ISO date (YYYY-MM-DD). */
export function formatShortDate(isoDate: string): string {
  return shortDateFormat.format(new Date(`${isoDate}T00:00:00Z`))
}

/** "just now", "35 min ago", "2 h ago", "3 days ago". */
export function formatRelative(isoDateTime: string, now: Date): string {
  const minutes = Math.round((now.getTime() - Date.parse(isoDateTime)) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}
