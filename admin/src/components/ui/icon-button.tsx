import * as React from "react"

import { Button } from "@/components/ui/button"

type IconButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "aria-label" | "children"
> & {
  /** Accessible name. Include the row, e.g. "Delete coupon SUMMER10". */
  label: string
  children: React.ReactNode
}

function IconButton({
  label,
  size = "icon",
  variant = "ghost",
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button aria-label={label} size={size} variant={variant} {...props}>
      {children}
    </Button>
  )
}

export { IconButton }
