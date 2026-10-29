"use client"

import "mapbox-gl/dist/mapbox-gl.css"

import Map, { Layer, Marker, NavigationControl, Source } from "react-map-gl/mapbox"

import { MapScene, type MapEngine, type MapSceneProps } from "./map-scene"

const engine = { Map, Source, Layer, Marker, NavigationControl } as unknown as MapEngine

const DEFAULT_STYLE = "mapbox://styles/mapbox/light-v11"

export default function MapboxMap(
  props: Omit<MapSceneProps, "engine" | "mapProps" | "hasBasemap"> & { token: string }
) {
  const { token, ...rest } = props
  return (
    <MapScene
      {...rest}
      engine={engine}
      hasBasemap
      mapProps={{
        mapboxAccessToken: token,
        mapStyle: process.env.NEXT_PUBLIC_MAPBOX_STYLE || DEFAULT_STYLE,
        // Opt out of Mapbox's optional performance telemetry. Map-load events
        // are still sent; the Mapbox terms of service require them.
        performanceMetricsCollection: false,
        projection: "mercator",
      }}
    />
  )
}
