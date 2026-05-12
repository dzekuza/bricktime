import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from '@/pages/Home'
import Archive from '@/pages/Archive'
import Account from '@/pages/Account'
import Subscribe from '@/pages/Subscribe'
import Checkout from '@/pages/Checkout'
import Community from '@/pages/Community'
import Drop from '@/pages/Drop'
import UserProfile from '@/pages/UserProfile'
import LoadingScreen from '@/components/LoadingScreen'

export default function App() {
  const [loaded, setLoaded] = useState(() => window.location.pathname !== '/')
  const handleDone = useCallback(() => setLoaded(true), [])
  const location = useLocation()

  // If user navigates away from '/' before the loading screen finishes, dismiss it immediately
  useEffect(() => {
    if (location.pathname !== '/') setLoaded(true)
  }, [location.pathname])

  return (
    <>
      {!loaded && <LoadingScreen onDone={handleDone} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/account" element={<Account />} />
        <Route path="/community" element={<Community />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/drop/:id" element={<Drop />} />
        <Route path="/profile/:userId" element={<UserProfile />} />
      </Routes>
    </>
  )
}
