export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_RULES = [
  {
    id: "length",
    label: `Bent ${PASSWORD_MIN_LENGTH} simboliai`,
    test: (value: string) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "uppercase",
    label: "Didžioji raidė",
    test: (value: string) => /\p{Lu}/u.test(value),
  },
  {
    id: "lowercase",
    label: "Mažoji raidė",
    test: (value: string) => /\p{Ll}/u.test(value),
  },
  {
    id: "digit",
    label: "Skaitmuo",
    test: (value: string) => /\d/.test(value),
  },
  {
    id: "symbol",
    label: "Specialus simbolis (pvz. !@#$)",
    test: (value: string) => /[^\p{L}\d\s]/u.test(value),
  },
] as const

export function isStrongPassword(value: string) {
  return PASSWORD_RULES.every((rule) => rule.test(value))
}
