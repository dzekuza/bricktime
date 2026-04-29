import { Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Archive from '@/pages/Archive'
import Drop from '@/pages/Drop'
import Plans from '@/pages/Plans'
import Account from '@/pages/Account'
import Subscribe from '@/pages/Subscribe'
import Checkout from '@/pages/Checkout'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/archive" element={<Archive />} />
      <Route path="/drop/:num" element={<Drop />} />
      <Route path="/drop" element={<Drop />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/account" element={<Account />} />
      <Route path="/subscribe" element={<Subscribe />} />
      <Route path="/checkout" element={<Checkout />} />
    </Routes>
  )
}
