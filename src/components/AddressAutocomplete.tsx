import { useEffect, useRef, useState } from "react"
import type { CountryCode } from "@/lib/countries"
import {
  isAddressSearchEnabled,
  searchAddresses,
  type AddressSuggestion,
} from "@/lib/geoapify"

const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 300

interface AddressAutocompleteProps {
  label: string
  value: string
  placeholder?: string
  country: CountryCode
  inputClassName: string
  onChange: (value: string) => void
  onSelect: (suggestion: AddressSuggestion) => void
}

/** Street input that suggests full addresses and fills the rest on pick. */
export function AddressAutocomplete({
  label,
  value,
  placeholder,
  country,
  inputClassName,
  onChange,
  onSelect,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const isTypingRef = useRef(false)

  useEffect(() => {
    const query = value.trim()
    if (
      !isAddressSearchEnabled ||
      !isTypingRef.current ||
      query.length < MIN_QUERY_LENGTH
    ) {
      setSuggestions([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchAddresses(query, country, controller.signal)
        .then((found) => {
          setSuggestions(found)
          setIsOpen(found.length > 0)
        })
        .catch((error: unknown) => {
          if ((error as Error).name !== "AbortError") {
            console.error("Address suggestions unavailable", error)
            setSuggestions([])
          }
        })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value, country])

  function pick(suggestion: AddressSuggestion) {
    isTypingRef.current = false
    setIsOpen(false)
    setSuggestions([])
    onSelect(suggestion)
  }

  return (
    <label className="relative block">
      <span className="label-mono mb-1 block text-ink/40">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          isTypingRef.current = true
          onChange(e.target.value)
        }}
        onFocus={() => setIsOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        className={inputClassName}
      />
      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border-2 border-ink bg-paper"
        >
          {suggestions.map((s) => (
            <li key={s.label} role="option" aria-selected="false">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className="w-full px-4 py-2.5 text-left font-mono text-[13px] text-ink hover:bg-cream"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  )
}
