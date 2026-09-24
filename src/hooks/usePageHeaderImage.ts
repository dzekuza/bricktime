import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type PageHeaderSlug = "archive" | "merch" | "gift_cards" | "community"

export function usePageHeaderImage(slug: PageHeaderSlug, fallbackUrl: string) {
  const [url, setUrl] = useState(fallbackUrl)

  useEffect(() => {
    supabase
      .from("page_headers")
      .select("image_url")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (data?.image_url) setUrl(data.image_url)
      })
  }, [slug])

  return url
}
