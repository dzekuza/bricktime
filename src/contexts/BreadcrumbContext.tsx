import { createContext, useContext, useState } from 'react'

interface BreadcrumbCtx {
  label: string | null
  setLabel: (l: string | null) => void
}

export const BreadcrumbContext = createContext<BreadcrumbCtx>({ label: null, setLabel: () => {} })

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [label, setLabel] = useState<string | null>(null)
  return (
    <BreadcrumbContext.Provider value={{ label, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumbLabel() {
  return useContext(BreadcrumbContext)
}
