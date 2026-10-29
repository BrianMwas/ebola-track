import type { NextConfig } from "next"

// Static export: the site is plain files reading public/data/*.json.
const nextConfig: NextConfig = {
  output: "export",
}

export default nextConfig
