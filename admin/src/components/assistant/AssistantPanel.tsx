import { useEffect, useRef } from "react"
import { SendIcon, SparklesIcon, XIcon } from "lucide-react"

import { ActionConfirmCard } from "@/components/assistant/ActionConfirmCard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { useAssistantPanel } from "@/context/AssistantContext"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "Which rentals are overdue?",
  "Kurie nuomos užsakymai laukia grąžinimo?",
  "Show clients with a paused subscription",
]

/** Right-hand column, mirroring the sidebar on the left. */
export function AssistantPanel() {
  const {
    isOpen,
    draft,
    setDraft,
    closePanel,
    session: assistant,
  } = useAssistantPanel()
  const endRef = useRef<HTMLDivElement>(null)
  const isThinking = assistant.status === "thinking"

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [assistant.messages, isThinking])

  function handleSend(text: string) {
    if (!text.trim() || isThinking) return
    void assistant.sendText(text)
    setDraft("")
  }

  if (!isOpen) return null

  return (
    <aside
      aria-label="Assistant"
      className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l bg-background sm:w-96 lg:sticky lg:top-0 lg:z-auto lg:h-svh lg:shrink-0"
    >
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
        <div className="flex items-center gap-2 font-semibold">
          <SparklesIcon className="size-4" aria-hidden />
          Assistant
        </div>
        <div className="flex items-center gap-1">
          {assistant.messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={assistant.reset}>
              New chat
            </Button>
          )}
          <IconButton label="Close assistant" onClick={closePanel}>
            <XIcon />
          </IconButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {assistant.errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{assistant.errorMessage}</AlertDescription>
          </Alert>
        )}
        {assistant.messages.length === 0 && (
          <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
            <p>
              Ask about orders and clients, in Lithuanian or English. Changes
              only run after you confirm them. For example:
            </p>
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="h-auto text-left whitespace-normal"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
        {assistant.messages.map((message) =>
          message.kind === "text" ? (
            <div
              key={message.id}
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                message.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start bg-muted"
              )}
            >
              {message.text}
            </div>
          ) : (
            <ActionConfirmCard
              key={message.id}
              action={message.action}
              outcome={message.outcome}
              error={message.error}
              onConfirm={() => assistant.resolveAction(message.action.id, true)}
              onDecline={() =>
                assistant.resolveAction(message.action.id, false)
              }
            />
          )
        )}
        {isThinking && (
          <p role="status" className="text-sm text-muted-foreground">
            Thinking…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault()
          handleSend(draft)
        }}
      >
        <Input
          aria-label="Message to the assistant"
          placeholder="Ask about an order or a client…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <IconButton
          type="submit"
          variant="default"
          label="Send message"
          disabled={isThinking || !draft.trim()}
        >
          <SendIcon />
        </IconButton>
      </form>
    </aside>
  )
}
