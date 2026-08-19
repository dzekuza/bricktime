import { jsPDF } from "jspdf"

const INK: [number, number, number] = [0, 27, 33]
const PAPER: [number, number, number] = [255, 255, 255]
const CREAM: [number, number, number] = [245, 241, 235]
const INDIGO: [number, number, number] = [92, 74, 222]
const YELLOW: [number, number, number] = [255, 215, 49]
const ORANGE: [number, number, number] = [251, 73, 3]

function formatAmount(amountCents: number): string {
  return `${(amountCents / 100).toLocaleString("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function downloadGiftCardPdf({
  code,
  amountCents,
  recipientEmail,
  buyerEmail,
  expiresAt,
}: {
  code: string
  amountCents: number
  recipientEmail: string
  buyerEmail?: string
  expiresAt: Date
}) {
  const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "portrait" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 12
  const cardWidth = pageWidth - margin * 2
  let y = margin

  doc.setFillColor(...CREAM)
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(...INK)
  doc.text("BRICKTIME", pageWidth / 2, y + 4, { align: "center" })
  y += 14

  // Header block
  const headerHeight = 26
  doc.setFillColor(...INK)
  doc.roundedRect(margin, y, cardWidth, headerHeight, 4, 4, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...YELLOW)
  doc.text("DOVANŲ KUPONAS", pageWidth / 2, y + 9, { align: "center" })
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(...CREAM)
  doc.text("Tavo dovana atkeliavo!", pageWidth / 2, y + 19, {
    align: "center",
  })
  y += headerHeight + 6

  // Amount block
  const amountHeight = 40
  doc.setFillColor(...INDIGO)
  doc.roundedRect(margin, y, cardWidth, amountHeight, 4, 4, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(245, 241, 235)
  doc.text("BRICKTIME DOVANŲ KUPONAS", pageWidth / 2, y + 9, {
    align: "center",
  })
  doc.setFont("helvetica", "bold")
  doc.setFontSize(28)
  doc.setTextColor(...PAPER)
  doc.text(formatAmount(amountCents), pageWidth / 2, y + 22, {
    align: "center",
  })
  const codeWidth = doc.getTextWidth(code) + 16
  doc.setFillColor(...CREAM)
  doc.roundedRect(
    pageWidth / 2 - codeWidth / 2,
    y + 27,
    codeWidth,
    10,
    5,
    5,
    "F"
  )
  doc.setFont("courier", "bold")
  doc.setFontSize(13)
  doc.setTextColor(...INK)
  doc.text(code, pageWidth / 2, y + 34, { align: "center" })
  y += amountHeight + 10

  // Purchase info
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(0, 27, 33)
  doc.text("PIRKIMO INFORMACIJA", margin, y)
  y += 5

  const rows: [string, string][] = [
    ["Suma", formatAmount(amountCents)],
    ...(buyerEmail ? ([["Pirkėjas", buyerEmail]] as [string, string][]) : []),
    ["Gavėjas", recipientEmail],
    ["Galioja iki", formatDate(expiresAt)],
  ]

  rows.forEach(([label, value], i) => {
    doc.setDrawColor(0, 27, 33)
    doc.setLineWidth(0.2)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(margin, y, margin + cardWidth, y)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(0, 27, 33)
    doc.text(label, margin, y + 6)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...(label === "Galioja iki" ? ORANGE : INK))
    doc.text(value, margin + cardWidth, y + 6, { align: "right" })
    y += 10
    if (i === rows.length - 1) {
      doc.setLineDashPattern([], 0)
      doc.line(margin, y, margin + cardWidth, y)
    }
  })
  y += 8

  // Quote
  doc.setFont("helvetica", "italic")
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  const quote = doc.splitTextToSize(
    "„Linkiu smagaus konstravimo - mėgaukis kiekviena detale!“",
    cardWidth - 8
  )
  doc.text(quote, margin + 4, y + 6)
  y += quote.length * 5 + 12

  // Instructions footer
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(0, 27, 33)
  const instructions = doc.splitTextToSize(
    "Prisijunk arba susikurk paskyrą • Atsiskaitydamas įvesk dovanų kupono kodą • Kupono vertė bus automatiškai pritaikyta atsiskaitant už prenumeratą",
    cardWidth
  )
  doc.text(instructions, pageWidth / 2, y, { align: "center" })

  doc.save(`bricktime-dovanu-kuponas-${code}.pdf`)
}
