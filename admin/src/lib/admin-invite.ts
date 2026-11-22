import { supabase } from './supabase'

/** Invite someone to the admin dashboard (or promote an existing account). Returns the email's status. */
export async function inviteAdmin(email: string): Promise<'invited' | 'promoted'> {
  const { data, error } = await supabase.functions.invoke('admin-invite', { body: { email } })
  if (error) {
    // The generic "non-2xx" message hides the function's own JSON error body.
    const res = (error as { context?: Response }).context
    const detail: unknown = await res?.json?.().catch(() => null)
    throw new Error(
      detail && typeof detail === 'object' && 'error' in detail ? String(detail.error) : error.message,
    )
  }
  return data.status as 'invited' | 'promoted'
}
