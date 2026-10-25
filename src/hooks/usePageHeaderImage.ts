import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type PageHeaderSlug = "archive" | "merch" | "gift_cards" | "community"

/** `undefined` while loading, `null` when no image is set for the page. */
export function usePageHeaderImage(slug: PageHeaderSlug) {
  const [url, setUrl] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    supabase
      .from("page_headers")
      .select("image_url")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setUrl(data?.image_url || null))
  }, [slug])

  return url
}
