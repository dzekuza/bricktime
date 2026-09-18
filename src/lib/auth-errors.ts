// Supabase Auth (GoTrue) only returns English error messages — map the
// common ones to Lithuanian so users never see raw English in the UI.
const MESSAGE_MAP: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "Neteisingas el. paštas arba slaptažodis."],
  [
    /email not confirmed/i,
    "El. paštas dar nepatvirtintas. Patikrink pašto dėžutę ir paspausk patvirtinimo nuorodą.",
  ],
  [/user already registered/i, "Toks el. paštas jau užregistruotas."],
  [/password should be at least/i, "Slaptažodis turi būti bent 6 simbolių."],
  [/unable to validate email address/i, "Neteisingas el. pašto formatas."],
  [/email rate limit exceeded/i, "Per daug bandymų. Pabandyk vėliau."],
  [/for security purposes/i, "Palauk kelias sekundes ir bandyk dar kartą."],
  [/user not found/i, "Toks vartotojas nerastas."],
  [/network/i, "Nepavyko prisijungti prie serverio. Patikrink interneto ryšį."],
]

export function translateAuthError(message: string): string {
  const match = MESSAGE_MAP.find(([pattern]) => pattern.test(message))
  return match ? match[1] : "Įvyko klaida. Pabandyk dar kartą."
}
