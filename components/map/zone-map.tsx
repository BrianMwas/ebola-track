"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { Context, CountrySummary, Zones } from "@/lib/schema"
import { en } from "@/lib/strings"
import { useIsDesktop } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"

import { MapLegend } from "./map-legend"
import { MAX_CIRCLE_RADIUS, circleScale, type CircleMetric } from "./map-style"

function MapLoading() {
  return <div className="size-full animate-pulse bg-muted" aria-hidden />
}

// Each engine is its own chunk; only the one in use is downloaded.
const MapboxMap = dynamic(() => import("./engine-mapbox"), {
  ssr: false,
  loading: MapLoading,
})
const MaplibreMap = dynamic(() => import("./engine-maplibre"), {
  ssr: false,
  loading: MapLoading,
})

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || null

export function ZoneMap({
  zones,
  context,
  countries,
  selectedZoneId,
  onSelectZone,
  onSelectCountry,
  overlay,
}: {
  zones: Zones
  context: Context
  countries: CountrySummary[]
  selectedZoneId: string | null
  onSelectZone: (id: string) => void
  onSelectCountry: (iso3: string) => void
  /** Drawn over the left of the map (the selected zone on large screens). */
  overlay?: React.ReactNode
}) {
  const [metric, setMetric] = React.useState<CircleMetric>("new_14d")
  const [mapboxRejected, setMapboxRejected] = React.useState(false)
  const useMapbox = MAPBOX_TOKEN !== null && !mapboxRejected

  const maxValue = React.useMemo(
    () => Math.max(0, ...zones.features.map((f) => f.properties[metric])),
    [zones, metric]
  )
  const isDesktop = useIsDesktop()
  const scale = circleScale(
    maxValue,
    isDesktop ? MAX_CIRCLE_RADIUS.desktop : MAX_CIRCLE_RADIUS.mobile
  )

  const shared = {
    zones,
    context,
    countries,
    metric,
    circleScale: scale,
    selectedZoneId,
    onSelectZone,
    onSelectCountry,
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <ZoneSearch zones={zones} onSelectZone={onSelectZone} />
        <div
          role="group"
          aria-label={en.map.circleMetric}
          className="inline-flex overflow-hidden rounded-lg border border-control"
        >
          {(["new_14d", "confirmed_cases"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
              className={cn(
                "min-h-10 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                m === "confirmed_cases" && "border-l border-control",
                metric === m
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "bg-background font-medium text-foreground hover:bg-muted"
              )}
            >
              {m === "new_14d" ? en.map.circlesNew : en.map.circlesTotal}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-[60svh] min-h-96 overflow-hidden rounded-lg bg-[#d6e8f5] lg:aspect-[10/7] lg:h-auto lg:min-h-[34rem]">
        {useMapbox ? (
          <MapboxMap
            {...shared}
            token={MAPBOX_TOKEN!}
            onFatalError={() => setMapboxRejected(true)}
          />
        ) : (
          <MaplibreMap {...shared} />
        )}
        <MapLegend metric={metric} scale={scale} maxValue={maxValue} />
        {overlay}
      </div>
      {!useMapbox && <p className="text-[13px] text-muted-foreground">{en.map.noBasemap}</p>}
    </div>
  )
}

/** Type a zone name; picking one from the list selects it on the map. */
function ZoneSearch({
  zones,
  onSelectZone,
}: {
  zones: Zones
  onSelectZone: (id: string) => void
}) {
  const listId = React.useId()
  const byName = React.useMemo(
    () => new Map(zones.features.map((f) => [f.properties.nom.toLowerCase(), f.properties.id])),
    [zones]
  )
  const names = React.useMemo(
    () => zones.features.map((f) => f.properties.nom).sort((a, b) => a.localeCompare(b)),
    [zones]
  )
  const pick = (value: string) => {
    const id = byName.get(value.trim().toLowerCase())
    if (id) onSelectZone(id)
  }
  return (
    <label className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-input px-2.5 text-muted-foreground focus-within:ring-2 focus-within:ring-ring sm:w-60">
      <HugeiconsIcon icon={Search01Icon} size={18} aria-hidden />
      <span className="sr-only">{en.mapSection.search}</span>
      <input
        type="search"
        list={listId}
        placeholder={en.mapSection.search}
        onChange={(e) => pick(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return
          const q = e.currentTarget.value.trim().toLowerCase()
          const match = names.find((n) => n.toLowerCase().startsWith(q))
          if (q && match) pick(match)
        }}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none"
      />
      <datalist id={listId}>
        {names.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
    </label>
  )
}
