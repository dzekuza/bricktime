// Badge label and colour per orders.status, shared by the current-rental
// cards and the rental history.
export const STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  active: { label: "Pas tave", className: "bg-brand-mint text-ink" },
  processing: { label: "Ruošiama", className: "bg-brand-sky text-ink" },
  overdue: { label: "Vėluoja", className: "bg-brand-orange text-paper" },
  return_requested: {
    label: "Grąžinimas prašomas",
    className: "bg-brand-yellow text-ink",
  },
  return_declined: {
    label: "Grąžinimas atsisakytas",
    className: "bg-brand-pink text-ink",
  },
  returned: { label: "Grąžinta", className: "bg-cream text-ink" },
}
