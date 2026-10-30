/**
 * Layer definitions shared by the Mapbox and MapLibre renderers. Plain style
 * spec objects, so either engine can draw them.
 *
 * Status colours: raspberry, amber and mint, read at a glance as "cases now",
 * "waiting" and "clear". Lightness falls steadily from no cases to active, so
 * the order holds in greyscale and for colour-blind readers. Not blue, so zones
 * are not mistaken for lakes, and never reused for anything but status.
 */
import type { ZoneStatus } from "@/lib/status"

export const STATUS_COLORS: Record<ZoneStatus, string> = {
  active: "#e0245e",
  watch: "#ff9f1c",
  cleared: "#86d9bd",
  never: "#eef2f7",
}

/** Status words in text: the fill colours darkened to 5.5:1 or better on white. */
export const STATUS_TEXT: Record<ZoneStatus, string> = {
  active: "#c41d52",
  watch: "#9a5800",
  cleared: "#137255",
  never: "#4b5768",
}

export const SURFACE = "#ffffff"
export const WATER = "#d6e8f5"
export const OUTLINE = "#9aa6b5"
export const INK = "#0b1b2e"
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
      paint: { "line-color": "#7d8a9c", "line-width": 1.2 },
    },
  ]
}

/** How long the map takes to colour in and grow its circles; 0 when motion is reduced. */
export type Reveal = { shown: boolean; duration: number }

export function zoneLayers(hasBasemap: boolean, reveal: Reveal): LayerSpec[] {
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
        "fill-opacity": reveal.shown
          ? ["case", ["==", ["get", "status"], "never"], hasBasemap ? 0.35 : 1, 0.9]
          : 0,
        "fill-opacity-transition": { duration: reveal.duration, delay: 0 },
      },
    },
    {
      id: "zones-stale",
      type: "fill",
      source: SOURCES.zones,
      filter: ["==", ["get", "stale"], true],
      paint: {
        "fill-pattern": STALE_PATTERN_ID,
        "fill-opacity": reveal.shown ? 1 : 0,
        "fill-opacity-transition": { duration: reveal.duration, delay: 0 },
      },
    },
    {
      id: "zones-line",
      type: "line",
      source: SOURCES.zones,
      // White edges keep neighbouring coloured zones apart; zones with no cases get a grey edge.
      paint: {
        "line-color": ["case", ["==", ["get", "status"], "never"], "#c3cdd9", "#ffffff"],
        "line-width": 0.6,
      },
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

export function circleLayer(metric: CircleMetric, scale: number, reveal: Reveal): LayerSpec {
  return {
    id: "zone-circles",
    type: "circle",
    source: SOURCES.points,
    filter: [">", ["get", metric], 0],
    paint: {
      // Circles grow in after the zones colour in, and resize smoothly when the metric changes.
      "circle-radius": reveal.shown ? ["*", scale, ["sqrt", ["get", metric]]] : 0,
      "circle-radius-transition": { duration: reveal.duration * 1.3, delay: reveal.shown ? reveal.duration / 2 : 0 },
      // White fill with an ink outline reads on both light and dark zone fills.
      "circle-color": "#ffffff",
      "circle-opacity": reveal.shown ? 0.45 : 0,
      "circle-stroke-color": INK,
      "circle-stroke-width": 1.5,
      // Hidden outlines too, or zero-radius circles would show as dots before the reveal.
      "circle-stroke-opacity": reveal.shown ? 0.9 : 0,
      "circle-opacity-transition": { duration: reveal.duration, delay: reveal.shown ? reveal.duration / 2 : 0 },
      "circle-stroke-opacity-transition": { duration: reveal.duration, delay: reveal.shown ? reveal.duration / 2 : 0 },
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
