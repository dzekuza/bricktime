import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import { useAssistant } from "@/hooks/use-assistant"

type AssistantSession = ReturnType<typeof useAssistant>

interface AssistantPanelValue {
  isOpen: boolean
  /** Text to prefill in the message box; the admin still has to send it. */
  draft: string
  setDraft: (draft: string) => void
  togglePanel: () => void
  closePanel: () => void
  openWith: (prompt?: string) => void
  session: AssistantSession
}

const AssistantContext = createContext<AssistantPanelValue | null>(null)

// Lives above the pages so a session, and any change waiting for confirmation,
// survives navigating between them while the panel is closed.
export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const session = useAssistant()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState("")

  const togglePanel = useCallback(() => setIsOpen((prev) => !prev), [])
  const closePanel = useCallback(() => setIsOpen(false), [])
  const openWith = useCallback((prompt?: string) => {
    if (prompt !== undefined) setDraft(prompt)
    setIsOpen(true)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      draft,
      setDraft,
      togglePanel,
      closePanel,
      openWith,
      session,
    }),
    [isOpen, draft, togglePanel, closePanel, openWith, session]
  )

  return <AssistantContext value={value}>{children}</AssistantContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAssistantPanel(): AssistantPanelValue {
  const value = useContext(AssistantContext)
  if (!value)
    throw new Error("useAssistantPanel must be used inside AssistantProvider")
  return value
}
