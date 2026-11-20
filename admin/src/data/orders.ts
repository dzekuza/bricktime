import type { ParcelSize } from "@/lib/lpexpress"

export type OrderStatus = 'requested' | 'active' | 'returned' | 'overdue' | 'processing' | 'return_requested' | 'return_declined'

export interface Order {
  id: string
  subscriberName: string
  subscriberId?: string
  subscriberEmail: string
  // Plan name of the customer, e.g. a Mystery Box plan.
  planName?: string
  productTitle: string
  // Null for a Mystery Box request that has no set yet.
  productId: number | null
  // Product's admin-set locker size; prefills the outbound parcel size.
  productShippingSize?: ParcelSize
  // Shared by the rentals created together from one set cart; null for single sets.
  cartId?: string | null
  status: OrderStatus
  startDate: string
  dueDate: string
  amount: number
  returnNote?: string
  // LP EXPRESS shipping
  homeDelivery?: boolean
  terminalName?: string | null
  // Snapshot taken when the order was placed; courier orders only.
  deliveryAddress?: string | null
  deliveryPhone?: string | null
  deliveryName?: string | null
  deliveryStreet?: string | null
  deliveryHouseNo?: string | null
  deliveryFlat?: string | null
  deliveryPostalCode?: string | null
  deliveryCity?: string | null
  barcode?: string | null // outbound
  // Null when the barcode was entered by hand (shipment made on the LP site), so no label PDF exists.
  parcelId?: string | null
  trackingState?: string | null
  returnBarcode?: string | null
  returnTrackingState?: string | null
}

export const orders: Order[] = [
  { id: 'ord_001', subscriberName: 'Anna Kowalski', subscriberEmail: 'anna@example.com', productTitle: 'Mailbox row', productId: 26, status: 'active', startDate: '2026-05-01', dueDate: '2026-06-01', amount: 28 },
  { id: 'ord_002', subscriberName: 'Lena Müller', subscriberEmail: 'lena@example.com', productTitle: 'Mailbox row', productId: 26, status: 'processing', startDate: '2026-05-03', dueDate: '2026-06-03', amount: 49 },
  { id: 'ord_003', subscriberName: 'Tomas Bauer', subscriberEmail: 'tomas@example.com', productTitle: 'The greenhouse', productId: 25, status: 'returned', startDate: '2026-04-01', dueDate: '2026-05-01', amount: 19 },
  { id: 'ord_004', subscriberName: 'Clara Dubois', subscriberEmail: 'clara@example.com', productTitle: 'Lander №7', productId: 22, status: 'active', startDate: '2026-04-15', dueDate: '2026-05-15', amount: 28 },
  { id: 'ord_005', subscriberName: 'Jake Rivera', subscriberEmail: 'jake@example.com', productTitle: 'Pocket sub', productId: 23, status: 'overdue', startDate: '2026-03-10', dueDate: '2026-04-10', amount: 12 },
  { id: 'ord_006', subscriberName: 'Miko Tanaka', subscriberEmail: 'miko@example.com', productTitle: 'Pocket sub', productId: 23, status: 'returned', startDate: '2026-03-20', dueDate: '2026-04-20', amount: 12 },
  { id: 'ord_007', subscriberName: 'Ben Hartley', subscriberEmail: 'ben@example.com', productTitle: 'The big wheel', productId: 20, status: 'returned', startDate: '2026-02-01', dueDate: '2026-03-01', amount: 49 },
  { id: 'ord_008', subscriberName: 'Sara Okonkwo', subscriberEmail: 'sara@example.com', productTitle: 'Field tractor', productId: 19, status: 'active', startDate: '2026-04-20', dueDate: '2026-05-20', amount: 7 },
]

export const orderStatusColors: Record<OrderStatus, string> = {
  requested: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  returned: 'bg-secondary text-secondary-foreground',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  return_requested: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  return_declined: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}
