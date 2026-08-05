import { useSubscriptionsContext } from "@/contexts/SubscriptionsContext"

export interface DbSubscription {
  id: string
  name: string
  tagline: string | null
  price: number
  annual_price: number | null
  credits: number
  perks: Array<{ label: string; included: boolean }>
  comparison_data: Record<string, string> | null
  featured: boolean
  active: boolean
  sort_order: number
  bg_color: string
  text_color: string
  accent_color: string
  cta_bg: string
  cta_text: string
  brick_image: string | null
  cta_label: string | null
}

export function useSubscriptions() {
  return useSubscriptionsContext()
}
