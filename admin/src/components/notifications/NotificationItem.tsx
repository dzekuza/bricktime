import { formatDistanceToNow, parseISO } from "date-fns"
import {
  GiftIcon,
  PackageIcon,
  RotateCcwIcon,
  ShirtIcon,
  SparklesIcon,
  StarIcon,
  UserMinusIcon,
  UserPlusIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import type { AdminNotification, NotificationKind } from "@/lib/notifications"

const KIND_ICONS: Record<NotificationKind, LucideIcon> = {
  new_member: UserPlusIcon,
  subscription_cancelled: UserMinusIcon,
  rental: PackageIcon,
  mystery_request: SparklesIcon,
  return_requested: RotateCcwIcon,
  merch_order: ShirtIcon,
  gift_card: GiftIcon,
  review: StarIcon,
  missing_part: WrenchIcon,
}

interface NotificationItemProps {
  notification: AdminNotification
  unread: boolean
  onNavigate: () => void
}

export function NotificationItem({
  notification,
  unread,
  onNavigate,
}: NotificationItemProps) {
  const Icon = KIND_ICONS[notification.kind]

  return (
    <li>
      <Link
        to={notification.href}
        onClick={onNavigate}
        className="flex gap-3 px-3 py-2.5 outline-none hover:bg-accent focus-visible:bg-accent"
      >
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-muted">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">
              {notification.title}
            </span>
            {unread && (
              <Badge variant="secondary" className="shrink-0">
                New
              </Badge>
            )}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {notification.detail}
          </span>
          <time
            dateTime={notification.createdAt}
            className="text-xs text-muted-foreground"
          >
            {formatDistanceToNow(parseISO(notification.createdAt), {
              addSuffix: true,
            })}
          </time>
        </span>
      </Link>
    </li>
  )
}
