"use client"

import * as React from "react"

import type { CountrySummary, Zones, Context } from "@/lib/schema"
import { formatNumber } from "@/lib/format"
import { en } from "@/lib/strings"
import { cn } from "@/lib/utils"

import {
  INITIAL_BOUNDS,
  SOURCES,
  STALE_PATTERN_ID,
  WATER,
  circleLayer,
  contextLayers,
  selectedZoneLayer,
  stalePattern,
  zoneLayers,
  type CircleMetric,
} from "./map-style"

/** The parts of react-map-gl both engines provide with the same props. */
export type MapEngine = {
  Map: React.ComponentType<Record<string, unknown>>
  Source: React.ComponentType<Record<string, unknown>>
  Layer: React.ComponentType<Record<string, unknown>>
  Marker: React.ComponentType<Record<string, unknown>>
  NavigationControl: React.ComponentType<Record<string, unknown>>
}

type MapInstance = {
  hasImage(id: string): boolean
  addImage(
    id: string,
    image: { width: number; height: number; data: Uint8Array }
  ): void
  getStyle(): { layers?: { id: string; type: string }[] } | undefined
}

type MapEvent = {
  target: MapInstance
  point: { x: number; y: number }
  features?: { properties: Record<string, unknown> | null }[]
  error?: { message?: string }
}

export type MapSceneProps = {
  engine: MapEngine
  /** Extra props for the engine's <Map>, e.g. the Mapbox token and style. */
  mapProps: Record<string, unknown>
  hasBasemap: boolean
  zones: Zones
  context: Context
  countries: CountrySummary[]
  metric: CircleMetric
  circleScale: number
  selectedZoneId: string | null
  onSelectZone: (id: string) => void
  onSelectCountry: (iso3: string) => void
  /** The engine could not start (e.g. Mapbox rejected the token or is unreachable). */
  onFatalError?: () => void
}

const FRAME_CENTER_LON = (INITIAL_BOUNDS[0][0] + INITIAL_BOUNDS[1][0]) / 2

function labelOnLeft(lon: number) {
  return lon > FRAME_CENTER_LON + 5
}

type Hover = {
  x: number
  y: number
  nom: string
  status: string
  newCases: number
  stale: boolean
}

export function MapScene({
  engine,
  mapProps,
  hasBasemap,
  zones,
  context,
  countries,
  metric,
  circleScale,
  selectedZoneId,
  onSelectZone,
  onSelectCountry,
  onFatalError,
}: MapSceneProps) {
  const { Map, Source, Layer, Marker, NavigationControl } = engine
  const [beforeId, setBeforeId] = React.useState<string | undefined>()
  const [ready, setReady] = React.useState(false)
  const [hover, setHover] = React.useState<Hover | null>(null)
  const loadedRef = React.useRef(false)

  const points = React.useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: zones.features.map((f) => ({
        type: "Feature" as const,
        properties: {
          id: f.properties.id,
          new_14d: f.properties.new_14d,
          confirmed_cases: f.properties.confirmed_cases,
        },
        geometry: { type: "Point" as const, coordinates: f.properties.label_point },
      })),
    }),
    [zones]
  )

  const onLoad = React.useCallback(
    (e: MapEvent) => {
      const map = e.target
      if (!map.hasImage(STALE_PATTERN_ID)) {
        map.addImage(STALE_PATTERN_ID, stalePattern())
      }
      // Keep basemap labels above our fills.
      const firstSymbol = map.getStyle()?.layers?.find((l) => l.type === "symbol")
      setBeforeId(firstSymbol?.id)
      loadedRef.current = true
      setReady(true)
    },
    []
  )

  const onMouseMove = React.useCallback((e: MapEvent) => {
    const p = e.features?.[0]?.properties
    if (!p) {
      setHover(null)
      return
    }
    setHover({
      x: e.point.x,
      y: e.point.y,
      nom: String(p.nom),
      status: String(p.status),
      newCases: Number(p.new_14d),
      stale: p.stale === true,
    })
  }, [])

  const onClick = React.useCallback(
    (e: MapEvent) => {
      const id = e.features?.[0]?.properties?.id
      if (typeof id === "string") onSelectZone(id)
    },
    [onSelectZone]
  )

  const onError = React.useCallback(
    (e: MapEvent) => {
      const message = e.error?.message ?? ""
      if (!loadedRef.current || /access token/i.test(message)) onFatalError?.()
      else console.warn("Map error:", message)
    },
    [onFatalError]
  )

  const fallbackStyle = React.useMemo(
    () => ({
      version: 8,
      sources: {},
      layers: [
        { id: "background", type: "background", paint: { "background-color": WATER } },
      ],
    }),
    []
  )

  return (
    <div className="relative size-full" aria-label={en.map.label} role="region">
      <Map
        initialViewState={{ bounds: INITIAL_BOUNDS, fitBoundsOptions: { padding: 8 } }}
        mapStyle={hasBasemap ? undefined : fallbackStyle}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={["zones-fill"]}
        onLoad={onLoad}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
        onClick={onClick}
        onError={onError}
        cursor={hover ? "pointer" : "grab"}
        dragRotate={false}
        touchPitch={false}
        minZoom={3}
        maxZoom={10}
        {...mapProps}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {ready && (
          <>
            <Source id={SOURCES.context} type="geojson" data={context}>
              {contextLayers(hasBasemap).map((l) => (
                <Layer key={l.id} {...l} beforeId={beforeId} />
              ))}
            </Source>
            <Source id={SOURCES.zones} type="geojson" data={zones}>
              {zoneLayers(hasBasemap).map((l) => (
                <Layer key={l.id} {...l} beforeId={beforeId} />
              ))}
              <Layer {...selectedZoneLayer(selectedZoneId)} />
            </Source>
            <Source id={SOURCES.points} type="geojson" data={points}>
              <Layer {...circleLayer(metric, circleScale)} />
            </Source>
          </>
        )}
        {countries
          .filter((c) => c.map_placement === "map" && c.marker_point)
          .map((c) => (
            <Marker
              key={c.iso3}
              longitude={c.marker_point![0]}
              latitude={c.marker_point![1]}
              // Labels sit on the side facing the middle of the frame so they stay on screen.
              anchor={labelOnLeft(c.marker_point![0]) ? "right" : "left"}
            >
              <button
                type="button"
                onClick={() => onSelectCountry(c.iso3)}
                className={cn(
                  "flex items-center gap-1.5 rounded border border-[#c9d1db] bg-white py-0.5 text-xs leading-tight text-[#0b1b2e] focus-visible:ring-2 focus-visible:ring-[#1a56f0] focus-visible:outline-none",
                  labelOnLeft(c.marker_point![0])
                    ? "flex-row-reverse pr-0.5 pl-2 text-right"
                    : "pr-2 pl-0.5 text-left"
                )}
                aria-label={`${c.country}: ${c.marker_label}. ${en.map.countryLevel}`}
                title={en.map.countryLevel}
              >
                <span
                  aria-hidden
                  className={
                    c.classification === "outbreak_over"
                      ? "size-3 rounded-full border-2 border-dashed border-[#5f6b7a]"
                      : "size-3 rounded-full border-2 border-[#0b1b2e]"
                  }
                />
                <span>
                  <span className="font-medium">{c.country}</span>
                  <span className="hidden sm:inline">
                    <br />
                    {c.marker_label}
                  </span>
                </span>
              </button>
            </Marker>
          ))}
      </Map>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-56 rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md ring-1 ring-foreground/10"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
          role="status"
        >
          <div className="font-medium">{hover.nom}</div>
          <div>{en.status[hover.status as keyof typeof en.status] ?? hover.status}</div>
          <div className="text-muted-foreground">
            {en.map.hoverNew(formatNumber(hover.newCases))}
          </div>
          {hover.stale && <div className="text-muted-foreground">{en.stale}</div>}
        </div>
      )}
    </div>
  )
}
