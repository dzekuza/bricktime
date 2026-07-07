import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Single authenticated client. Admin privileges come from the signed-in user's
// `app_metadata.role = 'admin'` claim, enforced server-side by RLS — the browser
// never holds a service-role key.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
