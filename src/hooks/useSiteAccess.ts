import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "bricktime-access"
const ACCESS_PARAM = "access"
const ACCESS_CODE = import.meta.env.VITE_SITE_ACCESS_CODE as string | undefined

function hasStoredAccess() {
  return (
    typeof window !== "undefined" &&
    localStorage.getItem(STORAGE_KEY) === ACCESS_CODE
  )
}

export function useSiteAccess() {
  const [granted, setGranted] = useState(
    () => !ACCESS_CODE || hasStoredAccess()
  )

  useEffect(() => {
    if (granted || !ACCESS_CODE) return
    const params = new URLSearchParams(window.location.search)
    const paramCode = params.get(ACCESS_PARAM)
    if (paramCode !== ACCESS_CODE) return

    localStorage.setItem(STORAGE_KEY, ACCESS_CODE)
    params.delete(ACCESS_PARAM)
    const rest = params.toString()
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (rest ? `?${rest}` : "")
    )
    setGranted(true)
  }, [granted])

  const unlock = useCallback((code: string) => {
    if (!ACCESS_CODE || code.trim() !== ACCESS_CODE) return false
    localStorage.setItem(STORAGE_KEY, ACCESS_CODE)
    setGranted(true)
    return true
  }, [])

  return { granted, unlock }
}
