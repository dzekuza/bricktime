import { useCallback, useEffect, useRef, useState } from "react"
import {
  GoogleGenAI,
  Modality,
  type FunctionCall,
  type LiveServerMessage,
  type Session,
} from "@google/genai"

import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import {
  createAudioPlayer,
  startMicCapture,
  type AudioPlayer,
  type MicCapture,
} from "@/lib/assistant/audio"
import {
  SYSTEM_INSTRUCTION,
  TOOL_DECLARATIONS,
  discardAction,
  executeWriteTool,
  isWriteTool,
  logAction,
  prepareWriteTool,
  runReadTool,
  type PendingAction,
} from "@/lib/assistant/tools"

export type AssistantStatus = "idle" | "connecting" | "ready" | "error"
export type ActionOutcome =
  | "awaiting"
  | "running"
  | "executed"
  | "declined"
  | "failed"

export type AssistantMessage =
  | { id: number; kind: "text"; role: "user" | "assistant"; text: string }
  | {
      id: number
      kind: "action"
      action: PendingAction
      outcome: ActionOutcome
      error?: string
    }

const AUDIO_MIME = "audio/pcm;rate=16000"

async function fetchToken(): Promise<{ token: string; model: string }> {
  const { data, error } = await supabase.functions.invoke<{
    token?: string
    model?: string
    error?: string
  }>("admin-assistant-token")
  if (error) {
    const res = (error as { context?: Response }).context
    const detail: unknown = await res?.json?.().catch(() => null)
    throw new Error(
      detail && typeof detail === "object" && "error" in detail
        ? String(detail.error)
        : error.message
    )
  }
  if (!data?.token || !data.model) {
    throw new Error(data?.error ?? "Could not start the assistant")
  }
  return { token: data.token, model: data.model }
}

export function useAssistant() {
  const { session: authSession } = useAuth()
  const adminEmail = authSession?.user.email

  const [status, setStatus] = useState<AssistantStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [isMicOn, setIsMicOn] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const sessionRef = useRef<Session | null>(null)
  const micRef = useRef<MicCapture | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)
  const nextId = useRef(1)
  // Which side the transcript currently being streamed belongs to.
  const openTurn = useRef<"user" | "assistant" | null>(null)
  const decisions = useRef(new Map<string, (isApproved: boolean) => void>())
  const adminEmailRef = useRef(adminEmail)
  useEffect(() => {
    adminEmailRef.current = adminEmail
  }, [adminEmail])

  const appendTranscript = useCallback(
    (role: "user" | "assistant", text: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (
          openTurn.current === role &&
          last?.kind === "text" &&
          last.role === role
        ) {
          return [...prev.slice(0, -1), { ...last, text: last.text + text }]
        }
        return [...prev, { id: nextId.current++, kind: "text", role, text }]
      })
      openTurn.current = role
    },
    []
  )

  const patchAction = useCallback(
    (actionId: string, patch: { outcome: ActionOutcome; error?: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.kind === "action" && m.action.id === actionId
            ? { ...m, ...patch }
            : m
        )
      )
    },
    []
  )

  const handleWriteCall = useCallback(
    async (call: FunctionCall & { name: string }) => {
      const action = await prepareWriteTool(
        call.name as Parameters<typeof prepareWriteTool>[0],
        call.args ?? {}
      )
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, kind: "action", action, outcome: "awaiting" },
      ])
      openTurn.current = null

      // The model's turn is blocked until the admin answers on the card.
      const isApproved = await new Promise<boolean>((resolve) => {
        decisions.current.set(action.id, resolve)
      })
      decisions.current.delete(action.id)

      if (!isApproved) {
        discardAction(action.id)
        patchAction(action.id, { outcome: "declined" })
        return { declined: true, note: "The admin declined this change." }
      }
      patchAction(action.id, { outcome: "running" })
      try {
        const result = await executeWriteTool(action)
        await logAction(action, adminEmailRef.current, { status: "executed" })
        patchAction(action.id, { outcome: "executed" })
        return result
      } catch (err) {
        const message = (err as Error).message
        await logAction(action, adminEmailRef.current, {
          status: "failed",
          error: message,
        })
        patchAction(action.id, { outcome: "failed", error: message })
        throw err
      }
    },
    [patchAction]
  )

  const handleToolCalls = useCallback(
    async (session: Session, calls: FunctionCall[]) => {
      const functionResponses = []
      for (const call of calls) {
        const name = call.name ?? ""
        try {
          const output = isWriteTool(name)
            ? await handleWriteCall({ ...call, name })
            : await runReadTool(name, call.args ?? {})
          functionResponses.push({ id: call.id, name, response: { output } })
        } catch (err) {
          functionResponses.push({
            id: call.id,
            name,
            response: { error: (err as Error).message },
          })
        }
      }
      try {
        session.sendToolResponse({ functionResponses })
      } catch {
        // The session closed while the admin was deciding; nothing left to answer.
      }
    },
    [handleWriteCall]
  )

  const handleMessage = useCallback(
    (session: Session, message: LiveServerMessage) => {
      if (message.toolCall?.functionCalls) {
        void handleToolCalls(session, message.toolCall.functionCalls)
      }
      const content = message.serverContent
      if (!content) return
      for (const part of content.modelTurn?.parts ?? []) {
        if (part.inlineData?.data)
          playerRef.current?.enqueue(part.inlineData.data)
      }
      if (content.inputTranscription?.text) {
        appendTranscript("user", content.inputTranscription.text)
      }
      if (content.outputTranscription?.text) {
        appendTranscript("assistant", content.outputTranscription.text)
      }
      if (content.interrupted) playerRef.current?.clear()
      if (content.turnComplete) openTurn.current = null
    },
    [appendTranscript, handleToolCalls]
  )

  const stopMic = useCallback(() => {
    micRef.current?.stop()
    micRef.current = null
    setIsMicOn(false)
    sessionRef.current?.sendRealtimeInput({ audioStreamEnd: true })
  }, [])

  const disconnect = useCallback(() => {
    micRef.current?.stop()
    micRef.current = null
    setIsMicOn(false)
    sessionRef.current?.close()
    sessionRef.current = null
    playerRef.current?.close()
    playerRef.current = null
    // A request still waiting on the admin must not stay confirmable.
    decisions.current.forEach((resolve) => resolve(false))
    setStatus("idle")
  }, [])

  const connect = useCallback(async () => {
    if (sessionRef.current) return
    setStatus("connecting")
    setErrorMessage(null)
    try {
      const { token, model } = await fetchToken()
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: "v1alpha" },
      })
      playerRef.current = createAudioPlayer()
      playerRef.current.setMuted(isMuted)
      // The session isn't assigned until connect resolves, so callbacks that
      // fire earlier look it up lazily.
      const live: { current: Session | null } = { current: null }
      live.current = await ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message) => {
            if (live.current) handleMessage(live.current, message)
          },
          onerror: (event) => {
            setErrorMessage(event.message || "The assistant connection failed")
            setStatus("error")
          },
          onclose: () => {
            if (sessionRef.current === live.current) {
              sessionRef.current = null
              decisions.current.forEach((resolve) => resolve(false))
              micRef.current?.stop()
              micRef.current = null
              setIsMicOn(false)
              playerRef.current?.close()
              playerRef.current = null
              setStatus((current) => (current === "error" ? current : "idle"))
            }
          },
        },
      })
      sessionRef.current = live.current
      setStatus("ready")
    } catch (err) {
      playerRef.current?.close()
      playerRef.current = null
      setErrorMessage((err as Error).message)
      setStatus("error")
    }
  }, [handleMessage, isMuted])

  const sendText = useCallback((text: string) => {
    const trimmed = text.trim()
    const session = sessionRef.current
    if (!trimmed || !session) return
    openTurn.current = null
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, kind: "text", role: "user", text: trimmed },
    ])
    // Cut off any speech still playing, like a spoken interruption would.
    playerRef.current?.clear()
    session.sendRealtimeInput({ text: trimmed })
  }, [])

  const toggleMic = useCallback(async () => {
    if (micRef.current) {
      stopMic()
      return
    }
    const session = sessionRef.current
    if (!session) return
    try {
      micRef.current = await startMicCapture((data) =>
        session.sendRealtimeInput({ audio: { data, mimeType: AUDIO_MIME } })
      )
      setIsMicOn(true)
    } catch (err) {
      setErrorMessage(
        (err as Error).name === "NotAllowedError"
          ? "Microphone access was denied"
          : "Could not open the microphone"
      )
    }
  }, [stopMic])

  const toggleMuted = useCallback(() => {
    setIsMuted((prev) => {
      playerRef.current?.setMuted(!prev)
      return !prev
    })
  }, [])

  const resolveAction = useCallback((actionId: string, isApproved: boolean) => {
    decisions.current.get(actionId)?.(isApproved)
  }, [])

  // Leaving the page ends the session, the microphone and any open request.
  useEffect(() => disconnect, [disconnect])

  return {
    status,
    errorMessage,
    messages,
    isMicOn,
    isMuted,
    connect,
    disconnect,
    sendText,
    toggleMic,
    toggleMuted,
    resolveAction,
  }
}
