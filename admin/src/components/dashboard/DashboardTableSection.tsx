import { useId } from "react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardTableSectionProps {
  title: string
  description: string
  /** Route of the full list, e.g. "/orders". */
  href?: string
  linkLabel?: string
  loading: boolean
  children: ReactNode
}

export function DashboardTableSection({
  title,
  description,
  href,
  linkLabel,
  loading,
  children,
}: DashboardTableSectionProps) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 id={headingId} className="text-base font-medium">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {href && (
          <Button asChild variant="outline" size="sm">
            <Link to={href}>{linkLabel ?? "View all"}</Link>
          </Button>
        )}
      </div>
      {loading ? <Skeleton className="h-40 w-full" /> : children}
    </section>
  )
}
