import { useCallback, useEffect, useState } from "react"

import { fetchNotifications, type AdminNotification } from "@/lib/notifications"

const STORAGE_KEY = "admin.notifications.lastSeen"
const POLL_MS = 60_000
const FIRST_VISIT_WINDOW_MS = 24 * 60 * 60 * 1000

function readLastSeen(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
  } catch {
    // Storage can be blocked; fall back to the first-visit window.
  }
  return new Date(Date.now() - FIRST_VISIT_WINDOW_MS).toISOString()
}

export function useNotifications() {
  const [items, setItems] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [lastSeen, setLastSeen] = useState(readLastSeen)

  const refresh = useCallback(async () => {
    try {
      setItems(await fetchNotifications())
      setFailed(false)
    } catch (err) {
      console.error("Notifications failed to load:", err)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = setInterval(() => {
      if (!document.hidden) void refresh()
    }, POLL_MS)
    const onVisible = () => {
      if (!document.hidden) void refresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [refresh])

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString()
    try {
      localStorage.setItem(STORAGE_KEY, now)
    } catch {
      // Unread state just won't persist across reloads.
    }
    setLastSeen(now)
  }, [])

  const lastSeenMs = Date.parse(lastSeen)
  const isUnread = useCallback(
    (item: AdminNotification) => Date.parse(item.createdAt) > lastSeenMs,
    [lastSeenMs]
  )
  const unreadCount = items.filter(isUnread).length

  return { items, loading, failed, unreadCount, isUnread, refresh, markAllRead }
}
