export type Plan = 'nano' | 'mini' | 'standard' | 'pro' | 'mega'
export type SubscriberStatus = 'active' | 'paused' | 'cancelled'

export interface Subscriber {
  id: string
  name: string
  email: string
  plan: Plan
  status: SubscriberStatus
  joined: string
  monthlySpend: number
  setsRented: number
}

export const subscribers: Subscriber[] = [
  { id: 'sub_001', name: 'Anna Kowalski', email: 'anna@example.com', plan: 'pro', status: 'active', joined: '2024-03-12', monthlySpend: 28, setsRented: 14 },
  { id: 'sub_002', name: 'Tomas Bauer', email: 'tomas@example.com', plan: 'standard', status: 'active', joined: '2024-04-01', monthlySpend: 19, setsRented: 11 },
  { id: 'sub_003', name: 'Lena Müller', email: 'lena@example.com', plan: 'mega', status: 'active', joined: '2024-05-18', monthlySpend: 49, setsRented: 9 },
  { id: 'sub_004', name: 'Jake Rivera', email: 'jake@example.com', plan: 'mini', status: 'paused', joined: '2024-07-22', monthlySpend: 12, setsRented: 6 },
  { id: 'sub_005', name: 'Sara Okonkwo', email: 'sara@example.com', plan: 'nano', status: 'active', joined: '2024-08-09', monthlySpend: 7, setsRented: 8 },
  { id: 'sub_006', name: 'Piotr Nowak', email: 'piotr@example.com', plan: 'standard', status: 'cancelled', joined: '2024-06-14', monthlySpend: 0, setsRented: 4 },
  { id: 'sub_007', name: 'Clara Dubois', email: 'clara@example.com', plan: 'pro', status: 'active', joined: '2024-09-30', monthlySpend: 28, setsRented: 7 },
  { id: 'sub_008', name: 'Miko Tanaka', email: 'miko@example.com', plan: 'mini', status: 'active', joined: '2025-01-05', monthlySpend: 12, setsRented: 5 },
  { id: 'sub_009', name: 'Ben Hartley', email: 'ben@example.com', plan: 'mega', status: 'active', joined: '2025-02-20', monthlySpend: 49, setsRented: 3 },
  { id: 'sub_010', name: 'Ines Santos', email: 'ines@example.com', plan: 'nano', status: 'paused', joined: '2025-03-11', monthlySpend: 0, setsRented: 2 },
]

export const planColors: Record<Plan, string> = {
  nano: 'bg-secondary text-secondary-foreground',
  mini: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  standard: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  pro: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  mega: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
}

export const subscriberStatusColors: Record<SubscriberStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  paused: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  cancelled: 'bg-muted text-muted-foreground',
}
