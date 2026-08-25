export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: Database["public"]["Enums"]["achievement_category"]
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          label: string
          metric: string | null
          points: number
          threshold: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["achievement_category"]
          color: string
          created_at?: string
          description: string
          icon: string
          id: string
          label: string
          metric?: string | null
          points: number
          threshold?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["achievement_category"]
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          label?: string
          metric?: string | null
          points?: number
          threshold?: number | null
        }
        Relationships: []
      }
      challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          reward_granted: boolean
          subscriber_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          reward_granted?: boolean
          subscriber_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          reward_granted?: boolean
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "challenge_completions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "user_profile_view"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          metric: string
          reward_image_url: string | null
          reward_label: string | null
          starts_at: string
          target_value: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          metric: string
          reward_image_url?: string | null
          reward_label?: string | null
          starts_at: string
          target_value: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          metric?: string
          reward_image_url?: string | null
          reward_label?: string | null
          starts_at?: string
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      coming_soon_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          duration_months: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      feed_item_anon_likes: {
        Row: {
          created_at: string
          feed_item_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          feed_item_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          feed_item_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_item_anon_likes_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_item_anon_likes_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_items: {
        Row: {
          achievement_id: string | null
          body: string | null
          created_at: string
          drop_num: number | null
          id: string
          image_url: string | null
          is_hidden: boolean
          like_count: number
          parent_id: string | null
          status: string
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
          is_hidden?: boolean
          like_count?: number
          parent_id?: string | null
          status?: string
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
          is_hidden?: boolean
          like_count?: number
          parent_id?: string | null
          status?: string
          subscriber_id?: string
          type?: Database["public"]["Enums"]["feed_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_drop_num_fkey"
            columns: ["drop_num"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "feed_items_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "user_profile_view"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "feed_likes_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_likes_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_likes_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "feed_likes_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_likes_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_likes_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "user_profile_view"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          amount_cents: number
          buyer_email: string
          code: string
          created_at: string
          expires_at: string
          id: string
          message: string | null
          recipient_email: string
          redeemed_at: string | null
          redeemed_by_user_id: string | null
          status: string
          stripe_session_id: string | null
        }
        Insert: {
          amount_cents: number
          buyer_email: string
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          recipient_email: string
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          stripe_session_id?: string | null
        }
        Update: {
          amount_cents?: number
          buyer_email?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          recipient_email?: string
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      home_content: {
        Row: {
          faq_cta_body: string
          faq_cta_eyebrow: string
          faq_cta_heading: string
          faq_cta_highlight: string
          faq_cta_href: string
          faq_cta_label: string
          faq_cta_line: string
          hero_cta_primary_label: string
          hero_cta_secondary_label: string
          hero_headline: string
          hero_headline_highlight: string
          hero_headline_line1: string
          hero_headline_line3: string
          hero_poster_url: string | null
          hero_subtext: string
          hero_video_url: string | null
          how_it_works_heading: string
          how_it_works_heading_highlight: string
          how_it_works_heading_line1: string
          how_it_works_heading_line2: string
          how_it_works_subtitle: string
          id: number
          promo_video_url: string | null
          testimonials_heading: string
          testimonials_heading_highlight: string
          testimonials_heading_line2: string
          updated_at: string
        }
        Insert: {
          faq_cta_body?: string
          faq_cta_eyebrow?: string
          faq_cta_heading?: string
          faq_cta_highlight?: string
          faq_cta_href?: string
          faq_cta_label?: string
          faq_cta_line?: string
          hero_cta_primary_label?: string
          hero_cta_secondary_label?: string
          hero_headline?: string
          hero_headline_highlight?: string
          hero_headline_line1?: string
          hero_headline_line3?: string
          hero_poster_url?: string | null
          hero_subtext?: string
          hero_video_url?: string | null
          how_it_works_heading?: string
          how_it_works_heading_highlight?: string
          how_it_works_heading_line1?: string
          how_it_works_heading_line2?: string
          how_it_works_subtitle?: string
          id?: number
          promo_video_url?: string | null
          testimonials_heading?: string
          testimonials_heading_highlight?: string
          testimonials_heading_line2?: string
          updated_at?: string
        }
        Update: {
          faq_cta_body?: string
          faq_cta_eyebrow?: string
          faq_cta_heading?: string
          faq_cta_highlight?: string
          faq_cta_href?: string
          faq_cta_label?: string
          faq_cta_line?: string
          hero_cta_primary_label?: string
          hero_cta_secondary_label?: string
          hero_headline?: string
          hero_headline_highlight?: string
          hero_headline_line1?: string
          hero_headline_line3?: string
          hero_poster_url?: string | null
          hero_subtext?: string
          hero_video_url?: string | null
          how_it_works_heading?: string
          how_it_works_heading_highlight?: string
          how_it_works_heading_line1?: string
          how_it_works_heading_line2?: string
          how_it_works_subtitle?: string
          id?: number
          promo_video_url?: string | null
          testimonials_heading?: string
          testimonials_heading_highlight?: string
          testimonials_heading_line2?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_how_it_works_steps: {
        Row: {
          body: string
          brick_key: string
          id: string
          sort_order: number
          step_number: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          brick_key: string
          id?: string
          sort_order?: number
          step_number: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          brick_key?: string
          id?: string
          sort_order?: number
          step_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_marquee_items: {
        Row: {
          avatar_url: string | null
          id: string
          sort_order: number
          text: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          id?: string
          sort_order?: number
          text: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          id?: string
          sort_order?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_testimonials: {
        Row: {
          avatar_color: string
          bg: string
          id: string
          initials: string
          meta: string
          name: string
          quote: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          avatar_color: string
          bg: string
          id?: string
          initials: string
          meta: string
          name: string
          quote: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          avatar_color?: string
          bg?: string
          id?: string
          initials?: string
          meta?: string
          name?: string
          quote?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      merch_items: {
        Row: {
          bg: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          name: string
          price: number
          sizes: string[]
          slug: string
          sort_order: number
          status: string
          stock: number
          type: string
          updated_at: string
        }
        Insert: {
          bg?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name: string
          price: number
          sizes?: string[]
          slug: string
          sort_order?: number
          status?: string
          stock?: number
          type: string
          updated_at?: string
        }
        Update: {
          bg?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sizes?: string[]
          slug?: string
          sort_order?: number
          status?: string
          stock?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      missing_part_requests: {
        Row: {
          bag_number: string
          created_at: string
          id: string
          lego_set_code: string
          order_id: string
          part_code: string
          product_id: number
          quantity: number
          status: string
          subscriber_id: string
          updated_at: string
        }
        Insert: {
          bag_number: string
          created_at?: string
          id?: string
          lego_set_code: string
          order_id: string
          part_code: string
          product_id: number
          quantity: number
          status?: string
          subscriber_id: string
          updated_at?: string
        }
        Update: {
          bag_number?: string
          created_at?: string
          id?: string
          lego_set_code?: string
          order_id?: string
          part_code?: string
          product_id?: number
          quantity?: number
          status?: string
          subscriber_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missing_part_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_part_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_part_requests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "missing_part_requests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_part_requests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missing_part_requests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "user_profile_view"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          home_delivery: boolean
          id: string
          lp_barcode: string | null
          lp_label_created_at: string | null
          lp_parcel_id: string | null
          lp_return_barcode: string | null
          lp_return_label_created_at: string | null
          lp_return_parcel_id: string | null
          lp_return_terminal_id: string | null
          lp_return_tracking_state: string | null
          lp_terminal_id: string | null
          lp_terminal_name: string | null
          lp_tracking_state: string | null
          product_id: number
          return_note: string | null
          return_requested_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["order_status"]
          subscriber_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          home_delivery?: boolean
          id?: string
          lp_barcode?: string | null
          lp_label_created_at?: string | null
          lp_parcel_id?: string | null
          lp_return_barcode?: string | null
          lp_return_label_created_at?: string | null
          lp_return_parcel_id?: string | null
          lp_return_terminal_id?: string | null
          lp_return_tracking_state?: string | null
          lp_terminal_id?: string | null
          lp_terminal_name?: string | null
          lp_tracking_state?: string | null
          product_id: number
          return_note?: string | null
          return_requested_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["order_status"]
          subscriber_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          home_delivery?: boolean
          id?: string
          lp_barcode?: string | null
          lp_label_created_at?: string | null
          lp_parcel_id?: string | null
          lp_return_barcode?: string | null
          lp_return_label_created_at?: string | null
          lp_return_parcel_id?: string | null
          lp_return_terminal_id?: string | null
          lp_return_tracking_state?: string | null
          lp_terminal_id?: string | null
          lp_terminal_name?: string | null
          lp_tracking_state?: string | null
          product_id?: number
          return_note?: string | null
          return_requested_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["order_status"]
          subscriber_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "orders_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "user_profile_view"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          accent_color: string
          active: boolean
          annual_price: number | null
          bg_color: string
          brick_image: string | null
          comparison_data: Json
          created_at: string
          credits: number
          cta_bg: string
          cta_label: string | null
          cta_text: string
          featured: boolean
          id: Database["public"]["Enums"]["plan_tier"]
          level: number
          name: string | null
          perks: Json
          price: number
          sort_order: number
          tagline: string | null
          text_color: string
        }
        Insert: {
          accent_color?: string
          active?: boolean
          annual_price?: number | null
          bg_color: string
          brick_image?: string | null
          comparison_data?: Json
          created_at?: string
          credits?: number
          cta_bg?: string
          cta_label?: string | null
          cta_text?: string
          featured?: boolean
          id: Database["public"]["Enums"]["plan_tier"]
          level: number
          name?: string | null
          perks?: Json
          price: number
          sort_order?: number
          tagline?: string | null
          text_color: string
        }
        Update: {
          accent_color?: string
          active?: boolean
          annual_price?: number | null
          bg_color?: string
          brick_image?: string | null
          comparison_data?: Json
          created_at?: string
          credits?: number
          cta_bg?: string
          cta_label?: string | null
          cta_text?: string
          featured?: boolean
          id?: Database["public"]["Enums"]["plan_tier"]
          level?: number
          name?: string | null
          perks?: Json
          price?: number
          sort_order?: number
          tagline?: string | null
          text_color?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          bags: Json
          bg: string
          brick_colors: string[]
          brick_heights: number[]
          bricks: number
          build_time: string | null
          category: string
          compatibility: Json
          created_at: string
          description: string | null
          early_access_hours: number
          early_access_tiers: string[]
          faq: Json
          featured: boolean
          gallery: string[]
          id: number
          image_url: string | null
          is_new: boolean
          isDangerous: boolean
          minifig: Json | null
          minifigs: string
          rating: string | null
          release_date: string | null
          status: Database["public"]["Enums"]["product_status"]
          story: Json | null
          subtitle: string
          tier: Database["public"]["Enums"]["plan_tier"]
          title: string
          updated_at: string
          value: number | null
          year: number
        }
        Insert: {
          bags?: Json
          bg?: string
          brick_colors?: string[]
          brick_heights?: number[]
          bricks: number
          build_time?: string | null
          category: string
          compatibility?: Json
          created_at?: string
          description?: string | null
          early_access_hours?: number
          early_access_tiers?: string[]
          faq?: Json
          featured?: boolean
          gallery?: string[]
          id: number
          image_url?: string | null
          is_new?: boolean
          isDangerous?: boolean
          minifig?: Json | null
          minifigs?: string
          rating?: string | null
          release_date?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          story?: Json | null
          subtitle?: string
          tier: Database["public"]["Enums"]["plan_tier"]
          title: string
          updated_at?: string
          value?: number | null
          year: number
        }
        Update: {
          bags?: Json
          bg?: string
          brick_colors?: string[]
          brick_heights?: number[]
          bricks?: number
          build_time?: string | null
          category?: string
          compatibility?: Json
          created_at?: string
          description?: string | null
          early_access_hours?: number
          early_access_tiers?: string[]
          faq?: Json
          featured?: boolean
          gallery?: string[]
          id?: number
          image_url?: string | null
          is_new?: boolean
          isDangerous?: boolean
          minifig?: Json | null
          minifigs?: string
          rating?: string | null
          release_date?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          story?: Json | null
          subtitle?: string
          tier?: Database["public"]["Enums"]["plan_tier"]
          title?: string
          updated_at?: string
          value?: number | null
          year?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          feed_item_id: string
          id: string
          reason: string | null
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          feed_item_id: string
          id?: string
          reason?: string | null
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          feed_item_id?: string
          id?: string
          reason?: string | null
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_feed_item_id_fkey"
            columns: ["feed_item_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user_profile_view"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_penalties: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reason: string | null
          resolved_at: string | null
          status: string
          subscriber_email: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string
          subscriber_email: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string
          subscriber_email?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          avatar_bg: string
          avatar_id: number
          cancel_at: string | null
          city: string | null
          email: string
          flat: string | null
          home_delivery: boolean
          house_no: string | null
          id: string
          joined_at: string
          last_name: string | null
          name: string
          penalty_amount: number | null
          penalty_reason: string | null
          phone: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          postal_code: string | null
          status: Database["public"]["Enums"]["subscriber_status"]
          street: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_bg?: string
          avatar_id?: number
          cancel_at?: string | null
          city?: string | null
          email: string
          flat?: string | null
          home_delivery?: boolean
          house_no?: string | null
          id: string
          joined_at?: string
          last_name?: string | null
          name: string
          penalty_amount?: number | null
          penalty_reason?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          postal_code?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          street?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_bg?: string
          avatar_id?: number
          cancel_at?: string | null
          city?: string | null
          email?: string
          flat?: string | null
          home_delivery?: boolean
          house_no?: string | null
          id?: string
          joined_at?: string
          last_name?: string | null
          name?: string
          penalty_amount?: number | null
          penalty_reason?: string | null
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          postal_code?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          street?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "user_achievements_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "user_profile_view"
            referencedColumns: ["id"]
          },
        ]
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
          is_hidden: boolean | null
          like_count: number | null
          likedByCurrentUser: boolean | null
          parent_id: string | null
          plan: Database["public"]["Enums"]["plan_tier"] | null
          status: string | null
          subscriber_id: string | null
          type: Database["public"]["Enums"]["feed_event_type"] | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_drop_num_fkey"
            columns: ["drop_num"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["subscriber_id"]
          },
          {
            foreignKeyName: "feed_items_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "user_profile_view"
            referencedColumns: ["id"]
          },
        ]
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
          achievement_count: number | null
          avatar_bg: string | null
          avatar_id: number | null
          drops_received: number | null
          email: string | null
          id: string | null
          joined_at: string | null
          name: string | null
          plan: Database["public"]["Enums"]["plan_tier"] | null
          status: Database["public"]["Enums"]["subscriber_status"] | null
          total_points: number | null
        }
        Insert: {
          achievement_count?: never
          avatar_bg?: string | null
          avatar_id?: number | null
          drops_received?: never
          email?: string | null
          id?: string | null
          joined_at?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"] | null
          status?: Database["public"]["Enums"]["subscriber_status"] | null
          total_points?: never
        }
        Update: {
          achievement_count?: never
          avatar_bg?: string | null
          avatar_id?: number | null
          drops_received?: never
          email?: string | null
          id?: string | null
          joined_at?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"] | null
          status?: Database["public"]["Enums"]["subscriber_status"] | null
          total_points?: never
        }
        Relationships: []
      }
    }
    Functions: {
      evaluate_achievements: {
        Args: { p_subscriber_id: string }
        Returns: undefined
      }
      redeem_coupon: { Args: { p_code: string }; Returns: undefined }
      toggle_like: {
        Args: { p_feed_item_id: string; p_subscriber_id: string }
        Returns: undefined
      }
      toggle_like_anon: {
        Args: { p_feed_item_id: string; p_session_id: string }
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
      order_status:
        | "processing"
        | "active"
        | "overdue"
        | "returned"
        | "return_requested"
        | "return_declined"
      plan_tier:
        | "nano"
        | "mini"
        | "standard"
        | "pro"
        | "mega"
        | "mystery_s"
        | "mystery_m"
      product_status: "available" | "limited" | "sold_out"
      subscriber_status: "active" | "paused" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      achievement_category: ["activity", "social", "collector", "loyalty"],
      feed_event_type: [
        "checkin",
        "build_photo",
        "comment",
        "like",
        "achievement",
        "first_drop",
        "streak",
      ],
      order_status: [
        "processing",
        "active",
        "overdue",
        "returned",
        "return_requested",
        "return_declined",
      ],
      plan_tier: [
        "nano",
        "mini",
        "standard",
        "pro",
        "mega",
        "mystery_s",
        "mystery_m",
      ],
      product_status: ["available", "limited", "sold_out"],
      subscriber_status: ["active", "paused", "cancelled"],
    },
  },
} as const

export type PlanTier = Database["public"]["Enums"]["plan_tier"]
