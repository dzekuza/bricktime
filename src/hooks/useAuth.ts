import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AuthProfile {
  id: string
  name: string
  avatarId: number
  avatarBg: string
  plan: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    supabase
      .from('subscribers')
      .select('id, name, avatar_id, avatar_bg, plan')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile({ id: data.id, name: data.name, avatarId: data.avatar_id, avatarBg: data.avatar_bg, plan: data.plan ?? null })
        setLoading(false)
      })
  }, [user])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, profile, loading, signOut }
}
