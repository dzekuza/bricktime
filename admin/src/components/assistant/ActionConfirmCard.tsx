import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ActionOutcome } from "@/hooks/use-assistant"
import type { PendingAction } from "@/lib/assistant/tools"

interface ActionConfirmCardProps {
  action: PendingAction
  outcome: ActionOutcome
  error?: string
  onConfirm: () => void
  onDecline: () => void
}

const OUTCOME_LABELS: Record<Exclude<ActionOutcome, "awaiting">, string> = {
  running: "Applying…",
  executed: "Done",
  declined: "Declined",
  failed: "Failed",
}

export function ActionConfirmCard({
  action,
  outcome,
  error,
  onConfirm,
  onDecline,
}: ActionConfirmCardProps) {
  const isAwaiting = outcome === "awaiting"

  return (
    <Card role="group" aria-label={`Confirm: ${action.title}`}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {action.title}
          {action.isDestructive && (
            <Badge variant="destructive">Irreversible</Badge>
          )}
          {!isAwaiting && (
            <Badge variant={outcome === "failed" ? "destructive" : "secondary"}>
              {OUTCOME_LABELS[outcome]}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{action.target}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {action.details.map((detail) => (
          <div
            key={detail.label}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="w-32 shrink-0 text-muted-foreground">
              {detail.label}
            </span>
            {detail.before !== undefined && (
              <>
                <span className="line-through">{detail.before}</span>
                <ArrowRightIcon
                  className="size-3.5 text-muted-foreground"
                  aria-hidden
                />
              </>
            )}
            <span className="font-medium">{detail.after}</span>
          </div>
        ))}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
      {isAwaiting && (
        <CardFooter className="gap-2">
          <Button
            size="sm"
            variant={action.isDestructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={onDecline}>
            Decline
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
