import { useAuthContext } from '@/contexts/AuthContext'

export interface AuthProfile {
  id: string
  name: string
  avatarId: number
  avatarBg: string
  plan: string | null
}

export function useAuth() {
  return useAuthContext()
}
