import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Tracker } from "@/components/tracker"

export default function Page() {
  return (
    <>
      <SiteHeader />
      <Tracker />
      <SiteFooter />
    </>
  )
}
