export type Tier = "nano" | "mini" | "standard" | "pro" | "mega"
export type ProductStatus = "available" | "sold_out" | "limited"

export interface FaqItem {
  q: string
  a: string
}
export interface BagItem {
  num: string
  label: string
  desc: string
  bg: string
}
export interface KitItem {
  title: string
  body: string
}
export interface StorySection {
  headline: string
  body: string[]
  image_url: string | null
  author_name: string
  author_role: string
}
export interface MinifigSection {
  name: string
  description: string
  image_url: string | null
  edition: string
  kit_headline: string
  kit_items: KitItem[]
}
export interface CompatItem {
  drop: string
  title: string
  desc: string
  bg: string
}

export interface Product {
  id: number
  title: string
  subtitle: string
  description?: string
  category: string
  year: number
  bricks: number
  minifigs: string
  build_time?: string
  value?: number
  price?: number | null
  min_age?: number | null
  stock?: number
  rating?: string
  tier: Tier
  status: ProductStatus
  image_url?: string | null
  gallery?: string[]
  faq?: FaqItem[]
  bags?: BagItem[]
  story?: StorySection | null
  minifig?: MinifigSection | null
  compatibility?: CompatItem[]
  release_date?: string | null
  early_access_tiers?: string[]
  early_access_hours?: number
  isDangerous?: boolean
}

export const products: Product[] = []

export const tierColors: Record<Tier, string> = {
  nano: "bg-secondary text-secondary-foreground",
  mini: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  standard:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  pro: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  mega: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
}

// Client-approved tier rename (Nano/Mini/Standard/Pro -> LT names). "Mega"
// wasn't part of the approved list, kept as a neutral placeholder since
// "Legenda" is now used by "pro" — flag for client confirmation.
export const tierLabels: Record<Tier, string> = {
  nano: "Mėgėjas",
  mini: "Kūrėjas",
  standard: "Meistras",
  pro: "Pro",
  mega: "Legenda",
}

export const statusColors: Record<ProductStatus, string> = {
  available:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  sold_out: "bg-muted text-muted-foreground",
  limited:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
}
