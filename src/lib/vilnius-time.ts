// Release dates are scheduled and displayed in Vilnius time, so every visitor
// sees the same month the drop was planned for regardless of their own clock.
const TIME_ZONE = "Europe/Vilnius"

const LT_MONTHS = [
  "sausis",
  "vasaris",
  "kovas",
  "balandis",
  "gegužė",
  "birželis",
  "liepa",
  "rugpjūtis",
  "rugsėjis",
  "spalis",
  "lapkritis",
  "gruodis",
]

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

export interface VilniusParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export function getVilniusParts(date: Date): VilniusParts {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((p) => [p.type, p.value])
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  }
}

/** Month and year of a release, in Vilnius time — e.g. `2026 rugsėjis`. */
export function formatReleaseMonth(iso: string | null): string {
  if (!iso) return ""
  const { year, month } = getVilniusParts(new Date(iso))
  return `${year} ${LT_MONTHS[month - 1]}`
}

/** Same as `formatReleaseMonth`, month first — e.g. `rugsėjis 2026`. */
export function formatReleaseMonthFirst(iso: string | null): string {
  if (!iso) return ""
  const { year, month } = getVilniusParts(new Date(iso))
  return `${LT_MONTHS[month - 1]} ${year}`
}
