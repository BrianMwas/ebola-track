"use client"

import * as React from "react"

import { formatNumber } from "@/lib/format"
import type { CountrySummary } from "@/lib/schema"
import { en } from "@/lib/strings"
import { useIsDesktop } from "@/lib/use-media-query"
import { useSnapshot, type Snapshot } from "@/lib/use-snapshot"
import { Card, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { CountryPanel } from "@/components/country-panel"
import { DrcSummary } from "@/components/drc-summary"
import { FreshnessLine } from "@/components/freshness-line"
import { ZoneMap } from "@/components/map/zone-map"
import { ZonePanel } from "@/components/zone-panel"

type Selection = { kind: "zone"; id: string } | { kind: "country"; iso3: string } | null

export function Tracker() {
  const snapshot = useSnapshot()

  if (snapshot.state === "loading") {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" aria-label={en.loading} />
  }
  if (snapshot.state === "error") {
    return (
      <Card role="alert">
        <CardTitle>{en.loadError}</CardTitle>
        <p className="text-muted-foreground">{snapshot.message}</p>
      </Card>
    )
  }
  return <TrackerView data={snapshot.data} />
}

function TrackerView({ data }: { data: Snapshot }) {
  const { latest, summary, zones, context } = data
  const [selection, setSelection] = React.useState<Selection>(null)
  const isDesktop = useIsDesktop()

  const drc = summary.countries.find((c) => c.iso3 === "COD")
  const inset = summary.countries.filter((c) => c.map_placement === "inset")
  const selectedZone =
    selection?.kind === "zone"
      ? zones.features.find((f) => f.properties.id === selection.id)?.properties
      : undefined
  const selectedCountry =
    selection?.kind === "country"
      ? summary.countries.find((c) => c.iso3 === selection.iso3)
      : undefined

  const selectZone = React.useCallback((id: string) => setSelection({ kind: "zone", id }), [])
  const selectCountry = React.useCallback(
    (iso3: string) => setSelection({ kind: "country", iso3 }),
    []
  )

  const detail = selectedZone ? (
    <ZonePanel zone={selectedZone} latest={latest} />
  ) : selectedCountry ? (
    <CountryPanel country={selectedCountry} />
  ) : null

  return (
    <div className="flex flex-col gap-12">
      {drc && (
        <DrcSummary
          drc={drc}
          zones={zones}
          selectedZoneId={selection?.kind === "zone" ? selection.id : null}
          onSelectZone={selectZone}
        />
      )}

      <section className="flex flex-col gap-6" aria-label={en.map.sectionLabel}>
        <FreshnessLine latest={latest} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <ZoneMap
            zones={zones}
            context={context}
            countries={summary.countries}
            selectedZoneId={selection?.kind === "zone" ? selection.id : null}
            onSelectZone={selectZone}
            onSelectCountry={selectCountry}
          />
          {isDesktop && (
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <Card className="max-h-[calc(100svh-3rem)] overflow-y-auto">
                {detail ?? (
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {en.selectPrompt}
                  </p>
                )}
              </Card>
            </aside>
          )}
        </div>
        <InsetCountries countries={inset} onSelect={selectCountry} />
      </section>

      {!isDesktop && (
        <Sheet
          open={detail !== null}
          onOpenChange={(open) => {
            if (!open) setSelection(null)
          }}
        >
          <SheetContent>
            <SheetTitle>
              {selectedZone?.nom ?? selectedCountry?.country}
            </SheetTitle>
            {detail}
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

function InsetCountries({
  countries,
  onSelect,
}: {
  countries: CountrySummary[]
  onSelect: (iso3: string) => void
}) {
  if (countries.length === 0) return null
  return (
    <Card>
      <CardTitle className="text-base">{en.map.insetTitle}</CardTitle>
      <ul className="grid gap-6 sm:grid-cols-3">
        {countries.map((c) => (
          <li key={c.iso3}>
            <button
              type="button"
              onClick={() => onSelect(c.iso3)}
              className="flex w-full items-start gap-3 rounded-lg p-2 text-left text-sm leading-relaxed outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden
                className="mt-1 size-3.5 shrink-0 rounded-full border-2 border-foreground"
              />
              <span>
                <span className="font-medium">{c.country}</span>{" "}
                <span className="tabular-nums">· {formatNumber(c.confirmed_cases)}</span>
                <br />
                <span className="text-muted-foreground">{c.marker_label}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
