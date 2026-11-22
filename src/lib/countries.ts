export const COUNTRIES = [
  { code: "LT", name: "Lietuva" },
  { code: "LV", name: "Latvija" },
  { code: "EE", name: "Estija" },
] as const

export type CountryCode = (typeof COUNTRIES)[number]["code"]

export const DEFAULT_COUNTRY: CountryCode = "LT"

export function toCountryCode(value: string | null | undefined): CountryCode {
  return COUNTRIES.find((c) => c.code === value)?.code ?? DEFAULT_COUNTRY
}
