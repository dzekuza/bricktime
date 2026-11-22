import { useEffect, useRef, useState } from "react"
import { BellIcon } from "lucide-react"

import { NotificationItem } from "@/components/notifications/NotificationItem"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/hooks/use-notifications"

function formatBadge(count: number) {
  return count > 9 ? "9+" : String(count)
}

export function NotificationsBell() {
  const { isMobile } = useSidebar()
  const { items, loading, failed, unreadCount, isUnread, refresh, markAllRead } =
    useNotifications()
  const [open, setOpen] = useState(false)
  const previousUnread = useRef<number | null>(null)
  const [announcement, setAnnouncement] = useState("")

  // Tell screen readers when new items arrive after the first load.
  useEffect(() => {
    if (loading) return
    if (previousUnread.current !== null && unreadCount > previousUnread.current) {
      setAnnouncement(`${unreadCount} unread notifications`)
    }
    previousUnread.current = unreadCount
  }, [unreadCount, loading])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) void refresh()
    else markAllRead()
  }

  const label =
    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"

  return (
    <SidebarMenuItem>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <SidebarMenuButton
            tooltip="Notifications"
            aria-label={label}
            className="relative"
          >
            <BellIcon />
            <span>Notifications</span>
            {unreadCount > 0 && (
              // The count badge is hidden when the sidebar is icon-only.
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 hidden size-2 rounded-full bg-destructive group-data-[collapsible=icon]:block"
              />
            )}
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          side={isMobile ? "bottom" : "right"}
          align="start"
          aria-label="Notifications"
          className="w-96 max-w-[calc(100vw-2rem)] gap-0 p-0"
        >
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={unreadCount === 0}
              onClick={markAllRead}
            >
              Mark all as read
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-3 p-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : failed && items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Couldn't load notifications.{" "}
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="underline underline-offset-2"
                >
                  Try again
                </button>
              </p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nothing new yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    notification={item}
                    unread={isUnread(item)}
                    onNavigate={() => handleOpenChange(false)}
                  />
                ))}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {unreadCount > 0 && (
        <SidebarMenuBadge aria-hidden="true">
          {formatBadge(unreadCount)}
        </SidebarMenuBadge>
      )}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </SidebarMenuItem>
  )
}
