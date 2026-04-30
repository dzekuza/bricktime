// Auto-maintainable type file — regenerate with:
//   supabase gen types typescript --local > supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PlanTier = 'nano' | 'mini' | 'standard' | 'pro' | 'mega'
export type SubscriberStatus = 'active' | 'paused' | 'cancelled'
export type ProductStatus = 'available' | 'limited' | 'sold_out'
export type OrderStatus = 'processing' | 'active' | 'overdue' | 'returned'
export type AchievementCategory = 'activity' | 'social' | 'collector' | 'loyalty'
export type FeedEventType = 'checkin' | 'build_photo' | 'comment' | 'like' | 'achievement' | 'first_drop' | 'streak'

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: PlanTier
          price: number
          bg_color: string
          text_color: string
          level: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['plans']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['plans']['Insert']>
      }
      subscribers: {
        Row: {
          id: string
          name: string
          email: string
          plan: PlanTier
          status: SubscriberStatus
          avatar_id: number
          avatar_bg: string
          joined_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscribers']['Row'], 'joined_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscribers']['Insert']>
      }
      products: {
        Row: {
          id: number
          title: string
          subtitle: string
          description: string | null
          category: string
          year: number
          bricks: number
          minifigs: string
          tier: PlanTier
          status: ProductStatus
          image_url: string | null
          gallery: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          subscriber_id: string
          product_id: number
          status: OrderStatus
          start_date: string
          due_date: string
          amount: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      achievements: {
        Row: {
          id: string
          label: string
          description: string
          points: number
          category: AchievementCategory
          color: string
          icon: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }
      user_achievements: {
        Row: {
          subscriber_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'unlocked_at'>
        Update: never
      }
      feed_items: {
        Row: {
          id: string
          subscriber_id: string
          type: FeedEventType
          body: string | null
          image_url: string | null
          drop_num: number | null
          achievement_id: string | null
          like_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['feed_items']['Row'], 'id' | 'like_count' | 'created_at'>
        Update: Partial<Database['public']['Tables']['feed_items']['Insert']>
      }
      feed_likes: {
        Row: {
          feed_item_id: string
          subscriber_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['feed_likes']['Row'], 'created_at'>
        Update: never
      }
    }
    Views: {
      leaderboard: {
        Row: {
          subscriber_id: string
          name: string
          avatar_id: number
          avatar_bg: string
          tier: PlanTier
          achievement_count: number
          total_points: number
          drops_received: number
          rank: number
        }
      }
    }
    Enums: {
      plan_tier: PlanTier
      subscriber_status: SubscriberStatus
      product_status: ProductStatus
      order_status: OrderStatus
      achievement_category: AchievementCategory
      feed_event_type: FeedEventType
    }
  }
}
