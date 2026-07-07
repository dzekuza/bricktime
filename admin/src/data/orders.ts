export type OrderStatus = 'active' | 'returned' | 'overdue' | 'processing' | 'return_requested' | 'return_declined'

export interface Order {
  id: string
  subscriberName: string
  subscriberEmail: string
  productTitle: string
  productId: number
  status: OrderStatus
  startDate: string
  dueDate: string
  amount: number
  returnNote?: string
  // LP EXPRESS shipping
  homeDelivery?: boolean
  terminalName?: string | null
  barcode?: string | null // outbound
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
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  returned: 'bg-secondary text-secondary-foreground',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  return_requested: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  return_declined: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}
