import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { DbPlan } from '@/hooks/usePlans'

interface PlansContextValue {
  plans: DbPlan[]
  loading: boolean
  error: string | null
}

const PlansContext = createContext<PlansContextValue | null>(null)

export function PlansProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<DbPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('plans')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
        } else {
          setPlans((data ?? []) as unknown as DbPlan[])
        }
        setLoading(false)
      })
  }, [])

  return (
    <PlansContext.Provider value={{ plans, loading, error }}>
      {children}
    </PlansContext.Provider>
  )
}

export function usePlansContext(): PlansContextValue {
  const ctx = useContext(PlansContext)
  if (!ctx) throw new Error('usePlansContext must be used inside PlansProvider')
  return ctx
}
