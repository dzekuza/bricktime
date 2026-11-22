import { useEffect, useState } from "react"

import {
  MIN_QUERY_LENGTH,
  searchEverything,
  type SearchHit,
} from "@/lib/global-search"

const DEBOUNCE_MS = 250

/** Debounced search; stale responses are dropped so results never flicker back. */
export function useGlobalSearch(query: string) {
  const term = query.trim()
  const isActive = term.length >= MIN_QUERY_LENGTH
  const [settled, setSettled] = useState<{ term: string; hits: SearchHit[] }>({
    term: "",
    hits: [],
  })

  useEffect(() => {
    if (!isActive) return
    let cancelled = false
    const timer = setTimeout(() => {
      void searchEverything(term).then((hits) => {
        if (!cancelled) setSettled({ term, hits })
      })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term, isActive])

  return {
    hits: isActive ? settled.hits : [],
    isLoading: isActive && settled.term !== term,
    isActive,
  }
}
