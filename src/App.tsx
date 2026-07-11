import { useState, useCallback, useEffect } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import Home from "@/pages/Home"
import Archive from "@/pages/Archive"
import Account from "@/pages/Account"
import Subscribe from "@/pages/Subscribe"
import Checkout from "@/pages/Checkout"
import Community from "@/pages/Community"
import Drop from "@/pages/Drop"
import UserProfile from "@/pages/UserProfile"
import {
  FAQPage,
  PausePage,
  ReturnsPage,
  ShippingPage,
} from "@/pages/HelpPages"
import MerchPage from "@/pages/Merch"
import MerchDrop from "@/pages/MerchDrop"
import GiftCards from "@/pages/GiftCards"
import About from "@/pages/About"
import PrivacyPolicy from "@/pages/PrivacyPolicy"
import LoadingScreen from "@/components/LoadingScreen"
import CookieConsentBanner from "@/components/CookieConsentBanner"
import { useConsentContext } from "@/contexts/ConsentContext"
import { trackPageview } from "@/lib/analytics"

export default function App() {
  const [loaded, setLoaded] = useState(() => window.location.pathname !== "/")
  const handleDone = useCallback(() => setLoaded(true), [])
  const location = useLocation()
  const { analyticsGranted } = useConsentContext()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [location.pathname, location.search])

  useEffect(() => {
    if (analyticsGranted) trackPageview(location.pathname)
  }, [location.pathname, analyticsGranted])

  // If user navigates away from '/' before the loading screen finishes, dismiss it immediately
  useEffect(() => {
    if (location.pathname !== "/") setLoaded(true)
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
        <Route path="/merch" element={<MerchPage />} />
        <Route path="/merch/:slug" element={<MerchDrop />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/duk" element={<FAQPage />} />
        <Route path="/praleisti-pristabdyti" element={<PausePage />} />
        <Route path="/pristatymas" element={<ShippingPage />} />
        <Route path="/grazinimai" element={<ReturnsPage />} />
        <Route path="/apie" element={<About />} />
        <Route path="/privatumo-politika" element={<PrivacyPolicy />} />
      </Routes>
      <CookieConsentBanner />
    </>
  )
}
