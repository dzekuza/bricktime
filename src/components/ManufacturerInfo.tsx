import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const MANUFACTURER = {
  name: "LEGO System A/S",
  address: "Åstvej 1, DK-7190 Billund, Denmark",
  email: "product.compliance@lego.com",
  phone: "+45 79 50 60 70",
}

const rows = [
  { label: "Gamintojas", value: MANUFACTURER.name },
  { label: "Adresas", value: MANUFACTURER.address },
  {
    label: "El. paštas",
    value: MANUFACTURER.email,
    href: `mailto:${MANUFACTURER.email}`,
  },
  {
    label: "Tel.",
    value: MANUFACTURER.phone,
    href: `tel:${MANUFACTURER.phone.replace(/\s/g, "")}`,
  },
]

/** GPSR-required manufacturer details, shown on every LEGO® set page. */
export function ManufacturerInfo({ className }: { className?: string }) {
  return (
    <Accordion type="single" collapsible className={className}>
      <AccordionItem
        value="manufacturer"
        className="rounded-2xl border-2 border-ink/15 px-4"
      >
        <AccordionTrigger className="py-3.5 text-[14px] font-bold text-ink hover:no-underline">
          Gamintojas
        </AccordionTrigger>
        <AccordionContent>
          <dl className="flex flex-col gap-2 pb-3">
            {rows.map(({ label, value, href }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <dt className="label-mono text-[11px] text-ink/40">{label}</dt>
                <dd className="text-[13px] leading-[1.5] text-ink/75">
                  {href ? (
                    <a href={href} className="underline underline-offset-2">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
