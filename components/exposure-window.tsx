"use client"

import * as React from "react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { contactWindow, infectionWindow, INCUBATION_MAX_DAYS, INCUBATION_MIN_DAYS } from "@/lib/exposure"
import { formatDate, formatShortDate } from "@/lib/format"
import { addDays, localIsoDate } from "@/lib/status"
import { en } from "@/lib/strings"
import { InfoTip } from "@/components/ui/info-tip"
import { cn } from "@/lib/utils"
import { useToday } from "@/lib/use-today"
import { Calendar } from "@/components/calendar/calendar"

type Mode = "contact" | "sick"
type Result = {
  label: string
  value: string
  detail: string
  advice: string
  /** One cell per day; true = inside the window. */
  cells: ("in" | "out" | "onset")[]
  axis: [string, string]
}

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** A YYYY-MM-DD date as local midnight, for the calendar. */
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y!, m! - 1, d!)
}

function result(mode: Mode, date: string, today: string): Result | null {
  if (mode === "contact") {
    const w = contactWindow(date, today)
    if (!w) return null
    return {
      label: w.ended ? en.exposure.ended : en.exposure.watchUntil,
      value: formatDate(w.watchUntil),
      detail: w.ended ? en.exposure.sinceContact(w.day) : en.exposure.dayOf(w.day, w.daysLeft),
      advice: w.ended ? en.exposure.endedAdvice : en.exposure.contactAdvice,
      cells: Array.from({ length: INCUBATION_MAX_DAYS }, (_, i) => (i + 1 <= w.day ? "in" : "out")),
      axis: [en.exposure.dayAxis(1, addDays(date, 1)), en.exposure.dayAxis(INCUBATION_MAX_DAYS, w.watchUntil)],
    }
  }
  const w = infectionWindow(date, today)
  if (!w) return null
  return {
    label: en.exposure.caughtBetween,
    value: `${formatShortDate(w.earliest)} and ${formatDate(w.latest)}`,
    detail: en.exposure.passOnFrom(w.onset),
    advice: en.exposure.sickAdvice(w.onset),
    cells: Array.from({ length: INCUBATION_MAX_DAYS + 1 }, (_, i) => {
      const offset = i - INCUBATION_MAX_DAYS
      return offset === 0 ? "onset" : offset <= -INCUBATION_MIN_DAYS ? "in" : "out"
    }),
    axis: [formatShortDate(w.earliest), en.exposure.onsetAxis(w.onset)],
  }
}

/** Works out the 21-day watch after a contact, or when a sick person was likely infected. */
export function ExposureWindow() {
  const [mode, setMode] = React.useState<Mode>("contact")
  const [dates, setDates] = React.useState<Record<Mode, string>>({ contact: "", sick: "" })
  const labelId = React.useId()
  const todayDate = useToday()
  const today = localIsoDate(todayDate ?? new Date())
  const date = dates[mode]
  const picked = ISO.test(date) ? fromIso(date) : undefined
  const valid = ISO.test(date)
  const r = valid ? result(mode, date, today) : null

  return (
    <section
      id="exposure"
      className="flex scroll-mt-4 flex-col gap-3.5 rounded-lg border p-5"
      aria-labelledby="exposure-title"
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <h2
            id="exposure-title"
            className="flex items-center gap-2 font-heading text-[22px] leading-tight font-bold tracking-[-0.01em]"
          >
            <HugeiconsIcon icon={Calendar03Icon} size={22} className="text-link" aria-hidden />
            {en.exposure.title}
          </h2>
          <InfoTip label={en.help(en.exposure.title)}>
            <p>{en.exposure.method}</p>
          </InfoTip>
        </div>
        <p className="text-sm text-muted-foreground">{en.exposure.subtitle}</p>
      </div>

      <div role="group" aria-label={en.exposure.mode} className="grid grid-cols-2 overflow-hidden rounded-lg border border-control">
        {(["contact", "sick"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "min-h-11 px-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              m === "sick" && "border-l border-control",
              mode === m ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"
            )}
          >
            {m === "contact" ? en.exposure.contact : en.exposure.sick}
          </button>
        ))}
      </div>

      <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
        <p id={labelId} className="text-[15px] font-semibold">
          {mode === "contact" ? en.exposure.contactDate : en.exposure.onsetDate}
        </p>
        {/* One calendar per mode keeps each mode's month and selection. Future days are blocked. */}
        <Calendar
          key={mode}
          value={picked}
          onChange={(d) => setDates((all) => ({ ...all, [mode]: localIsoDate(d) }))}
          maxDate={todayDate}
          locale="en-GB"
          showToday
        />
      </div>

      <div aria-live="polite" className="flex flex-col gap-2.5">
        {!valid && <p className="text-[15px] text-ink-2">{en.exposure.prompt}</p>}
        {valid && !r && (
          <p className="rounded-lg bg-sun-soft px-3 py-2.5 text-[15px] text-sun-foreground">{en.exposure.future}</p>
        )}
        {r && (
          <div
            key={`${mode}-${date}`}
            className="flex flex-col gap-2.5 border-t-2 border-t-link pt-3 motion-safe:animate-fade-up"
          >
            <div className="flex flex-col">
              <span className="text-sm text-ink-2">{r.label}</span>
              <span className="font-heading text-[26px] leading-tight font-bold tracking-[-0.01em]">{r.value}</span>
              <span className="text-[15px] font-semibold text-link">{r.detail}</span>
            </div>
            <div aria-hidden className="flex gap-0.5">
              {r.cells.map((c, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-3 flex-1 motion-safe:animate-fade-in",
                    c === "in" ? "bg-chart-2" : c === "onset" ? "bg-foreground" : "bg-border"
                  )}
                  style={{ animationDelay: `${i * 18}ms` }}
                />
              ))}
            </div>
            <div aria-hidden className="flex justify-between text-xs text-muted-foreground">
              <span>{r.axis[0]}</span>
              <span>{r.axis[1]}</span>
            </div>
            <p className="text-[15px] leading-relaxed">{r.advice}</p>
          </div>
        )}
      </div>
    </section>
  )
}
