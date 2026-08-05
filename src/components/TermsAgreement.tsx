import { Link } from "react-router-dom"
import { Checkbox } from "@/components/ui/checkbox"

interface TermsAgreementProps {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

export function TermsAgreement({
  id,
  checked,
  onCheckedChange,
  className,
}: TermsAgreementProps) {
  return (
    <div
      className={`flex items-start gap-2.5 text-[13px] leading-[1.5] text-ink/60 ${className ?? ""}`}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
      />
      <span>
        <label htmlFor={id} className="cursor-pointer">
          Susipažinau ir sutinku su{" "}
        </label>
        <Link
          to="/parduotuves-taisykles"
          className="font-semibold text-ink underline underline-offset-2 hover:text-brand-orange"
        >
          parduotuvės taisyklėmis
        </Link>
      </span>
    </div>
  )
}
