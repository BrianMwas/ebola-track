import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { en } from "@/lib/strings"

export const dynamic = "force-static"
export const alt = `${en.appName}: ${en.appTagline}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage() {
  // Same mark as the favicon.
  const icon = await readFile(join(process.cwd(), "app/icon.svg"), "base64")
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#1A56F0",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <img width={128} height={128} src={`data:image/svg+xml;base64,${icon}`} alt="" />
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 48, lineHeight: 1.1 }}>{en.appName}</div>
        <div style={{ fontSize: 40, marginTop: 20, opacity: 0.85 }}>{en.appTagline}</div>
      </div>
    ),
    size,
  )
}
