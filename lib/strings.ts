/**
 * English UI strings. French and Swahili will reuse these keys (Phase 2,
 * marked TODO_TRANSLATE); health guidance is never machine-translated.
 */
import { formatDate, formatNumber } from "./format"
import type { ZoneStatus } from "./status"

export const en = {
  appName: "East Africa Ebola status",
  appTagline: "Bundibugyo virus outbreak, 2026",
  banner:
    "Unofficial awareness tool. Data is preliminary and likely undercounts. Not medical advice. For symptoms or exposure, call your national health hotline.",
  privatePreview: "Private preview",
  loading: "Loading data",
  loadError: "Data could not be loaded",
  selectPrompt:
    "Select a health zone on the map, or a square in the DRC summary, to see its status and trend.",

  status: {
    active: "Active",
    watch: "Watch",
    cleared: "Cleared",
    never: "No confirmed cases",
  } satisfies Record<ZoneStatus, string>,
  stale: "Not in latest report",

  statusExplain(
    status: ZoneStatus,
    lastCase: string | null,
    days: number | null
  ): string {
    switch (status) {
      case "active":
        return `At least one confirmed case in the last 21 days. Last reported on ${formatDate(lastCase!)}.`
      case "watch":
        return `No new confirmed case for ${days} days. Last reported on ${formatDate(lastCase!)}.`
      case "cleared":
        return `No confirmed case for more than 42 days. Last reported on ${formatDate(lastCase!)}.`
      case "never":
        return "No confirmed case reported in this health zone."
    }
  },
  clearedIsOurLabel:
    "“Cleared” is this site's label for a health zone with no confirmed case for 42 days. It is not an official end-of-outbreak declaration.",
  daysToCleared(days: number) {
    return days === 1
      ? "1 day until this zone counts as cleared, if no new case is reported."
      : `${days} days until this zone counts as cleared, if no new case is reported.`
  },
  staleExplain(lastReport: string | null) {
    return lastReport
      ? `This zone was not in the latest report. Last updated ${formatDate(lastReport)}.`
      : "This zone is listed in reports but has no published value."
  },
  revised:
    "Revised: a later report lowered this zone's total. Status uses the highest value reported.",
  revisedBadge: "Revised",

  trendLabel: { up: "Rising", flat: "About the same", down: "Falling" },
  trendSentence(newCases: number, previous: number) {
    return `${formatNumber(newCases)} new confirmed in the last 14 days (${formatNumber(previous)} in the 14 days before).`
  },

  freshness(asOf: string, tag: string, checked: string) {
    return `Data as of ${formatDate(asOf)} · INRB release ${tag} · checked ${checked}`
  },
  freshnessStale:
    "These figures are more than 2 days old. Newer bulletins may exist.",

  map: {
    label: "Map of Ebola status by health zone",
    sectionLabel: "Map and details",
    circlesNew: "New cases, last 14 days",
    circlesTotal: "All confirmed cases",
    circleMetric: "Circle size",
    legendStatus: "Health zone status",
    legendStale: "Not in latest report",
    howToRead: "How to read the map",
    legendExplain:
      "Active: a case in the last 21 days. Watch: 22 to 42 days. Cleared: more than 42 days.",
    circleExplain:
      "Circle area is proportional to the number of cases. Zones with none have no circle.",
    hoverNew(n: string) {
      return `${n} new in last 14 days`
    },
    noBasemap:
      "Background map unavailable. Showing health zones and country outlines only.",
    countryLevel: "Marker shows the country, not where cases are.",
    insetTitle: "Cases outside the region",
  },

  drc: {
    title: "Democratic Republic of the Congo",
    confirmed: "Confirmed cases",
    deaths: "Confirmed deaths",
    zonesByStatus: "Health zones in the reports, by status",
    zonesByStatusHint: "One square per health zone. Select one to see it.",
    unassignedCases(n: number) {
      return n === 0
        ? "Every confirmed case in the national total is assigned to a health zone."
        : `${formatNumber(n)} confirmed cases in the national total are not assigned to a health zone.`
    },
    unassignedDeaths: "Deaths not linked to a health zone",
    whyUnassigned: "Why some deaths have no health zone",
    ofTotal(total: string) {
      return `of ${total}`
    },
    unassignedDeathsExplain(n: number, total: number, date: string) {
      return `${formatNumber(n)} of ${formatNumber(total)} confirmed deaths in the national total on ${formatDate(date)} have no health zone in the bulletin. They are counted nationally, not on the map.`
    },
  },

  zone: {
    cumulative: "Confirmed cases",
    deaths: "Confirmed deaths",
    lastCase: "Last new case",
    none: "None",
    notReported: "Not reported",
    trend: "Trend, 14 days",
    aboutStatus: "About this status",
    viewRelease: "View the INRB release",
    province(name: string) {
      return `${name} province, DRC`
    },
    day(n: number) {
      return `Day ${n}`
    },
    chartNew(n: string) {
      return `${n} new`
    },
    population: "Population (WorldPop 2025)",
    chartTitle: "New confirmed cases by report date, last 60 days",
    chartLast14: "Last 14 days",
    chartEarlier: "Earlier",
    chartNoReport: "No report",
    source(asOf: string, tag: string) {
      return `Data as of ${formatDate(asOf)}. INSP SitRep MVE, via INRB release ${tag}.`
    },
    close: "Close",
    countdownTitle: "Countdown to cleared",
    countdownAxis(days: number) {
      return `${days} of 42 days without a new case`
    },
  },

  country: {
    asOf(date: string | null) {
      return date ? `As of ${formatDate(date)}` : "Date not given by source"
    },
    source: "Source",
  },
}

export type Strings = typeof en
