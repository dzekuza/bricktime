import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  PackageIcon,
  SearchIcon,
  ShirtIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Command,
} from "@/components/ui/command"
import { useGlobalSearch } from "@/hooks/use-global-search"
import type { SearchHit, SearchKind } from "@/lib/global-search"

const GROUPS: Array<{ kind: SearchKind; label: string; icon: LucideIcon }> = [
  { kind: "order", label: "Nuomos užsakymai", icon: TruckIcon },
  { kind: "merchOrder", label: "Merch užsakymai", icon: ShoppingBagIcon },
  { kind: "subscriber", label: "Klientai", icon: UserIcon },
  { kind: "product", label: "Rinkiniai", icon: PackageIcon },
  { kind: "merchItem", label: "Merch prekės", icon: ShirtIcon },
]

export function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { hits, isLoading, isActive } = useGlobalSearch(query)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setQuery("")
  }

  const handleSelect = (hit: SearchHit) => {
    handleOpenChange(false)
    navigate(hit.to)
  }

  const emptyText = !isActive
    ? "Įveskite bent 2 simbolius"
    : isLoading
      ? "Ieškoma…"
      : "Nieko nerasta"

  return (
    <>
      <Button
        variant="outline"
        className="ml-auto w-full max-w-xs justify-start gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
        aria-label="Visuotinė paieška"
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left">Ieškoti…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-xs sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Visuotinė paieška"
        description="Ieškokite užsakymų, klientų, rinkinių ir merch prekių"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Užsakymas, klientas, el. paštas, sekimo nr., rinkinys…"
          />
          <CommandList>
            {hits.length === 0 && <CommandEmpty>{emptyText}</CommandEmpty>}
            {GROUPS.map(({ kind, label, icon: Icon }) => {
              const groupHits = hits.filter((h) => h.kind === kind)
              if (groupHits.length === 0) return null
              return (
                <CommandGroup key={kind} heading={label}>
                  {groupHits.map((hit) => (
                    <CommandItem
                      key={`${kind}-${hit.id}`}
                      value={`${kind}-${hit.id}`}
                      onSelect={() => handleSelect(hit)}
                    >
                      <Icon />
                      <span className="truncate">{hit.title}</span>
                      <span className="ml-auto truncate text-xs text-muted-foreground">
                        {hit.subtitle}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
