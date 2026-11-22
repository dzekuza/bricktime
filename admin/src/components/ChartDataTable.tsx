interface ChartDataColumn {
  key: string
  label: string
}

interface ChartDataTableProps {
  caption: string
  columns: ChartDataColumn[]
  rows: Record<string, string | number>[]
}

/** Screen-reader alternative for a chart; the chart itself is aria-hidden. */
export function ChartDataTable({
  caption,
  columns,
  rows,
}: ChartDataTableProps) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <td key={c.key}>{row[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
