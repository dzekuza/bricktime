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

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function toTimeValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDisplay(date: Date) {
  return `${date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}, ${toTimeValue(date)}`
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
  const selected = value ? new Date(value) : undefined

  // The clock defaults to midnight so picking a day alone still yields a
  // valid timestamp; the time input then edits that same date in place.
  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onChange(null)
      return
    }
    const next = new Date(day)
    if (selected) {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0)
    } else {
      next.setHours(0, 0, 0, 0)
    }
    onChange(next.toISOString())
  }

  function handleTimeChange(time: string) {
    const [hours, minutes] = time.split(":").map(Number)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return
    const next = selected ? new Date(selected) : new Date()
    next.setHours(hours, minutes, 0, 0)
    onChange(next.toISOString())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground"
          data-empty={!selected}
        >
          <CalendarIcon />
          {selected ? formatDisplay(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          defaultMonth={selected}
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
            value={selected ? toTimeValue(selected) : ""}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-auto"
          />
          {selected && (
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
      </PopoverContent>
    </Popover>
  )
}
