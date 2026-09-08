// Release dates are scheduled in Vilnius time, so a drop set for 21:00 goes
// live at 21:00 in Lithuania no matter where the admin editing it happens to
// be. Values are still stored as UTC instants; only the wall clock the admin
// types is interpreted here.
const TIME_ZONE = "Europe/Vilnius"

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

export interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function partsAt(timestamp: number) {
  const parts = Object.fromEntries(
    partsFormatter
      .formatToParts(new Date(timestamp))
      .map((p) => [p.type, p.value])
  )
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

/** How far Vilnius is ahead of UTC at a given instant (+2h or +3h in DST). */
function offsetAt(timestamp: number): number {
  const p = partsAt(timestamp)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - timestamp
}

/** The Vilnius wall clock at a stored instant. */
export function toZonedParts(iso: string): ZonedParts {
  const { year, month, day, hour, minute } = partsAt(new Date(iso).getTime())
  return { year, month, day, hour, minute }
}

/**
 * The instant a Vilnius wall clock refers to, as an ISO string. The offset is
 * resolved twice because the first guess uses the offset in force at the UTC
 * reading of the same clock, which differs across a DST switch.
 */
export function fromZonedParts({
  year,
  month,
  day,
  hour,
  minute,
}: ZonedParts): string {
  const guess = Date.UTC(year, month - 1, day, hour, minute)
  const firstPass = guess - offsetAt(guess)
  return new Date(guess - offsetAt(firstPass)).toISOString()
}

const displayFormatter = new Intl.DateTimeFormat("lt-LT", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

export function formatZoned(iso: string): string {
  return displayFormatter.format(new Date(iso))
}
