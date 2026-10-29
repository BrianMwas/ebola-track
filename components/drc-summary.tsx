"use client"

import * as React from "react"

import { statusSquares } from "@/lib/chart-data"
import { formatNumber } from "@/lib/format"
import type { CountrySummary, Zones } from "@/lib/schema"
import { en } from "@/lib/strings"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusSquares } from "@/components/charts/status-squares"
import { UnassignedMeter } from "@/components/charts/unassigned-meter"

export function DrcSummary({
  drc,
  zones,
  selectedZoneId,
  onSelectZone,
}: {
  drc: CountrySummary
  zones: Zones
  selectedZoneId: string | null
  onSelectZone: (id: string) => void
}) {
  const squares = React.useMemo(() => statusSquares(zones), [zones])
  const z = drc.zones

  return (
    <Card className="gap-8">
      <CardHeader>
        <CardTitle>{en.drc.title}</CardTitle>
        <p className="text-base text-muted-foreground">{drc.situation}</p>
      </CardHeader>

      <dl className="flex flex-wrap gap-x-16 gap-y-6">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">{en.drc.confirmed}</dt>
          <dd className="font-heading text-4xl font-medium tabular-nums">
            {formatNumber(drc.confirmed_cases)}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">{en.drc.deaths}</dt>
          <dd className="font-heading text-4xl font-medium tabular-nums">
            {formatNumber(drc.confirmed_deaths)}
          </dd>
        </div>
      </dl>

      {z && (
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <StatusSquares squares={squares} selectedId={selectedZoneId} onSelect={onSelectZone} />
          <div className="flex flex-col gap-4">
            <p className="text-sm">{en.drc.unassignedCases(z.unassigned_cases)}</p>
            <UnassignedMeter
              unassigned={z.unassigned_deaths}
              total={z.zone_sum_deaths + z.unassigned_deaths}
              date={z.unassigned_as_of}
            />
          </div>
        </div>
      )}

      <CardFooter className="border-t pt-5">
        {en.country.asOf(drc.as_of)} · {en.country.source}:{" "}
        <a
          href={drc.source_url}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {drc.source_name}
        </a>
      </CardFooter>
    </Card>
  )
}
