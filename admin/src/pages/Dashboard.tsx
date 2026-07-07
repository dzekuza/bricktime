import { useState, useEffect } from 'react'
import { PackageIcon, UsersIcon, CreditCardIcon, TrendingUpIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabaseAdmin } from '@/lib/supabase'

const PLAN_PRICES: Record<string, number> = { nano: 7, mini: 12, standard: 19, pro: 28, mega: 49 }

interface Stat {
  label: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string }>
}

const recentActivity = [
  { text: 'Mailbox row added to catalogue', time: '2 hours ago', type: 'product' },
  { text: '48 new subscribers this week', time: '1 day ago', type: 'subscribers' },
  { text: 'Donut diner marked as sold out', time: '3 days ago', type: 'status' },
  { text: 'Pro plan price updated to €34/mo', time: '5 days ago', type: 'plan' },
  { text: 'Lander №7 received 14 new ratings', time: '1 week ago', type: 'rating' },
]

export function Dashboard() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Total Products', value: '—', change: '', icon: PackageIcon },
    { label: 'Active Subscribers', value: '—', change: '', icon: UsersIcon },
    { label: 'Monthly Revenue', value: '—', change: '', icon: CreditCardIcon },
    { label: 'Avg. Rating', value: '—', change: 'Across all sets', icon: TrendingUpIcon },
  ])

  useEffect(() => {
    async function load() {
      const [
        { count: productCount },
        { data: activeSubs },
        { data: ratedProducts },
      ] = await Promise.all([
        supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('subscribers').select('plan').eq('status', 'active'),
        supabaseAdmin.from('products').select('rating').not('rating', 'is', null),
      ])

      const mrr = (activeSubs ?? []).reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0)
      const ratings = (ratedProducts ?? [])
        .map((p) => parseFloat(p.rating ?? '0'))
        .filter((r) => r > 0)
      const avgRating = ratings.length
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
        : '—'

      setStats([
        { label: 'Total Products', value: String(productCount ?? 0), change: '', icon: PackageIcon },
        { label: 'Active Subscribers', value: (activeSubs?.length ?? 0).toLocaleString(), change: '', icon: UsersIcon },
        { label: 'Monthly Revenue', value: `€${mrr.toLocaleString()}`, change: '', icon: CreditCardIcon },
        { label: 'Avg. Rating', value: avgRating, change: 'Across all sets', icon: TrendingUpIcon },
      ])
    }
    load()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back. Here's what's happening.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across your catalogue and subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className="text-sm">{item.text}</span>
                <Badge variant="outline" className="shrink-0 text-xs font-normal text-muted-foreground">
                  {item.time}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
