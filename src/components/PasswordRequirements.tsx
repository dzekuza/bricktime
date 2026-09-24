import { CheckIcon, CircleIcon } from "lucide-react"
import { PASSWORD_RULES } from "@/lib/password-rules"

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1" aria-label="Slaptažodžio reikalavimai">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password)
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 font-mono text-[11px] transition-colors ${passed ? "text-green-600" : "text-ink/40"}`}
          >
            {passed ? (
              <CheckIcon className="size-3" />
            ) : (
              <CircleIcon className="size-3" />
            )}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
