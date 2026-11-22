import { useCallback, useEffect, useRef, useState } from "react"
import type { Content, FunctionCall, Part } from "@google/genai"

import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
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

export type AssistantStatus = "idle" | "thinking" | "error"
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

// Stops a model that keeps calling tools from looping forever.
const MAX_TOOL_ROUNDS = 8

async function askModel(contents: Content[]): Promise<Content> {
  const { data, error } = await supabase.functions.invoke<{
    content?: Content
    error?: string
  }>("admin-assistant-chat", {
    body: {
      contents,
      systemInstruction: SYSTEM_INSTRUCTION,
      functionDeclarations: TOOL_DECLARATIONS,
    },
  })
  if (error) {
    // The generic "non-2xx" message hides the function's own error body.
    const res = (error as { context?: Response }).context
    const detail: unknown = await res?.json?.().catch(() => null)
    throw new Error(
      detail && typeof detail === "object" && "error" in detail
        ? String(detail.error)
        : error.message
    )
  }
  if (!data?.content) {
    throw new Error(data?.error ?? "No answer from the assistant")
  }
  return data.content
}

export function useAssistant() {
  const { session: authSession } = useAuth()
  const adminEmail = authSession?.user.email

  const [status, setStatus] = useState<AssistantStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>([])

  // What the model sees, kept as the API returned it (thought signatures included).
  const history = useRef<Content[]>([])
  const nextId = useRef(1)
  const isBusy = useRef(false)
  // Bumped by reset/unmount so a turn that is still running stops quietly.
  const generation = useRef(0)
  const decisions = useRef(new Map<string, (isApproved: boolean) => void>())
  const adminEmailRef = useRef(adminEmail)
  useEffect(() => {
    adminEmailRef.current = adminEmail
  }, [adminEmail])

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
    async (
      name: Parameters<typeof prepareWriteTool>[0],
      args: Record<string, unknown>
    ) => {
      const action = await prepareWriteTool(name, args)
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, kind: "action", action, outcome: "awaiting" },
      ])

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
        const logError = await logAction(action, adminEmailRef.current, {
          status: "executed",
        })
        patchAction(action.id, {
          outcome: "executed",
          error: logError
            ? "The change was applied, but the audit log entry could not be saved."
            : undefined,
        })
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

  const runToolCall = useCallback(
    async (call: FunctionCall): Promise<Part> => {
      const name = call.name ?? ""
      const args = call.args ?? {}
      try {
        const output = isWriteTool(name)
          ? await handleWriteCall(name, args)
          : await runReadTool(name, args)
        return { functionResponse: { id: call.id, name, response: { output } } }
      } catch (err) {
        return {
          functionResponse: {
            id: call.id,
            name,
            response: { error: (err as Error).message },
          },
        }
      }
    },
    [handleWriteCall]
  )

  const runTurn = useCallback(
    async (myGeneration: number) => {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const content = await askModel(history.current)
        if (myGeneration !== generation.current) return
        history.current.push(content)

        const parts = content.parts ?? []
        const text = parts
          .filter((part) => !part.thought)
          .map((part) => part.text ?? "")
          .join("")
          .trim()
        if (text) {
          setMessages((prev) => [
            ...prev,
            { id: nextId.current++, kind: "text", role: "assistant", text },
          ])
        }

        const calls = parts.flatMap((part) =>
          part.functionCall ? [part.functionCall] : []
        )
        if (calls.length === 0) return

        const responses: Part[] = []
        for (const call of calls) responses.push(await runToolCall(call))
        if (myGeneration !== generation.current) return
        history.current.push({ role: "user", parts: responses })
      }
      throw new Error("The assistant made too many tool calls in a row")
    },
    [runToolCall]
  )

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isBusy.current) return
      isBusy.current = true
      const myGeneration = generation.current
      setErrorMessage(null)
      setStatus("thinking")
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, kind: "text", role: "user", text: trimmed },
      ])
      history.current.push({ role: "user", parts: [{ text: trimmed }] })
      try {
        await runTurn(myGeneration)
        if (myGeneration === generation.current) setStatus("idle")
      } catch (err) {
        if (myGeneration !== generation.current) return
        setErrorMessage((err as Error).message)
        setStatus("error")
      } finally {
        if (myGeneration === generation.current) isBusy.current = false
      }
    },
    [runTurn]
  )

  /** Starts a fresh conversation; a change still waiting on the admin is declined. */
  const reset = useCallback(() => {
    generation.current += 1
    isBusy.current = false
    decisions.current.forEach((resolve) => resolve(false))
    history.current = []
    setMessages([])
    setErrorMessage(null)
    setStatus("idle")
  }, [])

  const resolveAction = useCallback((actionId: string, isApproved: boolean) => {
    decisions.current.get(actionId)?.(isApproved)
  }, [])

  // Leaving the admin app drops any request that is still awaiting confirmation.
  useEffect(() => reset, [reset])

  return { status, errorMessage, messages, sendText, reset, resolveAction }
}
