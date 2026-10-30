/**
 * Site styling for the stock shadcn Table parts, passed as `className` so
 * components/ui/table.tsx stays as shipped. Ink rule under the header,
 * hairlines between rows, flush left and right edges.
 */

/** The table itself: body text size and tabular numbers. */
export const table = "text-[15px] tabular-nums"

/** The header row: a 2 px-strong ink rule instead of a hairline. */
export const headRow = "border-b-rule hover:bg-transparent"

/** Column headings. */
export const th = "h-auto px-3 py-2 align-bottom text-[13px] font-semibold text-ink-2 first:pl-0 last:pr-0"

/** Each row's first cell, as its header (`<TableHead scope="row">`). */
export const rowHead = "h-auto py-2.5 pr-3 pl-0 font-semibold"

/** Body cells. */
export const td = "px-3 py-2.5 first:pl-0 last:pr-0"
