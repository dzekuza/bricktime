// Frontend client for the `lpexpress` Supabase Edge Function.
import { supabase } from "./supabase"

export interface LpTerminal {
  id: string
  name: string
  address?: string
  city?: string
  postalCode?: string
  countryCode?: string
  comment?: string
  boxSize?: string
  latitude?: number
  longitude?: number
}

export interface LpTrackingEvent {
  publicEventType?: string
  publicStateType?: string
  publicStateText?: string
  date?: string
  location?: string
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("lpexpress", { body })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data as T
}

/** Search LP EXPRESS parcel terminals. `find` narrows by text (city / address). */
export async function fetchTerminals(find?: string, countryCode = "LT"): Promise<LpTerminal[]> {
  const { terminals } = await call<{ terminals: LpTerminal[] }>({
    action: "terminals",
    find: find || undefined,
    countryCode,
    size: 1000,
  })
  return terminals
}

/** Public tracking events for a barcode. */
export async function fetchTracking(barcode: string, lang = "lt"): Promise<LpTrackingEvent[]> {
  const { events } = await call<{ events: LpTrackingEvent[] }>({ action: "tracking", barcode, lang })
  return events
}

/** Create the outbound shipment/label for an order (owner only). */
export async function createLabel(input: {
  orderId: string
  receiver: { name: string; phone: string; email?: string; locality?: string; postalCode?: string; street?: string; building?: string; flat?: string }
  size?: string
  weight?: number
}): Promise<{ parcelId: string; barcode: string | null }> {
  return call({ action: "create-label", ...input })
}

/** Create a prepaid RETURN label (customer's terminal → BRICKTIME) and set the
 *  order to `return_requested` (owner only). */
export async function createReturnLabel(input: {
  orderId: string
  terminalId: string
  customer: { name: string; phone: string; email?: string }
  size?: string
}): Promise<{ parcelId: string; barcode: string | null }> {
  return call({ action: "create-return-label", ...input })
}

/** Fetch a label PDF for an order as base64 (owner only). `parcel` picks the
 *  outbound or return shipment. */
export async function fetchLabelPdf(orderId: string, parcel: "outbound" | "return" = "outbound"): Promise<string> {
  const { pdfBase64 } = await call<{ pdfBase64: string }>({ action: "label-pdf", orderId, parcel })
  return pdfBase64
}

/** Trigger a browser download of a base64 PDF. */
export function downloadPdf(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
