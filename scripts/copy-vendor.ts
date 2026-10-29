/**
 * Copy MapLibre's web worker into public/vendor/. MapLibre 6 looks for its
 * worker next to its own module (import.meta.url), which the Next bundle
 * does not provide; engine-maplibre.tsx points setWorkerUrl() here instead.
 * Runs before `dev` and `build`.
 */
import { copyFile, mkdir, readFile } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const pkg = JSON.parse(
  await readFile(path.join(root, "node_modules/maplibre-gl/package.json"), "utf8")
) as { version: string }
const dest = path.join(root, "public/vendor", `maplibre-gl-worker-${pkg.version}.mjs`)
await mkdir(path.dirname(dest), { recursive: true })
await copyFile(path.join(root, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"), dest)
console.log(`[copy-vendor] ${path.relative(root, dest)}`)
