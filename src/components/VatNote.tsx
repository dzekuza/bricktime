import { cn } from "@/lib/utils"

// Prices are stored gross; Stripe splits the 21% PVM out of them (see
// supabase/functions/_shared/vat.ts), so this note must stay true.
export function VatNote({ className }: { className?: string }) {
  return (
    <p className={cn("label-mono text-ink/50", className)}>
      Visos kainos nurodytos su PVM
    </p>
  )
}
