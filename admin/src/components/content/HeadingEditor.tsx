import { useRef } from "react"
import { HighlighterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { parseHeadingMarkup } from "@/lib/heading-markup"

interface HeadingEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}

// Editor for admin-managed headings: free-text with line breaks, and a button
// to wrap the current text selection in "==...==" to mark it as highlighted
// (rendered on the storefront as the brand-yellow sticky-note span).
export function HeadingEditor({
  label,
  value,
  onChange,
  rows = 3,
}: HeadingEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function toggleHighlight() {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart, selectionEnd } = el
    if (selectionStart === selectionEnd) return

    const before = value.slice(0, selectionStart)
    const selected = value.slice(selectionStart, selectionEnd)
    const after = value.slice(selectionEnd)

    if (
      selected.startsWith("==") &&
      selected.endsWith("==") &&
      selected.length >= 4
    ) {
      onChange(before + selected.slice(2, -2) + after)
      return
    }
    onChange(`${before}==${selected}==${after}`)
  }

  const lines = parseHeadingMarkup(value)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleHighlight}
        >
          <HighlighterIcon className="mr-1.5 size-3.5" />
          Highlight selection
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Select text above and click "Highlight selection" to mark it with the
        brand-yellow style. Press Enter for a line break.
      </p>
      <div className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
        {lines.map((line, i) => (
          <div key={i}>
            {line.length === 0 ? (
              <>&nbsp;</>
            ) : (
              line.map((seg, j) =>
                seg.highlighted ? (
                  <span
                    key={j}
                    className="rounded border border-foreground/20 bg-yellow-300/70 px-1 font-semibold text-foreground dark:bg-yellow-400/30"
                  >
                    {seg.text}
                  </span>
                ) : (
                  <span key={j}>{seg.text}</span>
                )
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
