import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  MicIcon,
  MicOffIcon,
  SendIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"

import { ActionConfirmCard } from "@/components/assistant/ActionConfirmCard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { IconButton } from "@/components/ui/icon-button"
import { Input } from "@/components/ui/input"
import { useAssistant } from "@/hooks/use-assistant"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "Which rentals are overdue?",
  "Kurie nuomos užsakymai laukia grąžinimo?",
  "Show clients with a paused subscription",
]

export function Assistant() {
  const [searchParams] = useSearchParams()
  const assistant = useAssistant()
  const [draft, setDraft] = useState(() => searchParams.get("prompt") ?? "")
  const endRef = useRef<HTMLDivElement>(null)
  const isReady = assistant.status === "ready"

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [assistant.messages])

  function handleSend(text: string) {
    if (!text.trim()) return
    assistant.sendText(text)
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Ask about orders and clients by voice or text, in Lithuanian or
            English. Changes only run after you confirm them.
          </p>
        </div>
        {isReady ? (
          <Button variant="outline" size="sm" onClick={assistant.disconnect}>
            End session
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => void assistant.connect()}
            disabled={assistant.status === "connecting"}
          >
            {assistant.status === "connecting"
              ? "Connecting…"
              : "Start session"}
          </Button>
        )}
      </div>

      {assistant.errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{assistant.errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="min-h-96">
        <CardContent className="flex flex-1 flex-col gap-3">
          {assistant.messages.length === 0 && (
            <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
              <p>
                {isReady
                  ? "Type below or turn on the microphone. For example:"
                  : "Start a session to talk to the assistant. For example:"}
              </p>
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  disabled={!isReady}
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
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  message.role === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted"
                )}
              >
                {message.text}
              </div>
            ) : (
              <div key={message.id} className="max-w-xl">
                <ActionConfirmCard
                  action={message.action}
                  outcome={message.outcome}
                  error={message.error}
                  onConfirm={() =>
                    assistant.resolveAction(message.action.id, true)
                  }
                  onDecline={() =>
                    assistant.resolveAction(message.action.id, false)
                  }
                />
              </div>
            )
          )}
          <div ref={endRef} />
        </CardContent>
        <CardFooter>
          <form
            className="flex w-full items-center gap-2"
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
              disabled={!isReady}
            />
            <IconButton
              type="button"
              variant={assistant.isMicOn ? "default" : "outline"}
              label={
                assistant.isMicOn ? "Turn microphone off" : "Turn microphone on"
              }
              aria-pressed={assistant.isMicOn}
              disabled={!isReady}
              onClick={() => void assistant.toggleMic()}
            >
              {assistant.isMicOn ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            <IconButton
              type="button"
              variant="outline"
              label={
                assistant.isMuted ? "Unmute replies" : "Mute spoken replies"
              }
              aria-pressed={assistant.isMuted}
              onClick={assistant.toggleMuted}
            >
              {assistant.isMuted ? <VolumeXIcon /> : <Volume2Icon />}
            </IconButton>
            <IconButton
              type="submit"
              variant="default"
              label="Send message"
              disabled={!isReady || !draft.trim()}
            >
              <SendIcon />
            </IconButton>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
