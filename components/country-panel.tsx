import { formatNumber } from "@/lib/format"
import type { CountrySummary } from "@/lib/schema"
import { en } from "@/lib/strings"

/** Country detail for imported, medevac and "outbreak over" entries. */
export function CountryPanel({ country }: { country: CountrySummary }) {
  return (
    <article className="flex flex-col gap-7" aria-labelledby={`country-${country.iso3}`}>
      <header className="flex flex-col gap-3">
        <h2
          id={`country-${country.iso3}`}
          className="font-heading text-xl leading-tight font-medium"
        >
          {country.country}
        </h2>
        <p className="text-base leading-relaxed">{country.situation}</p>
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
        <div className="flex flex-col gap-0.5">
          <dt className="text-sm text-muted-foreground">{en.drc.confirmed}</dt>
          <dd className="text-lg font-medium tabular-nums">
            {formatNumber(country.confirmed_cases)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-sm text-muted-foreground">{en.drc.deaths}</dt>
          <dd className="text-lg font-medium tabular-nums">
            {formatNumber(country.confirmed_deaths)}
          </dd>
        </div>
      </dl>
      {country.map_placement === "map" && (
        <p className="text-sm text-muted-foreground">{en.map.countryLevel}</p>
      )}
      <footer className="flex flex-col gap-1 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
        <p>{en.country.asOf(country.as_of)}</p>
        <p>
          {en.country.source}:{" "}
          <a
            href={country.source_url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {country.source_name}
          </a>
        </p>
      </footer>
    </article>
  )
}
