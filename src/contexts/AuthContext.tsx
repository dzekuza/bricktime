import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { AuthProfile } from "@/hooks/useAuth"

interface AuthContextValue {
  user: User | null
  profile: AuthProfile | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data, error: err } = await supabase
      .from("subscribers")
      .select("id, name, avatar_id, avatar_bg, plan, status, cancel_at")
      .eq("id", userId)
      .single()
    if (err) {
      setError(err.message)
    } else if (data) {
      setProfile({
        id: data.id,
        name: data.name,
        avatarId: data.avatar_id,
        avatarBg: data.avatar_bg,
        plan: data.plan ?? null,
        status: data.status ?? null,
        cancelAt: data.cancel_at ?? null,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    loadProfile(user.id)
  }, [user])

  async function refreshProfile() {
    if (user) await loadProfile(user.id)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, error, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider")
  return ctx
}
