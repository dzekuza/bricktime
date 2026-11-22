import { useState } from "react"
import { useSearchParams } from "react-router-dom"

/**
 * Local search-box state that is seeded from a URL param, so the global search
 * can deep-link into a page already filtered. Typing never writes to the URL.
 */
export function useQuerySearch(param = "q") {
  const [params] = useSearchParams()
  const fromUrl = params.get(param) ?? ""
  const [value, setValue] = useState(fromUrl)
  const [seenUrl, setSeenUrl] = useState(fromUrl)

  if (fromUrl !== seenUrl) {
    setSeenUrl(fromUrl)
    setValue(fromUrl)
  }

  return [value, setValue] as const
}
