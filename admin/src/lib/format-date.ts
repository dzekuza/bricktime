import { format, parseISO } from "date-fns"

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy")
}
