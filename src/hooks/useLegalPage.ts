import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export type LegalSection = {
  id: string
  title: string
  body: string[]
  bullets?: string[]
}

export type LegalPage = {
  intro: string
  revisionDate: string
  sections: LegalSection[]
}

type LegalPageSlug = "privacy_policy" | "store_rules"

/** `undefined` while loading, `null` when the row is missing or the fetch failed. */
export function useLegalPage(slug: LegalPageSlug) {
  const [page, setPage] = useState<LegalPage | null | undefined>(undefined)

  useEffect(() => {
    supabase
      .from("legal_pages")
      .select("intro, revision_date, sections")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setPage(null)
          return
        }
        setPage({
          intro: data.intro,
          revisionDate: data.revision_date,
          // Shape is enforced by the admin editor; the column itself is untyped jsonb.
          sections: data.sections as unknown as LegalSection[],
        })
      })
  }, [slug])

  return page
}
