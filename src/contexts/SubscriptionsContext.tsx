import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { DbSubscription } from '@/hooks/useSubscriptions'

interface SubscriptionsContextValue {
  subscriptions: DbSubscription[]
  loading: boolean
  error: string | null
}

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null)

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<DbSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // NOTE: table name is still `plans` in Supabase; renaming the DB schema
    // is a separate migration, out of scope for this UI/copy pass.
    supabase
      .from('plans')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else {
          setSubscriptions((data ?? []) as unknown as DbSubscription[])
        }
        setLoading(false)
      })
  }, [])

  return (
    <SubscriptionsContext.Provider value={{ subscriptions, loading, error }}>
      {children}
    </SubscriptionsContext.Provider>
  )
}

export function useSubscriptionsContext(): SubscriptionsContextValue {
  const ctx = useContext(SubscriptionsContext)
  if (!ctx) throw new Error('useSubscriptionsContext must be used inside SubscriptionsProvider')
  return ctx
}
