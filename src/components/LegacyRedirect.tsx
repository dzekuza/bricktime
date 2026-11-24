import { Navigate, useLocation, useParams } from "react-router-dom"

/**
 * Sends an old English URL to its Lithuanian one, keeping the query string and
 * #anchor: emails, Stripe return links and bookmarks still use the old paths.
 */
export function LegacyRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation()
  const params = useParams()
  const pathname = to.replace(/:(\w+)/g, (_, key: string) => params[key] ?? "")
  return <Navigate replace to={{ pathname, search, hash }} />
}
