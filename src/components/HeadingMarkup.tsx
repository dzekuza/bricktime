import { Fragment, type CSSProperties, type Ref } from "react"
import { parseHeadingMarkup } from "@/lib/heading-markup"

interface HeadingMarkupProps {
  text: string
  highlightClassName: string
  highlightStyle?: CSSProperties
  highlightRef?: Ref<HTMLSpanElement>
  onHighlightMouseEnter?: () => void
  onHighlightMouseLeave?: () => void
}

// Renders admin-editable "==text==" / "\n" markup. Only the first highlighted
// span gets the ref/hover handlers — current content only ever has one.
export function HeadingMarkup({
  text,
  highlightClassName,
  highlightStyle,
  highlightRef,
  onHighlightMouseEnter,
  onHighlightMouseLeave,
}: HeadingMarkupProps) {
  const lines = parseHeadingMarkup(text)
  let highlightCount = 0

  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 && <br />}
          {line.map((seg, si) => {
            if (!seg.highlighted)
              return <Fragment key={si}>{seg.text}</Fragment>
            const isFirst = highlightCount === 0
            highlightCount++
            return (
              <span
                key={si}
                ref={isFirst ? highlightRef : undefined}
                className={highlightClassName}
                style={highlightStyle}
                onMouseEnter={isFirst ? onHighlightMouseEnter : undefined}
                onMouseLeave={isFirst ? onHighlightMouseLeave : undefined}
              >
                {seg.text}
              </span>
            )
          })}
        </Fragment>
      ))}
    </>
  )
}
