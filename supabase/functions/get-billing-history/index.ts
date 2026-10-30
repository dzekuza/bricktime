import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const unauthorized = () =>
  new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

const SUBSCRIPTION_LINE = /^(\d+) × (.+) \(at (.+?) \/ (month|year)\)$/
const REMAINING_TIME_LINE = /^Remaining time on (.+) after /

// Stripe writes invoice line descriptions in English. A plan swap produces
// "Unused time on X" (a credit) and "Remaining time on Y" (the charge) lines,
// and the invoice total is their net, so describing it by its first line would
// pair a credit's name with the net amount.
function describeInvoice(inv: Stripe.Invoice): string {
  const lines = inv.lines.data
  if (lines.some((line) => line.proration)) {
    const target = lines
      .map((line) => line.description?.match(REMAINING_TIME_LINE)?.[1])
      .find(Boolean)
    return target
      ? `Prenumeratos keitimas · ${target}`
      : "Prenumeratos keitimas"
  }

  const first = lines[0]?.description
  if (!first) return inv.id
  const match = first.match(SUBSCRIPTION_LINE)
  if (!match) return first
  const [, quantity, name, price, interval] = match
  const period = interval === "month" ? "mėn." : "m."
  const prefix = quantity === "1" ? "" : `${quantity} × `
  return `${prefix}${name} · ${price} / ${period}`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Identity comes from the caller's token, never from the request body.
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return unauthorized()
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: authData } = await userClient.auth.getUser()
    if (!authData.user) return unauthorized()
    const userId = authData.user.id
    const userEmail = authData.user.email

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Older checkouts created a new Stripe customer each time, so history spans
    // the stored customer plus every customer sharing the account email.
    const customerIds = new Set<string>()

    if (userId) {
      const { data: subscriber } = await supabase
        .from("subscribers")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle()
      if (subscriber?.stripe_customer_id) {
        customerIds.add(subscriber.stripe_customer_id)
      }
    }

    // Email matching only for a confirmed address, so an unverified sign-up
    // cannot pull in another person's customers.
    if (userEmail && authData.user.email_confirmed_at) {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 10,
      })
      for (const customer of customers.data) customerIds.add(customer.id)
    }

    if (customerIds.size === 0) {
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const lists = await Promise.all(
      [...customerIds].map((customer) =>
        stripe.invoices.list({ customer, limit: 24, status: "paid" })
      )
    )
    const invoices = {
      data: lists
        .flatMap((list) => list.data)
        .sort((a, b) => b.created - a.created)
        .slice(0, 24),
    }

    const result = invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid / 100,
      currency: inv.currency,
      description: describeInvoice(inv),
      date: inv.created,
      status: inv.status,
      pdf: inv.invoice_pdf,
    }))

    return new Response(JSON.stringify({ invoices: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
