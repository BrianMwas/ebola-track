"use client"

import * as React from "react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { formatRelative } from "@/lib/format"
import type { CountrySummary, Latest } from "@/lib/schema"
import { en } from "@/lib/strings"
import { Disclosure } from "@/components/ui/disclosure"

/**
 * Sidebar card holding the footnotes the main column no longer shows: how
 * the counts work, what the map means, and where the data comes from.
 */
export function AboutData({ latest, drc }: { latest: Latest; drc: CountrySummary | undefined }) {
  // Rendered only on the client, after the snapshot has loaded.
  const [now] = React.useState(() => new Date())
  const z = drc?.zones

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="flex scroll-mt-4 flex-col gap-3 rounded-lg border p-5"
    >
      <h2 id="about-title" className="flex items-center gap-2 font-heading text-lg font-bold">
        <HugeiconsIcon icon={InformationCircleIcon} size={20} aria-hidden />
        {en.about.title}
      </h2>
      <p className="text-[15px] leading-relaxed">{en.about.undercount}</p>
      <div className="flex flex-col">
        <Disclosure summary={en.about.reporting}>
          <p>{en.weekly.reportDate}</p>
          <p>{en.weekly.note}</p>
          <p>{en.zoneTable.note}</p>
        </Disclosure>
        <Disclosure summary={en.about.mapColours}>
          <p>{en.map.legendExplain}</p>
          <p>{en.mapSection.note}</p>
          <p>{en.provinces.note}</p>
        </Disclosure>
        <Disclosure summary={en.about.otherCountries}>
          <p>{en.countries.note}</p>
          <p>{en.countries.detailHint}</p>
        </Disclosure>
        {z && z.unassigned_deaths > 0 && (
          <Disclosure summary={en.about.unlinkedDeaths}>
            <p>
              {en.drc.unassignedDeathsExplain(
                z.unassigned_deaths,
                z.zone_sum_deaths + z.unassigned_deaths,
                z.unassigned_as_of
              )}
            </p>
          </Disclosure>
        )}
        <Disclosure summary={en.about.sources}>
          <p>{en.footer}</p>
          <p>{en.about.release(latest.inrb_release_tag, formatRelative(latest.snapshot, now))}</p>
        </Disclosure>
      </div>
    </section>
  )
}
