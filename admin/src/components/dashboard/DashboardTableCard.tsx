import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardTableCardProps {
  title: string
  description: string
  /** Route of the full list, e.g. "/orders". */
  href?: string
  linkLabel?: string
  loading: boolean
  children: ReactNode
}

export function DashboardTableCard({
  title,
  description,
  href,
  linkLabel,
  loading,
  children,
}: DashboardTableCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {href && (
          <Button asChild variant="outline" size="sm">
            <Link to={href}>{linkLabel ?? "View all"}</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-40 w-full" /> : children}
      </CardContent>
    </Card>
  )
}
