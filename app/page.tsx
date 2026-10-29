import { Badge } from "@/components/ui/badge"
import { Tracker } from "@/components/tracker"
import { en } from "@/lib/strings"

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-medium sm:text-3xl">{en.appName}</h1>
          <p className="text-base text-muted-foreground">{en.appTagline}</p>
        </div>
        <Badge variant="outline" className="px-2.5 py-1">
          {en.privatePreview}
        </Badge>
      </header>
      <Tracker />
    </main>
  )
}
