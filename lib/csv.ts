/**
 * Minimal RFC 4180 CSV parser. Handles a leading UTF-8 BOM, CRLF or LF line
 * endings, quoted fields with embedded commas, quotes ("") and newlines.
 * Blank lines are dropped. Returns rows of raw strings with their 1-based
 * line number so anomalies can be reported against the source file.
 */
export type CsvRow = { line: number; cells: string[] }

export function parseCsv(text: string): CsvRow[] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows: CsvRow[] = []
  let cells: string[] = []
  let field = ""
  let inQuotes = false
  let line = 1
  let rowLine = 1

  const endRow = () => {
    cells.push(field)
    field = ""
    if (!(cells.length === 1 && cells[0] === "")) {
      rows.push({ line: rowLine, cells })
    }
    cells = []
  }

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        if (ch === "\n") line++
        field += ch
      }
      continue
    }
    if (ch === '"' && field === "") {
      inQuotes = true
    } else if (ch === ",") {
      cells.push(field)
      field = ""
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && src[i + 1] === "\n") i++
      endRow()
      line++
      rowLine = line
    } else {
      field += ch
    }
  }
  if (inQuotes) throw new Error(`CSV: unterminated quoted field at line ${rowLine}`)
  if (field !== "" || cells.length > 0) endRow()
  return rows
}
