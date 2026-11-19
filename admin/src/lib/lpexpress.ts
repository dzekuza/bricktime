// Admin LP EXPRESS client — invokes the `lpexpress` edge function with the
// service-role client (supabase), so the function's admin bypass grants
// access to ANY order for fulfillment (not just the owner's).
import { supabase } from './supabase'
import type { Order } from '@/data/orders'

export interface LpTrackingEvent {
  publicEventType?: string
  publicStateType?: string
  publicStateText?: string
  date?: string
  location?: string
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('lpexpress', { body })
  if (error) {
    // The generic "non-2xx" message hides the function's own JSON error body.
    const res = (error as { context?: Response }).context
    const detail: unknown = await res?.json?.().catch(() => null)
    throw new Error(
      detail && typeof detail === 'object' && 'error' in detail ? String(detail.error) : error.message,
    )
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

/** Generate the outbound shipment/label for an order (admin). Returns the barcode. */
export const PARCEL_SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const
export type ParcelSize = (typeof PARCEL_SIZES)[number]

/** Courier weight in whole grams, or undefined when the field is not a valid 0.1–30 kg value. */
export function toWeightGrams(weightKg: string): number | undefined {
  const kg = Number(weightKg)
  if (!Number.isFinite(kg) || kg < 0.1 || kg > 30) return undefined
  return Math.round(kg * 1000)
}

export interface CourierAddress {
  street: string
  building: string
  flat: string
  postalCode: string
  locality: string
}

export const EMPTY_COURIER_ADDRESS: CourierAddress = {
  street: '',
  building: '',
  flat: '',
  postalCode: '',
  locality: '',
}

/** The address fields LP needs, or an error message when one is missing. */
export function validateCourierAddress(a: CourierAddress): string | null {
  if (!a.street.trim() || !a.building.trim() || !a.postalCode.trim() || !a.locality.trim())
    return 'Enter street, house number, postal code and city'
  return null
}

export function trimCourierAddress(a: CourierAddress): CourierAddress {
  return {
    street: a.street.trim(),
    building: a.building.trim(),
    flat: a.flat.trim(),
    postalCode: a.postalCode.trim(),
    locality: a.locality.trim(),
  }
}

/** Local order fields that change once a locker order is sent to a door. */
export function courierOrderPatch(a: CourierAddress): Partial<Order> {
  const t = trimCourierAddress(a)
  return {
    homeDelivery: true,
    deliveryStreet: t.street,
    deliveryHouseNo: t.building,
    deliveryFlat: t.flat || null,
    deliveryPostalCode: t.postalCode,
    deliveryCity: t.locality,
    deliveryAddress: [
      [t.street, t.building].filter(Boolean).join(' ') + (t.flat ? `-${t.flat}` : ''),
      [t.postalCode, t.locality].filter(Boolean).join(' '),
    ].join(', '),
  }
}

/** `orderIds` ships several of one customer's sets in a single parcel. */
export async function createLabel(input: {
  orderId: string
  orderIds?: string[]
  receiver: { name: string; phone: string; email?: string } & Partial<CourierAddress>
  /** Send a locker order to the customer's door instead (admin only). */
  deliveryMethod?: 'courier'
  size?: ParcelSize
  weight?: number
  /** Locker orders: LP courier collects from us (H2T) instead of us dropping at a locker (T2T). */
  courierPickup?: boolean
}): Promise<{ parcelId: string; barcode: string | null }> {
  return call({ action: 'create-label', ...input })
}

/** Record the barcode of a shipment created on the LP Express site (no label stored here). */
export async function setTrackingCode(orderIds: string[], barcode: string): Promise<string> {
  const res = await call<{ barcode: string }>({ action: 'set-tracking', orderIds, barcode })
  return res.barcode
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
