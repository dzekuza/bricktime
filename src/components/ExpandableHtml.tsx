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

const BLOCK_TAG_RE = /<(p|ul|ol|li|br)\b/i

// Descriptions pasted as plain text rely on newlines for paragraphs, which HTML collapses.
function toParagraphs(html: string) {
  if (BLOCK_TAG_RE.test(html)) return html
  return html
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join("")
}

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

  const sanitized = DOMPurify.sanitize(toParagraphs(html), { ALLOWED_TAGS })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [sanitized])

  return (
    <div>
      <div
        ref={ref}
        className={cn("rich-text", className, !expanded && "line-clamp-5")}
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
