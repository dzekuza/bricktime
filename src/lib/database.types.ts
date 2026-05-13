export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Convenience aliases
export type PlanTier = Database['public']['Enums']['plan_tier']
export type SubscriberStatus = Database['public']['Enums']['subscriber_status']
export type ProductStatus = Database['public']['Enums']['product_status']
export type OrderStatus = Database['public']['Enums']['order_status']
export type AchievementCategory = Database['public']['Enums']['achievement_category']
export type FeedEventType = Database['public']['Enums']['feed_event_type']

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      coupons: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          duration_months: number | null
          max_uses: number | null
          uses_count: number
          expires_at: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          duration_months?: number | null
          max_uses?: number | null
          uses_count?: number
          expires_at?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          duration_months?: number | null
          max_uses?: number | null
          uses_count?: number
          expires_at?: string | null
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: Database["public"]["Enums"]["achievement_category"]
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          label: string
          points: number
        }
        Insert: {
          category: Database["public"]["Enums"]["achievement_category"]
          color: string
          created_at?: string
          description: string
          icon: string
          id: string
          label: string
          points: number
        }
        Update: {
          category?: Database["public"]["Enums"]["achievement_category"]
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          label?: string
          points?: number
        }
        Relationships: []
      }
      feed_items: {
        Row: {
          achievement_id: string | null
          body: string | null
          created_at: string
          drop_num: number | null
          id: string
          image_url: string | null
          like_count: number
          parent_id: string | null
          subscriber_id: string
          type: Database["public"]["Enums"]["feed_event_type"]
        }
        Insert: {
          achievement_id?: string | null
          body?: string | null
          created_at?: string
          drop_num?: number | null
          id?: string
          image_url?: string | null
          like_count?: number
          parent_id?: string | null
          subscriber_id: string
          type: Database["public"]["Enums"]["feed_event_type"]
        }
        Update: {
          achievement_id?: string | null
          body?: string | null
          created_at?: string
          drop_num?: number | null
          id?: string
          image_url?: string | null
          like_count?: number
          parent_id?: string | null
          subscriber_id?: string
          type?: Database["public"]["Enums"]["feed_event_type"]
        }
        Relationships: []
      }
      feed_likes: {
        Row: {
          created_at: string
          feed_item_id: string
          subscriber_id: string
        }
        Insert: {
          created_at?: string
          feed_item_id: string
          subscriber_id: string
        }
        Update: {
          created_at?: string
          feed_item_id?: string
          subscriber_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          product_id: number
          return_note: string | null
          start_date: string
          status: Database["public"]["Enums"]["order_status"]
          subscriber_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          product_id: number
          return_note?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["order_status"]
          subscriber_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          product_id?: number
          return_note?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["order_status"]
          subscriber_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          bg_color: string
          created_at: string
          id: Database["public"]["Enums"]["plan_tier"]
          level: number
          price: number
          text_color: string
        }
        Insert: {
          bg_color: string
          created_at?: string
          id: Database["public"]["Enums"]["plan_tier"]
          level: number
          price: number
          text_color: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          id?: Database["public"]["Enums"]["plan_tier"]
          level?: number
          price?: number
          text_color?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          bg: string
          brick_colors: string[]
          brick_heights: number[]
          bricks: number
          build_time: string | null
          value: number | null
          category: string
          created_at: string
          description: string | null
          faq: { q: string; a: string }[] | null
          bags: { num: string; label: string; desc: string; bg: string }[]
          story: { headline: string; body: string[]; image_url: string | null; author_name: string; author_role: string } | null
          minifig: { name: string; description: string; image_url: string | null; edition: string; kit_headline: string; kit_items: { title: string; body: string }[] } | null
          compatibility: { drop: string; title: string; desc: string; bg: string }[]
          featured: boolean
          gallery: string[]
          id: number
          image_url: string | null
          is_new: boolean
          minifigs: string
          rating: string | null
          release_date: string | null
          status: Database["public"]["Enums"]["product_status"]
          subtitle: string
          tier: Database["public"]["Enums"]["plan_tier"]
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          bg?: string
          brick_colors?: string[]
          brick_heights?: number[]
          bricks: number
          build_time?: string | null
          value?: number | null
          category: string
          created_at?: string
          description?: string | null
          faq?: { q: string; a: string }[] | null
          bags?: { num: string; label: string; desc: string; bg: string }[]
          story?: { headline: string; body: string[]; image_url: string | null; author_name: string; author_role: string } | null
          minifig?: { name: string; description: string; image_url: string | null; edition: string; kit_headline: string; kit_items: { title: string; body: string }[] } | null
          compatibility?: { drop: string; title: string; desc: string; bg: string }[]
          featured?: boolean
          gallery?: string[]
          id: number
          image_url?: string | null
          is_new?: boolean
          minifigs?: string
          rating?: string | null
          release_date?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          subtitle?: string
          tier: Database["public"]["Enums"]["plan_tier"]
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          bg?: string
          brick_colors?: string[]
          brick_heights?: number[]
          bricks?: number
          category?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          build_time?: string | null
          value?: number | null
          faq?: { q: string; a: string }[] | null
          bags?: { num: string; label: string; desc: string; bg: string }[]
          story?: { headline: string; body: string[]; image_url: string | null; author_name: string; author_role: string } | null
          minifig?: { name: string; description: string; image_url: string | null; edition: string; kit_headline: string; kit_items: { title: string; body: string }[] } | null
          compatibility?: { drop: string; title: string; desc: string; bg: string }[]
          gallery?: string[]
          id?: number
          image_url?: string | null
          is_new?: boolean
          minifigs?: string
          rating?: string | null
          release_date?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          subtitle?: string
          tier?: Database["public"]["Enums"]["plan_tier"]
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          avatar_bg: string
          avatar_id: number
          email: string
          id: string
          joined_at: string
          name: string
          penalty_amount: number | null
          penalty_reason: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          status: Database["public"]["Enums"]["subscriber_status"]
          updated_at: string
        }
        Insert: {
          avatar_bg?: string
          avatar_id?: number
          email: string
          id: string
          joined_at?: string
          name: string
          penalty_amount?: number | null
          penalty_reason?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: Database["public"]["Enums"]["subscriber_status"]
          updated_at?: string
        }
        Update: {
          avatar_bg?: string
          avatar_id?: number
          email?: string
          id?: string
          joined_at?: string
          name?: string
          penalty_amount?: number | null
          penalty_reason?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: Database["public"]["Enums"]["subscriber_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          subscriber_id: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          subscriber_id: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          subscriber_id?: string
          unlocked_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      community_feed: {
        Row: {
          achievement_id: string | null
          avatar_bg: string | null
          avatar_id: number | null
          body: string | null
          created_at: string | null
          drop_num: number | null
          id: string | null
          image_url: string | null
          like_count: number | null
          parent_id: string | null
          plan: Database["public"]["Enums"]["plan_tier"] | null
          subscriber_id: string | null
          type: Database["public"]["Enums"]["feed_event_type"] | null
          user_name: string | null
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          achievement_count: number | null
          avatar_bg: string | null
          avatar_id: number | null
          drops_received: number | null
          name: string | null
          rank: number | null
          subscriber_id: string | null
          tier: Database["public"]["Enums"]["plan_tier"] | null
          total_points: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_bg: string | null
          avatar_id: number | null
          id: string | null
          name: string | null
        }
        Insert: {
          avatar_bg?: string | null
          avatar_id?: number | null
          id?: string | null
          name?: string | null
        }
        Update: {
          avatar_bg?: string | null
          avatar_id?: number | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
      user_profile_view: {
        Row: {
          avatar_bg: string | null
          avatar_id: number | null
          id: string | null
          joined_at: string | null
          likes_received: number | null
          name: string | null
          plan: Database["public"]["Enums"]["plan_tier"] | null
          post_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      toggle_like: {
        Args: {
          p_feed_item_id: string
          p_subscriber_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      achievement_category: "activity" | "social" | "collector" | "loyalty"
      feed_event_type:
        | "checkin"
        | "build_photo"
        | "comment"
        | "like"
        | "achievement"
        | "first_drop"
        | "streak"
      order_status: "processing" | "active" | "overdue" | "returned" | "return_requested" | "return_declined"
      plan_tier: "nano" | "mini" | "standard" | "pro" | "mega"
      product_status: "available" | "limited" | "sold_out"
      subscriber_status: "active" | "paused" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"]
> = DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type DbEnums<
  T extends keyof DefaultSchema["Enums"]
> = DefaultSchema["Enums"][T]
