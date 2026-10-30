/**
 * English UI strings. French and Swahili will reuse these keys (Phase 2,
 * marked TODO_TRANSLATE); health guidance is never machine-translated.
 */
import { formatDate, formatNumber, formatShortDate } from "./format"
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

  footer:
    "Primary source: INRB-UMIE/BDBV2026-Data releases, transcribed by INRB from INSP's SitRep MVE bulletins; preliminary. Other countries: the sources listed in each row. Status is measured against the dataset's latest report date, never today's date.",

  nav: {
    label: "Sections",
    countries: "Countries",
    map: "Map",
    trend: "Trend",
    provinces: "Provinces",
    zones: "Health zones",
    whatToDo: "What to do",
  },

  overview: {
    title: "Bundibugyo Ebola outbreak, 2026",
    casesDrc: "Confirmed cases, DRC",
    deathsDrc: "Confirmed deaths, DRC",
    new14: "New cases, last 14 days",
    activeZones: "Active health zones",
    elsewhereCases(n: number, countries: number) {
      return `Plus ${formatNumber(n)} in ${countries} other ${countries === 1 ? "country" : "countries"}`
    },
    elsewhereDeaths(n: number) {
      return n === 0 ? "None reported elsewhere" : `Plus ${formatNumber(n)} in other countries`
    },
    new14Note(trend: "up" | "flat" | "down", previous: number) {
      const p = formatNumber(previous)
      if (trend === "up") return `DRC · up from ${p} in the 14 days before`
      if (trend === "down") return `DRC · down from ${p} in the 14 days before`
      return `DRC · about the same as the ${p} before`
    },
    activeNote(tracked: number, provinces: number) {
      return `Of ${tracked} in the reports, across ${provinces} ${provinces === 1 ? "province" : "provinces"}`
    },
  },

  countries: {
    title: "Cases by country",
    country: "Country",
    situation: "Situation",
    cases: "Confirmed cases",
    deaths: "Deaths",
    new14: "New, 14 days",
    asOf: "As of · source",
    notReported: "Not reported",
    dateNotGiven: "Date not given",
    note: "Imported and medevac cases are counted where they were confirmed and kept apart from local transmission.",
  },

  mapSection: {
    title: "Where cases are",
    subtitle: "Health zones coloured by days since the last confirmed case. Select a zone for its trend.",
    search: "Find a health zone",
    legendActive: "Active, 0–21 days",
    legendWatch: "Watch, 22–42",
    legendCleared: "Cleared, 42+",
    legendNever: "No cases",
    note: "Circle area is proportional to cases. Country markers show the country, not where cases are. “Cleared” is this site's label, not an official end-of-outbreak declaration.",
  },

  weekly: {
    title: "New cases each week, DRC",
    summary(latestWeek: number, weekEnd: string, last14: number, prev14: number) {
      const a = formatNumber(last14)
      const b = formatNumber(prev14)
      const compare =
        Math.abs(last14 - prev14) <= 0.1 * Math.max(last14, prev14)
          ? "about the same as"
          : last14 > prev14
            ? "more than"
            : "fewer than"
      return `${formatNumber(latestWeek)} new confirmed cases in the week to ${formatShortDate(weekEnd)}. The last 14 days (${a}) are ${compare} the 14 before (${b}).`
    },
    chartLabel(weeks: number, peak: number, peakEnd: string, latest: number) {
      return `Weekly new confirmed cases in the DRC by report date, ${weeks} weeks. Peak of ${formatNumber(peak)} in the week to ${formatShortDate(peakEnd)}; ${formatNumber(latest)} in the latest week.`
    },
    bar(weekEnd: string, n: number) {
      return `Week to ${formatShortDate(weekEnd)}: ${formatNumber(n)} new`
    },
    recent: "Last 14 days",
    earlier: "Earlier weeks",
    note: "Week ending on the date shown, by report date. Cases not assigned to a health zone are not included.",
  },

  provinces: {
    title: "DRC by province",
    province: "Province",
    zones: "Health zones",
    share: "Share of new cases",
    unlinked: "Not linked to a health zone",
    total: "DRC total",
    zoneCounts(active: number, watch: number, cleared: number) {
      return `${active} active, ${watch} watch, ${cleared} cleared`
    },
    zonesShort(active: number, watch: number, cleared: number) {
      if (active > 0) return `${active} active`
      if (watch > 0) return `${watch} watch`
      return `${cleared} cleared`
    },
    note: "One mark per health zone that has had a case: active, watch or cleared.",
  },

  zoneTable: {
    title: "Health zones",
    sortHint: "Most new cases first. Select a column heading to sort.",
    filters: "Filter health zones",
    search: "Search",
    searchPlaceholder: "Zone or province",
    status: "Status",
    all: "All",
    statusShort: { active: "Active", watch: "Watch", cleared: "Cleared", never: "No cases" } satisfies Record<ZoneStatus, string>,
    allProvinces: "All provinces",
    count(shown: number, total: number) {
      return `Showing ${shown} of ${total}`
    },
    clear: "Clear filters",
    noMatch: "No health zones match these filters.",
    zone: "Health zone",
    prev: "14 days before",
    trend: "Trend",
    weekly: "Weekly, 12 weeks",
    total: "All cases",
    showAll(n: number) {
      return `See all ${n} health zones`
    },
    showTop(n: number) {
      return `Show the top ${n}`
    },
    sparkLabel(values: number[]) {
      return `Weekly new cases, last ${values.length} weeks: ${values.join(", ")}`
    },
    note: "Weekly bars are scaled to each zone's own peak; the last two weeks are blue.",
  },

  // TODO_HEALTH_REVIEW: this guidance must be checked by a health authority before launch.
  guide: {
    title: "What should I do?",
    steps: [
      {
        title: "Know the signs",
        body: "Fever, tiredness, muscle pain, headache and sore throat. Later: vomiting, diarrhoea, rash and sometimes bleeding. Early signs can look like malaria or typhoid.",
      },
      {
        title: "If you feel sick, keep apart",
        body: "Separate yourself from other people, including your household.",
      },
      {
        title: "Call before you go",
        body: "Call your national health hotline for advice on where to get care.",
      },
      {
        title: "Avoid blood and body fluids",
        body: "Of anyone who is sick or has died from Ebola. Leave care and burials to trained teams.",
      },
    ],
    hotlinesTitle: "Health hotlines",
    // TODO_HEALTH_REVIEW: add each number from an official source.
    hotlines: [
      { country: "DRC", number: null },
      { country: "Uganda", number: null },
      { country: "Kenya", number: null },
    ] as { country: string; number: string | null }[],
    numberPending: "Number to be confirmed",
    source: "From WHO and CDC guidance. Not yet reviewed by a health authority.",
  },

  exposure: {
    title: "Exposure window",
    subtitle: "Work out which days matter.",
    mode: "Who is this for",
    contact: "I had contact",
    sick: "Someone is sick",
    contactDate: "Last day you were in contact with a sick person",
    onsetDate: "Day their symptoms started",
    prompt: "Pick a date to see the window.",
    future: "Pick a date that is not in the future.",
    watchUntil: "Watch for symptoms until",
    ended: "Your 21 days ended on",
    dayOf(day: number, left: number) {
      if (day === 0) return "The 21 days start tomorrow"
      return `Day ${day} of 21 · ${left} ${left === 1 ? "day" : "days"} to go`
    },
    sinceContact(days: number) {
      return `${days} days since that contact`
    },
    contactAdvice:
      "Take your temperature twice a day. If you get a fever or other signs, keep apart from others and call your hotline. A new contact starts the 21 days again.",
    endedAdvice:
      "21 days is the longest time between contact and the first symptoms. If you feel unwell, call your hotline anyway.",
    caughtBetween: "They most likely caught it between",
    passOnFrom(date: string) {
      return `They can pass it on from ${formatDate(date)}`
    },
    sickAdvice(onset: string) {
      return `People cannot pass on Ebola before symptoms start. Anyone in close contact with them since ${formatShortDate(onset)} should watch for symptoms for 21 days after their last contact.`
    },
    dayAxis(day: number, date: string) {
      return `Day ${day}, ${formatShortDate(date)}`
    },
    onsetAxis(date: string) {
      return `Symptoms, ${formatShortDate(date)}`
    },
    method:
      "Uses WHO's incubation period of 2 to 21 days. Method adapted from CDC's Ebola Exposure Window Calculator. Not medical advice.",
  },
}

export type Strings = typeof en
