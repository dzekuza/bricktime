import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The fluid display sizes (text-d-*) are custom classes. Without this, twMerge
// reads them as text colours and drops one when it sits next to text-ink.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["d-hero", "d-xl", "d-lg", "d-md", "d-sm", "d-xs"] },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
