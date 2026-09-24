import { useLayoutEffect, useRef, useState } from "react"
import DOMPurify from "dompurify"

import { cn } from "@/lib/utils"

const ALLOWED_TAGS = [
  "b",
  "strong",
  "i",
  "em",
  "u",
  "br",
  "p",
  "ul",
  "ol",
  "li",
  "span",
]

export function ExpandableHtml({
  html,
  className = "",
}: {
  html: string
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [sanitized])

  return (
    <div>
      <div
        ref={ref}
        className={cn(className, !expanded && "line-clamp-5")}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
      {isClamped && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 font-mono text-[12px] font-bold tracking-[.08em] text-brand-indigo uppercase hover:underline"
        >
          {expanded ? "Rodyti mažiau" : "Rodyti daugiau"}
        </button>
      )}
    </div>
  )
}
