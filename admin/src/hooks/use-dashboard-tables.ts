import { useEffect, useState } from "react"

import type { OrderStatus } from "@/data/orders"
import type { Plan, SubscriberStatus } from "@/data/subscribers"
import { fetchPlanPrices } from "@/lib/plan-prices"
import { supabase } from "@/lib/supabase"

const RECENT_LIMIT = 5

export interface RecentOrder {
  id: string
  customer: string
  product: string
  status: OrderStatus
  dueDate: string
}

export interface RecentCustomer {
  id: string
  name: string
  email: string
  plan: Plan
  status: SubscriberStatus
  joinedAt: string
}

export interface PlanBreakdownRow {
  plan: Plan
  active: number
  paused: number
  monthlyRevenue: number
}

interface DashboardTables {
  loading: boolean
  orders: RecentOrder[]
  customers: RecentCustomer[]
  plans: PlanBreakdownRow[]
}

export function useDashboardTables(): DashboardTables {
  const [state, setState] = useState<DashboardTables>({
    loading: true,
    orders: [],
    customers: [],
    plans: [],
  })

  useEffect(() => {
    async function load() {
      const [{ data: orderRows }, { data: subRows }, prices] =
        await Promise.all([
          supabase
            .from("orders")
            .select("id, subscriber_id, product_id, status, due_date")
            .order("created_at", { ascending: false })
            .limit(RECENT_LIMIT),
          supabase
            .from("subscribers")
            .select("id, name, email, plan, status, joined_at")
            .order("joined_at", { ascending: false }),
          fetchPlanPrices(),
        ])

      const subs = subRows ?? []
      const subById = Object.fromEntries(subs.map((s) => [s.id, s]))

      const productIds = (orderRows ?? [])
        .map((o) => o.product_id)
        .filter((id): id is number => id !== null)
      const { data: productRows } = productIds.length
        ? await supabase.from("products").select("id, title").in("id", productIds)
        : { data: [] }
      const titleById = Object.fromEntries(
        (productRows ?? []).map((p) => [p.id, p.title])
      )

      const byPlan = new Map<Plan, PlanBreakdownRow>()
      for (const s of subs) {
        if (s.status !== "active" && s.status !== "paused") continue
        const plan = s.plan as Plan
        const row = byPlan.get(plan) ?? {
          plan,
          active: 0,
          paused: 0,
          monthlyRevenue: 0,
        }
        if (s.status === "active") {
          row.active += 1
          row.monthlyRevenue += prices[plan] ?? 0
        } else {
          row.paused += 1
        }
        byPlan.set(plan, row)
      }

      setState({
        loading: false,
        orders: (orderRows ?? []).map((o) => ({
          id: o.id,
          customer: subById[o.subscriber_id]?.name ?? o.subscriber_id,
          product:
            o.product_id === null
              ? "Mystery Box (no set yet)"
              : (titleById[o.product_id] ?? `Product #${o.product_id}`),
          status: o.status as OrderStatus,
          dueDate: o.due_date,
        })),
        customers: subs.slice(0, RECENT_LIMIT).map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          plan: s.plan as Plan,
          status: s.status as SubscriberStatus,
          joinedAt: s.joined_at,
        })),
        plans: [...byPlan.values()].sort(
          (a, b) => b.monthlyRevenue - a.monthlyRevenue
        ),
      })
    }
    void load()
  }, [])

  return state
}
