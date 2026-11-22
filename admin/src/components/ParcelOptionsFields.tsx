import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PARCEL_SIZES, type ParcelSize } from "@/lib/lpexpress"

interface ParcelOptionsFieldsProps {
  homeDelivery: boolean
  size: ParcelSize
  onSizeChange: (size: ParcelSize) => void
  weightKg: string
  onWeightKgChange: (weightKg: string) => void
  courierPickup: boolean
  onCourierPickupChange: (courierPickup: boolean) => void
}

/** LP sizes lockers by slot (XS–XL) and couriers by weight, so show only the one that applies. */
export function ParcelOptionsFields({
  homeDelivery,
  size,
  onSizeChange,
  weightKg,
  onWeightKgChange,
  courierPickup,
  onCourierPickupChange,
}: ParcelOptionsFieldsProps) {
  if (homeDelivery) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parcel-weight">Weight (kg)</Label>
        <Input
          id="parcel-weight"
          type="number"
          min="0.1"
          max="30"
          step="0.1"
          value={weightKg}
          onChange={(e) => onWeightKgChange(e.target.value)}
          className="h-9"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="parcel-pickup">LP courier collects from us</Label>
        <Switch
          id="parcel-pickup"
          checked={courierPickup}
          onCheckedChange={onCourierPickupChange}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Locker slot size</Label>
        <Select
          value={size}
          onValueChange={(v) => onSizeChange(v as ParcelSize)}
        >
          <SelectTrigger aria-label="Parcel size" className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PARCEL_SIZES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
