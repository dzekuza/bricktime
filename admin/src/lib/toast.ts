export type ToastKind = "success" | "error"

export interface ToastMessage {
  id: number
  kind: ToastKind
  message: string
}

const DISMISS_MS: Record<ToastKind, number> = { success: 5000, error: 8000 }

let toasts: ToastMessage[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function push(kind: ToastKind, message: string) {
  const id = nextId++
  toasts = [...toasts, { id, kind, message }]
  emit()
  setTimeout(() => dismissToast(id), DISMISS_MS[kind])
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
}

export function subscribeToasts(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getToasts() {
  return toasts
}
