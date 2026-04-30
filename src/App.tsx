import { useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Archive from '@/pages/Archive'
import Plans from '@/pages/Plans'
import Account from '@/pages/Account'
import Subscribe from '@/pages/Subscribe'
import Checkout from '@/pages/Checkout'
import LoadingScreen from '@/components/LoadingScreen'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const handleDone = useCallback(() => setLoaded(true), [])

  return (
    <>
      {!loaded && <LoadingScreen onDone={handleDone} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/account" element={<Account />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </>
  )
}
