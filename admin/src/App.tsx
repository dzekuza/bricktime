import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { RequireAuth } from '@/components/RequireAuth'
import { AppLayout } from '@/components/AppLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Products } from '@/pages/Products'
import { Subscribers } from '@/pages/Subscribers'
import { Plans } from '@/pages/Plans'
import { Orders } from '@/pages/Orders'
import { Coupons } from '@/pages/Coupons'
import { MissingParts } from '@/pages/MissingParts'
import { Merch } from '@/pages/Merch'
import { GiftCards } from '@/pages/GiftCards'
import { Settings } from '@/pages/Settings'

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/subscribers" element={<Subscribers />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/missing-parts" element={<MissingParts />} />
              <Route path="/merch" element={<Merch />} />
              <Route path="/gift-cards" element={<GiftCards />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  )
}
