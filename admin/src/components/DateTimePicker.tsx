import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  formatZoned,
  fromZonedParts,
  toZonedParts,
  type ZonedParts,
} from "@/lib/vilnius-time"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

// The calendar and time input work in the browser's own clock, so the Vilnius
// wall clock is mirrored onto a local Date purely for display and picking.
function toLocalMirror({ year, month, day, hour, minute }: ZonedParts): Date {
  return new Date(year, month - 1, day, hour, minute)
}

function fromLocalMirror(date: Date): ZonedParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  }
}

interface DateTimePickerProps {
  /** ISO timestamp, or null when unset. */
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const parts = value ? toZonedParts(value) : null
  const mirror = parts ? toLocalMirror(parts) : undefined

  // The clock defaults to midnight so picking a day alone still yields a
  // valid timestamp; the time input then edits that same date in place.
  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onChange(null)
      return
    }
    const picked = fromLocalMirror(day)
    onChange(
      fromZonedParts({
        ...picked,
        hour: parts?.hour ?? 0,
        minute: parts?.minute ?? 0,
      })
    )
  }

  function handleTimeChange(time: string) {
    const [hour, minute] = time.split(":").map(Number)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return
    const base = parts ?? fromLocalMirror(new Date())
    onChange(fromZonedParts({ ...base, hour, minute }))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground"
          data-empty={!value}
        >
          <CalendarIcon />
          {value ? formatZoned(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={mirror}
          onSelect={handleDaySelect}
          defaultMonth={mirror}
          captionLayout="dropdown"
          autoFocus
        />
        <div className="flex items-center gap-3 border-t p-3">
          <Label htmlFor="datetime-picker-time" className="text-xs">
            Time
          </Label>
          <Input
            id="datetime-picker-time"
            type="time"
            value={parts ? `${pad(parts.hour)}:${pad(parts.minute)}` : ""}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-auto"
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
            >
              Clear
            </Button>
          )}
        </div>
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
          Times are Vilnius (Europe/Vilnius).
        </p>
      </PopoverContent>
    </Popover>
  )
}
