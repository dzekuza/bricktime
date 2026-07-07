# LP EXPRESS (UNISEND) shipping integration

Server-side integration with the [LP EXPRESS / UNISEND API v2](https://www.post.lt/savitarna/api_doc.html).
All calls run in the `lpexpress` Edge Function — the OAuth token grants full account
access, so it must **never** touch the browser.

## What's included

| Piece | File |
|---|---|
| API client (auth, terminals, labels, tracking) | `supabase/functions/_shared/lpexpress.ts` |
| Edge Function router | `supabase/functions/lpexpress/index.ts` |
| Frontend client | `src/lib/lpexpress.ts` |
| Terminal (paštomatas) picker | `src/components/TerminalPicker.tsx` |
| Order columns | `supabase/migrations/20260707000001_lpexpress_shipping.sql` |
| Checkout wiring | `src/pages/Checkout.tsx` |

## Actions (POST body `{ action, ... }`)

- `terminals` `{ find?, countryCode? }` → list parcel lockers (public read)
- `tracking` `{ barcode, lang? }` → tracking events (public read)
- `create-label` `{ orderId, receiver, size?, weight? }` → creates the shipment + barcode (order owner only)
- `label-pdf` `{ orderId }` → label PDF as base64 (order owner only)
- `cancel` `{ orderId }` → cancels the shipment (order owner only)

## Setup

### 1. Get a UNISEND business account
You need API credentials (username + password). The **test** environment
(`api-manosiuntostst.post.lt`) mirrors production and has no consequences.

### 2. Set secrets
```bash
supabase secrets set \
  LP_API_BASE=https://api-manosiuntostst.post.lt \
  LP_USERNAME=... \
  LP_PASSWORD=... \
  LP_SENDER_NAME="BRICKTIME" \
  LP_SENDER_PHONE=+37060000000 \
  LP_SENDER_EMAIL=hi@bricktime.lt \
  LP_SENDER_LOCALITY=Vilnius \
  LP_SENDER_POSTCODE=03163 \
  LP_SENDER_STREET="J. Jasinskio g." \
  LP_SENDER_BUILDING=16 \
  LP_SENDER_COUNTRY=LT
```
Switch `LP_API_BASE` to `https://api-manosiuntos.post.lt` for production.
(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)

### 3. Apply the migration & deploy
```bash
supabase db push
supabase functions deploy lpexpress
```

## Flow

- **Checkout** — the customer picks a paštomatas (`TerminalPicker`); the terminal id/name
  is stored on the order (`lp_terminal_id`, `lp_terminal_name`).
- **Fulfillment** — call `create-label` for an order to create the real shipment and get a
  barcode, then `label-pdf` to print the sticker. (Wire this into the admin/fulfillment UI —
  it is intentionally **not** triggered automatically at €0 checkout to avoid creating real
  shipments prematurely.)
- **Tracking** — call `tracking` with the stored `lp_barcode` to show live status
  (LABEL_CREATED → ON_THE_WAY → PARCEL_DELIVERED, etc.) on the account/order pages.
- **Delivery activation** — the `lpexpress-sync` Edge Function polls tracking for every
  `processing` order with a barcode, persists `lp_tracking_state`, and flips the order to
  `active` once LP EXPRESS reports `PARCEL_DELIVERED` (replacing the manual "Mark as active"
  step). It runs on a 30-min `pg_cron` schedule (see
  `migrations/20260707193000_lpexpress_delivery_activation.sql`) and is also triggered when
  the admin Orders page loads / via its "Sync tracking" button.

### Enable delivery activation

```bash
supabase functions deploy lpexpress-sync
supabase db push
```

Then add the two Vault secrets the cron job reads (once per environment, in the SQL editor):

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<service-role-key>',                'service_role_key');
```
