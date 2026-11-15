import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { getVatTaxRateId } from "../_shared/vat.ts"

// Opens a Stripe Checkout for the one-off courier fee of a rental. The rental
// itself is created by stripe-webhook (record_paid_courier_rental) once the
// fee is paid, so an unpaid session never holds budget or stock.

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
})

const COURIER_FEE_CENTS = 300
// Stripe's shortest allowed session lifetime: a short window keeps the
// webhook's re-check close to the dry run done here.
const SESSION_TTL_MINUTES = 30

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

// subscribers.stripe_customer_id was once member-writable, so only reuse it
// when Stripe confirms the customer belongs to the caller's email.
async function getOwnedCustomerId(
  customerId: string | null,
  userEmail: string | undefined
) {
  if (!customerId || !userEmail) return null
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return null
    return customer.email?.toLowerCase() === userEmail.toLowerCase()
      ? customer.id
      : null
  } catch (err) {
    if ((err as { code?: string } | null)?.code === "resource_missing") {
      return null
    }
    throw err
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json(401, { error: "Unauthorized" })

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser()
    if (!caller) return json(401, { error: "Unauthorized" })

    const { productId, successUrl, cancelUrl } = await req.json()
    const product = Number(productId)
    if (!Number.isSafeInteger(product) || product <= 0) {
      return json(400, { error: "Unknown product" })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .select("plan, home_delivery, stripe_customer_id")
      .eq("id", caller.id)
      .maybeSingle()
    if (subscriberError) {
      console.error("create-rental-courier-checkout: subscriber lookup", {
        userId: caller.id,
        error: subscriberError.message,
      })
      return json(500, { error: "Failed to load subscription" })
    }
    // Door delivery already on the plan is rented without a fee; paying here
    // would charge for it twice.
    if (subscriber?.plan === "mega" || subscriber?.home_delivery) {
      return json(400, { error: "Courier delivery is already in the plan" })
    }

    // Same checks the rental insert runs, so a payment is never taken for a
    // rental that would be refused. The webhook runs them again for real.
    const { error: checkError } = await supabase.rpc(
      "record_paid_courier_rental",
      {
        p_subscriber_id: caller.id,
        p_product_id: product,
        p_stripe_session_id: null,
        p_amount: COURIER_FEE_CENTS / 100,
        p_dry_run: true,
      }
    )
    if (checkError) return json(400, { error: checkError.message })

    const customerId = await getOwnedCustomerId(
      subscriber?.stripe_customer_id ?? null,
      caller.email
    )
    const vatTaxRateId = await getVatTaxRateId(stripe)

    const session = await stripe.checkout.sessions.create({
      expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_MINUTES * 60,
      mode: "payment",
      // Keeps the customer's invoice language Lithuanian (see create-checkout).
      locale: "lt",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Pristatymas kurjeriu iki durų" },
            unit_amount: COURIER_FEE_CENTS,
          },
          quantity: 1,
          tax_rates: [vatTaxRateId],
        },
      ],
      // The rental is created when the webhook sees the payment; a delayed
      // method would leave the member waiting days for a set they claimed.
      payment_method_types: ["card"],
      // Reusing the subscription's customer puts this invoice in the same
      // billing history (get-billing-history lists invoices per customer).
      ...(customerId
        ? { customer: customerId }
        : { customer_email: caller.email ?? undefined }),
      invoice_creation: { enabled: true },
      client_reference_id: caller.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: "rental_courier",
        userId: caller.id,
        productId: String(product),
      },
    })

    return json(200, { url: session.url })
  } catch (err) {
    return json(400, { error: (err as Error).message })
  }
})
