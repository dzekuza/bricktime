// Lightweight markup for admin-editable headings: "==text==" marks a highlighted
// span (rendered with the brand-yellow sticky-note style), "\n" is a line break.
export interface HeadingSegment {
  text: string
  highlighted: boolean
}

export type HeadingLine = HeadingSegment[]

export function parseHeadingMarkup(markup: string): HeadingLine[] {
  return markup.split("\n").map((line) => {
    const segments: HeadingSegment[] = []
    const regex = /==(.+?)==/g
    let lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(line))) {
      if (match.index > lastIndex) {
        segments.push({
          text: line.slice(lastIndex, match.index),
          highlighted: false,
        })
      }
      segments.push({ text: match[1], highlighted: true })
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < line.length) {
      segments.push({ text: line.slice(lastIndex), highlighted: false })
    }
    return segments
  })
}
