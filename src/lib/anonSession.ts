const SESSION_KEY = "community_anon_session"
const LIKES_KEY = "community_anon_likes"

export function getAnonSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export function getAnonLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKES_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function toggleAnonLikedId(feedItemId: string): Set<string> {
  const ids = getAnonLikedIds()
  if (ids.has(feedItemId)) {
    ids.delete(feedItemId)
  } else {
    ids.add(feedItemId)
  }
  localStorage.setItem(LIKES_KEY, JSON.stringify([...ids]))
  return ids
}
