"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import type { Context, CountrySummary, Zones } from "@/lib/schema"
import { en } from "@/lib/strings"

import { useIsDesktop } from "@/lib/use-media-query"

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
}: {
  zones: Zones
  context: Context
  countries: CountrySummary[]
  selectedZoneId: string | null
  onSelectZone: (id: string) => void
  onSelectCountry: (iso3: string) => void
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
    <div className="flex flex-col gap-4">
      <div className="relative h-[60svh] min-h-80 overflow-hidden rounded-2xl border bg-muted lg:h-[calc(100svh-12rem)] lg:min-h-[34rem]">
        {useMapbox ? (
          <MapboxMap
            {...shared}
            token={MAPBOX_TOKEN!}
            onFatalError={() => setMapboxRejected(true)}
          />
        ) : (
          <MaplibreMap {...shared} />
        )}
      </div>
      {!useMapbox && (
        <p className="text-sm text-muted-foreground">{en.map.noBasemap}</p>
      )}
      <MapLegend
        metric={metric}
        onMetricChange={setMetric}
        scale={scale}
        maxValue={maxValue}
      />
    </div>
  )
}
