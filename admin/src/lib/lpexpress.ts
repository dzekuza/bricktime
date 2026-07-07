// Admin LP EXPRESS client — invokes the `lpexpress` edge function with the
// service-role client (supabaseAdmin), so the function's admin bypass grants
// access to ANY order for fulfillment (not just the owner's).
import { supabaseAdmin } from './supabase'

export interface LpTrackingEvent {
  publicEventType?: string
  publicStateType?: string
  publicStateText?: string
  date?: string
  location?: string
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabaseAdmin.functions.invoke('lpexpress', { body })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data as T
}

/** Generate the outbound shipment/label for an order (admin). Returns the barcode. */
export async function createLabel(input: {
  orderId: string
  receiver: { name: string; phone: string; email?: string }
  size?: string
  weight?: number
}): Promise<{ parcelId: string; barcode: string | null }> {
  return call({ action: 'create-label', ...input })
}

/** Public tracking events for a barcode. */
export async function fetchTracking(barcode: string, lang = 'lt'): Promise<LpTrackingEvent[]> {
  const { events } = await call<{ events: LpTrackingEvent[] }>({ action: 'tracking', barcode, lang })
  return events
}

/** Fetch a label PDF (outbound or return) as base64. */
export async function fetchLabelPdf(orderId: string, parcel: 'outbound' | 'return' = 'outbound'): Promise<string> {
  const { pdfBase64 } = await call<{ pdfBase64: string }>({ action: 'label-pdf', orderId, parcel })
  return pdfBase64
}

/** Cancel the outbound shipment for an order. */
export async function cancelShipment(orderId: string): Promise<void> {
  await call({ action: 'cancel', orderId })
}

/** Trigger a browser download of a base64 PDF. */
export function downloadPdf(base64: string, filename: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
