import type { CountryCode } from "@/lib/countries"

export interface AddressSuggestion {
  label: string
  street: string
  house_no: string
  city: string
  postal_code: string
}

interface GeoapifyResult {
  formatted?: string
  street?: string
  housenumber?: string
  city?: string
  town?: string
  village?: string
  postcode?: string
}

const API_KEY = import.meta.env.VITE_GEOAPIFY_KEY as string | undefined

export const isAddressSearchEnabled = Boolean(API_KEY)

/** Address suggestions for a partial street query, limited to one country. */
export async function searchAddresses(
  text: string,
  country: CountryCode,
  signal: AbortSignal
): Promise<AddressSuggestion[]> {
  if (!API_KEY) return []

  const params = new URLSearchParams({
    text,
    format: "json",
    lang: "lt",
    limit: "5",
    filter: `countrycode:${country.toLowerCase()}`,
    apiKey: API_KEY,
  })
  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?${params}`,
    { signal }
  )
  if (!res.ok) throw new Error(`Address search failed: ${res.status}`)

  const json: { results?: GeoapifyResult[] } = await res.json()
  return (json.results ?? [])
    .filter((r) => r.street)
    .map((r) => ({
      label: r.formatted ?? r.street ?? "",
      street: r.street ?? "",
      house_no: r.housenumber ?? "",
      city: r.city ?? r.town ?? r.village ?? "",
      postal_code: r.postcode ?? "",
    }))
}
