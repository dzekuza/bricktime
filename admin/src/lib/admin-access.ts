import type { User } from '@supabase/supabase-js'

/**
 * Accounts allowed in by email: a comma-separated VITE_ADMIN_EMAILS (or the older single
 * VITE_ADMIN_EMAIL), defaulting to admin@admin.com. Accounts invited from Settings carry
 * app_metadata.role = 'admin' instead, which is also what the database's row-level rules check.
 */
const ADMIN_EMAILS = (
  (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) ||
  (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ||
  'admin@admin.com'
)
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export const isAdminUser = (user: User | null | undefined): boolean =>
  !!user &&
  (user.app_metadata?.role === 'admin' || ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? ''))
