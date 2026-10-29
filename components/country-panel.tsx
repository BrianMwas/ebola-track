import { formatNumber } from "@/lib/format"
import type { CountrySummary } from "@/lib/schema"
import { en } from "@/lib/strings"

/** Country detail for imported, medevac and "outbreak over" entries. */
export function CountryPanel({ country }: { country: CountrySummary }) {
  return (
    <article className="flex flex-col gap-4" aria-labelledby={`country-${country.iso3}`}>
      <header className="flex flex-col gap-2">
        <h2
          id={`country-${country.iso3}`}
          className="font-heading text-2xl leading-tight font-bold tracking-[-0.02em]"
        >
          {country.country}
        </h2>
        <p className="text-[15px] leading-relaxed">{country.situation}</p>
      </header>
      <dl className="grid grid-cols-2 border-y">
        <div className="flex flex-col py-2 pr-2">
          <dt className="text-[13px] text-muted-foreground">{en.drc.confirmed}</dt>
          <dd className="text-xl font-bold">
            {formatNumber(country.confirmed_cases)}
          </dd>
        </div>
        <div className="flex flex-col border-l py-2 pl-2.5">
          <dt className="text-[13px] text-muted-foreground">{en.drc.deaths}</dt>
          <dd className="text-xl font-bold">
            {formatNumber(country.confirmed_deaths)}
          </dd>
        </div>
      </dl>
      {country.map_placement === "map" && (
        <p className="text-sm text-muted-foreground">{en.map.countryLevel}</p>
      )}
      <footer className="flex flex-col gap-0.5 border-t pt-3 text-[13px] leading-relaxed text-muted-foreground">
        <p>{en.country.asOf(country.as_of)}</p>
        <p>
          {en.country.source}:{" "}
          <a
            href={country.source_url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold"
          >
            {country.source_name}
          </a>
        </p>
      </footer>
    </article>
  )
}
