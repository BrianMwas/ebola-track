import { en } from "@/lib/strings"

/** Required on every page (hard rule 2 of the brief). */
export function SiteBanner() {
  return (
    <div role="note" className="bg-foreground px-5 py-3 text-center text-sm leading-relaxed text-background">
      {en.banner}
    </div>
  )
}
