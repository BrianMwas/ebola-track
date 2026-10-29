"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import { getVersion, setWorkerUrl } from "maplibre-gl"
import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl/maplibre"

import { MapScene, type MapEngine, type MapSceneProps } from "./map-scene"

// Served from public/vendor (scripts/copy-vendor.ts); the bundle cannot
// resolve MapLibre's own worker path.
setWorkerUrl(`/vendor/maplibre-gl-worker-${getVersion()}.mjs`)

const engine = { Map, Source, Layer, Marker, NavigationControl } as unknown as MapEngine

/**
 * Renderer used when no Mapbox token is set (or Mapbox rejects it):
 * MapLibre with no basemap, just a flat background, country outlines and
 * our own health-zone polygons. No third-party requests.
 */
export default function MaplibreMap(
  props: Omit<MapSceneProps, "engine" | "mapProps" | "hasBasemap">
) {
  return (
    <MapScene
      {...props}
      engine={engine}
      hasBasemap={false}
      mapProps={{
        attributionControl: {
          compact: true,
          customAttribution: "Health zones: GRID3 via INRB · Countries: Natural Earth",
        },
      }}
    />
  )
}
