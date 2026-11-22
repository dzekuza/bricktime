import * as React from "react"

import { Input } from "@/components/ui/input"

type SearchInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "aria-label"
> & {
  /** Accessible name; a placeholder is not a label. */
  label: string
}

function SearchInput({ label, ...props }: SearchInputProps) {
  return <Input type="search" aria-label={label} {...props} />
}

export { SearchInput }
