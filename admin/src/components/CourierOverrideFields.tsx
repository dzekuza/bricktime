import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { CourierAddress } from "@/lib/lpexpress"

interface CourierOverrideFieldsProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  address: CourierAddress
  onAddressChange: (address: CourierAddress) => void
}

/** Lets the admin send a locker order to the customer's door instead; asks for the address LP needs. */
export function CourierOverrideFields({
  enabled,
  onEnabledChange,
  address,
  onAddressChange,
}: CourierOverrideFieldsProps) {
  const set = (field: keyof CourierAddress) => (value: string) =>
    onAddressChange({ ...address, [field]: value })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="courier-override">Send by courier to the door</Label>
        <Switch
          id="courier-override"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>
      {enabled && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            aria-label="Street"
            placeholder="Street"
            value={address.street}
            onChange={(e) => set("street")(e.target.value)}
            className="col-span-2 h-9"
          />
          <Input
            aria-label="House number"
            placeholder="House no."
            value={address.building}
            onChange={(e) => set("building")(e.target.value)}
            className="h-9"
          />
          <Input
            aria-label="Flat"
            placeholder="Flat (optional)"
            value={address.flat}
            onChange={(e) => set("flat")(e.target.value)}
            className="h-9"
          />
          <Input
            aria-label="Postal code"
            placeholder="Postal code"
            value={address.postalCode}
            onChange={(e) => set("postalCode")(e.target.value)}
            className="h-9"
          />
          <Input
            aria-label="City"
            placeholder="City"
            value={address.locality}
            onChange={(e) => set("locality")(e.target.value)}
            className="h-9"
          />
        </div>
      )}
    </div>
  )
}
