// Omnisend API 2026-03-15. The old /v5 API is deprecated and shuts down on
// 2027-06-30; the version now travels in a header instead of the URL.
const OMNISEND_API_URL = "https://api.omnisend.com/api"
const OMNISEND_VERSION = "2026-03-15"

export function omnisendFetch(
  apiKey: string,
  path: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {}
): Promise<Response> {
  return fetch(`${OMNISEND_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Omnisend-API-Key ${apiKey}`,
      "Omnisend-Version": OMNISEND_VERSION,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
