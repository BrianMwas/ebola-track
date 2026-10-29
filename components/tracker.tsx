"use client"

import * as React from "react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { provinceRows, trackedZones, zonesByNewCases } from "@/lib/chart-data"
import { trendOf } from "@/lib/status"
import { en } from "@/lib/strings"
import { useIsDesktop } from "@/lib/use-media-query"
import { useSnapshot, type Snapshot } from "@/lib/use-snapshot"
import { Card, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { SectionTitle } from "@/components/ui/section-title"
import { CountryPanel } from "@/components/country-panel"
import { CountryTable } from "@/components/country-table"
import { ExposureWindow } from "@/components/exposure-window"
import { Guide } from "@/components/guide"
import { MobileTabs } from "@/components/mobile-tabs"
import { Overview } from "@/components/overview"
import { ProvinceTable } from "@/components/province-table"
import { WeeklyChart } from "@/components/weekly-chart"
import { ZoneMap } from "@/components/map/zone-map"
import { ZonePanel } from "@/components/zone-panel"
import { ZoneTable } from "@/components/zone-table"

type Selection = { kind: "zone"; id: string } | { kind: "country"; iso3: string } | null

export function Tracker() {
  const snapshot = useSnapshot()

  if (snapshot.state === "loading") {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
        <div className="h-96 animate-pulse rounded-lg bg-muted" aria-label={en.loading} />
      </div>
    )
  }
  if (snapshot.state === "error") {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
        <Card role="alert">
          <CardTitle>{en.loadError}</CardTitle>
          <p className="text-muted-foreground">{snapshot.message}</p>
        </Card>
      </div>
    )
  }
  return <TrackerView data={snapshot.data} />
}

function TrackerView({ data }: { data: Snapshot }) {
  const { latest, summary, zones, context, weekly } = data
  const [selection, setSelection] = React.useState<Selection>(null)
  const isDesktop = useIsDesktop()

  const drc = summary.countries.find((c) => c.iso3 === "COD")
  const provinces = React.useMemo(() => provinceRows(zones), [zones])
  const ranked = React.useMemo(() => zonesByNewCases(zones), [zones])
  const drcNew = React.useMemo(() => {
    const tracked = trackedZones(zones)
    const value = tracked.reduce((s, z) => s + z.new_14d, 0)
    const prev = tracked.reduce((s, z) => s + z.prev_14d, 0)
    return { value, trend: trendOf(value, prev) }
  }, [zones])

  const selectedZone =
    selection?.kind === "zone"
      ? zones.features.find((f) => f.properties.id === selection.id)?.properties
      : undefined
  const selectedCountry =
    selection?.kind === "country"
      ? summary.countries.find((c) => c.iso3 === selection.iso3)
      : undefined
  const selectedZoneId = selection?.kind === "zone" ? selection.id : null

  const selectZone = React.useCallback((id: string) => setSelection({ kind: "zone", id }), [])
  const selectCountry = React.useCallback(
    (iso3: string) => setSelection({ kind: "country", iso3 }),
    []
  )
  /** From a table: select, then bring the map (and its panel) into view on large screens. */
  const showOnMap = React.useCallback(
    (select: () => void) => {
      select()
      if (isDesktop) document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })
    },
    [isDesktop]
  )

  const detail = selectedZone ? (
    <ZonePanel zone={selectedZone} latest={latest} />
  ) : selectedCountry ? (
    <CountryPanel country={selectedCountry} />
  ) : null

  return (
    <>
      <div
        id="top"
        className="mx-auto flex max-w-[1400px] flex-wrap items-start gap-10 px-4 pt-8 pb-24 sm:px-8 lg:pb-16"
      >
        <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-11">
          <Overview latest={latest} summary={summary} zones={zones} />

          <CountryTable
            countries={summary.countries}
            drcNew={drc ? drcNew : null}
            onSelect={(iso3) => showOnMap(() => selectCountry(iso3))}
          />

          <section id="map" className="flex scroll-mt-4 flex-col gap-3" aria-labelledby="map-title">
            <div className="flex flex-col gap-0.5">
              <SectionTitle id="map-title">{en.mapSection.title}</SectionTitle>
              <p className="text-[15px] text-ink-2">{en.mapSection.subtitle}</p>
            </div>
            <ZoneMap
              zones={zones}
              context={context}
              countries={summary.countries}
              selectedZoneId={selectedZoneId}
              onSelectZone={selectZone}
              onSelectCountry={selectCountry}
              overlay={
                isDesktop && detail ? (
                  <aside className="absolute top-3 bottom-3 left-3 z-20 w-[300px] overflow-y-auto rounded border border-control bg-background p-4 xl:w-[330px] [&_header]:pr-10">
                    <button
                      type="button"
                      aria-label={en.zone.close}
                      onClick={() => setSelection(null)}
                      className="absolute top-2 right-2 flex size-10 items-center justify-center rounded text-ink-2 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden />
                    </button>
                    {detail}
                  </aside>
                ) : null
              }
            />
            <p className="text-[13px] text-muted-foreground">{en.mapSection.note}</p>
          </section>

          <WeeklyChart weekly={weekly} />

          {drc && <ProvinceTable rows={provinces} drc={drc} />}

          <ZoneTable
            zones={ranked}
            weekly={weekly}
            selectedId={selectedZoneId}
            onSelect={(id) => showOnMap(() => selectZone(id))}
          />
        </main>

        <aside
          aria-label={en.nav.whatToDo}
          className="flex min-w-0 flex-[1_1_320px] flex-col gap-6 lg:max-w-[380px]"
        >
          <Guide />
          <ExposureWindow />
        </aside>
      </div>

      <footer className="border-t">
        <p className="mx-auto max-w-[1400px] px-4 pt-6 pb-24 text-[13px] leading-relaxed text-muted-foreground sm:px-8 lg:pb-10">
          {en.footer}
        </p>
      </footer>

      <MobileTabs />

      {!isDesktop && (
        <Sheet
          open={detail !== null}
          onOpenChange={(open) => {
            if (!open) setSelection(null)
          }}
        >
          <SheetContent>
            <SheetTitle>{selectedZone?.nom ?? selectedCountry?.country}</SheetTitle>
            {detail}
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}
