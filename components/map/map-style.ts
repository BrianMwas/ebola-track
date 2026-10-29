/**
 * Layer definitions shared by the Mapbox and MapLibre renderers. Plain style
 * spec objects, so either engine can draw them.
 *
 * Status colours: one calm indigo-violet family that deepens with severity
 * (deliberately not orange or red, so the map informs without alarming, and
 * not plain blue, so zones are not mistaken for lakes). Checked with the dataviz
 * palette validator (--ordinal, light surface #f4f2ee): monotone lightness,
 * visible step gaps, light end >= 2:1 against the surface.
 */
import type { ZoneStatus } from "@/lib/status"

export const STATUS_COLORS: Record<ZoneStatus, string> = {
  active: "#3f2f96",
  watch: "#7366c9",
  cleared: "#a7a1d8",
  never: "#f4f2ee",
}

export const SURFACE = "#f4f2ee"
export const WATER = "#dde5e8"
export const OUTLINE = "#8f877c"
export const INK = "#1f2328"
export const STALE_PATTERN_ID = "stale-hatch"

export const SOURCES = {
  zones: "zones",
  points: "zone-points",
  context: "context",
} as const

/** Largest circle radius in pixels; the scale is area-proportional (r ∝ √value). */
export const MAX_CIRCLE_RADIUS = { desktop: 24, mobile: 15 }

export type CircleMetric = "new_14d" | "confirmed_cases"

export function circleScale(maxValue: number, maxRadius: number): number {
  return maxValue > 0 ? maxRadius / Math.sqrt(maxValue) : 0
}

export function circleRadius(value: number, scale: number): number {
  return scale * Math.sqrt(value)
}

type LayerSpec = Record<string, unknown> & { id: string; type: string }

export function contextLayers(hasBasemap: boolean): LayerSpec[] {
  return [
    {
      id: "context-country-fill",
      type: "fill",
      source: SOURCES.context,
      filter: ["==", ["get", "kind"], "country"],
      paint: { "fill-color": SURFACE, "fill-opacity": hasBasemap ? 0 : 1 },
    },
    {
      id: "context-province-fill",
      type: "fill",
      source: SOURCES.context,
      filter: ["==", ["get", "kind"], "province"],
      paint: { "fill-color": SURFACE, "fill-opacity": hasBasemap ? 0.5 : 1 },
    },
    {
      id: "context-province-line",
      type: "line",
      source: SOURCES.context,
      filter: ["==", ["get", "kind"], "province"],
      paint: { "line-color": OUTLINE, "line-width": 0.6, "line-opacity": 0.7 },
    },
    {
      id: "context-country-line",
      type: "line",
      source: SOURCES.context,
      filter: ["==", ["get", "kind"], "country"],
      paint: { "line-color": "#5f574d", "line-width": 1.1 },
    },
  ]
}

export function zoneLayers(hasBasemap: boolean): LayerSpec[] {
  return [
    {
      id: "zones-fill",
      type: "fill",
      source: SOURCES.zones,
      paint: {
        "fill-color": [
          "match",
          ["get", "status"],
          "active",
          STATUS_COLORS.active,
          "watch",
          STATUS_COLORS.watch,
          "cleared",
          STATUS_COLORS.cleared,
          STATUS_COLORS.never,
        ],
        "fill-opacity": [
          "case",
          ["==", ["get", "status"], "never"],
          hasBasemap ? 0.35 : 1,
          0.9,
        ],
      },
    },
    {
      id: "zones-stale",
      type: "fill",
      source: SOURCES.zones,
      filter: ["==", ["get", "stale"], true],
      paint: { "fill-pattern": STALE_PATTERN_ID },
    },
    {
      id: "zones-line",
      type: "line",
      source: SOURCES.zones,
      paint: { "line-color": OUTLINE, "line-width": 0.4, "line-opacity": 0.8 },
    },
  ]
}

export function selectedZoneLayer(selectedId: string | null): LayerSpec {
  return {
    id: "zones-selected",
    type: "line",
    source: SOURCES.zones,
    filter: ["==", ["get", "id"], selectedId ?? ""],
    paint: { "line-color": INK, "line-width": 2.5 },
  }
}

export function circleLayer(metric: CircleMetric, scale: number): LayerSpec {
  return {
    id: "zone-circles",
    type: "circle",
    source: SOURCES.points,
    filter: [">", ["get", metric], 0],
    paint: {
      "circle-radius": ["*", scale, ["sqrt", ["get", metric]]],
      // White fill with an ink outline reads on both light and dark zone fills.
      "circle-color": "#ffffff",
      "circle-opacity": 0.45,
      "circle-stroke-color": INK,
      "circle-stroke-width": 1.5,
      "circle-stroke-opacity": 0.9,
    },
  }
}

/** Grey diagonal hatching for stale zones, as RGBA pixels for map.addImage. */
export function stalePattern(size = 8): {
  width: number
  height: number
  data: Uint8Array
} {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const on = (x + y) % size < 2
      const i = (y * size + x) * 4
      data[i] = 90
      data[i + 1] = 90
      data[i + 2] = 90
      data[i + 3] = on ? 220 : 0
    }
  }
  return { width: size, height: size, data }
}

/** Great Lakes and East Africa, wide enough for the affected zones in western DRC. */
export const INITIAL_BOUNDS: [[number, number], [number, number]] = [
  [18, -7],
  [41, 5.5],
]
