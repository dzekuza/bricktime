import { useState, useCallback, useEffect } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import Home from "@/pages/Home"
import Cart from "@/pages/Cart"
import { LegacyRedirect } from "@/components/LegacyRedirect"
import Archive from "@/pages/Archive"
import Account from "@/pages/Account"
import ResetPassword from "@/pages/ResetPassword"
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
import MerchThankYou from "@/pages/MerchThankYou"
import GiftCards from "@/pages/GiftCards"
import About from "@/pages/About"
import Contacts from "@/pages/Contacts"
import PrivacyPolicy from "@/pages/PrivacyPolicy"
import StoreRules from "@/pages/StoreRules"
import NotFound from "@/pages/NotFound"
import LoadingScreen from "@/components/LoadingScreen"
import CookieConsentBanner from "@/components/CookieConsentBanner"
import ComingSoonGate from "@/components/ComingSoonGate"
import { MysteryBoxIntroDialog } from "@/components/account/MysteryBoxIntroDialog"
import { useConsentContext } from "@/contexts/ConsentContext"
import { trackPageview } from "@/lib/analytics"
import { useDailyCheckin } from "@/hooks/useDailyCheckin"

export default function App() {
  const [loaded, setLoaded] = useState(() => window.location.pathname !== "/")
  const handleDone = useCallback(() => setLoaded(true), [])
  const location = useLocation()
  const { analyticsGranted } = useConsentContext()
  // Marks the member present for today on any page, not just Community —
  // the daily_checkin achievement is "visit Brick Time", not "visit Community".
  useDailyCheckin()

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
    <ComingSoonGate>
      {!loaded && <LoadingScreen onDone={handleDone} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rinkiniai" element={<Archive />} />
        <Route path="/paskyra" element={<Account />} />
        <Route path="/nustatyti-slaptazodi" element={<ResetPassword />} />
        <Route path="/bendruomene" element={<Community />} />
        <Route path="/prenumerata" element={<Subscribe />} />
        <Route path="/apmokejimas" element={<Checkout />} />
        <Route path="/rinkinys/:id" element={<Drop />} />
        <Route path="/profilis/:userId" element={<UserProfile />} />
        <Route path="/merch" element={<MerchPage />} />
        <Route path="/krepselis" element={<Cart />} />
        <Route path="/merch/krepselis" element={<LegacyRedirect to="/krepselis" />} />
        <Route path="/rinkiniai/krepselis" element={<LegacyRedirect to="/krepselis" />} />
        <Route path="/merch/aciu" element={<MerchThankYou />} />
        <Route path="/merch/:slug" element={<MerchDrop />} />
        <Route path="/dovanu-kuponas" element={<GiftCards />} />
        <Route path="/duk" element={<FAQPage />} />
        <Route path="/praleisti-pristabdyti" element={<PausePage />} />
        <Route path="/pristatymas" element={<ShippingPage />} />
        <Route path="/grazinimai" element={<ReturnsPage />} />
        <Route path="/apie" element={<About />} />
        <Route path="/kontaktai" element={<Contacts />} />
        <Route path="/privatumo-politika" element={<PrivacyPolicy />} />
        <Route path="/parduotuves-taisykles" element={<StoreRules />} />
        <Route path="/archive" element={<LegacyRedirect to="/rinkiniai" />} />
        <Route path="/account" element={<LegacyRedirect to="/paskyra" />} />
        <Route path="/community" element={<LegacyRedirect to="/bendruomene" />} />
        <Route path="/gift-cards" element={<LegacyRedirect to="/dovanu-kuponas" />} />
        <Route path="/subscribe" element={<LegacyRedirect to="/prenumerata" />} />
        <Route path="/checkout" element={<LegacyRedirect to="/apmokejimas" />} />
        <Route path="/drop/:id" element={<LegacyRedirect to="/rinkinys/:id" />} />
        <Route path="/profile/:userId" element={<LegacyRedirect to="/profilis/:userId" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <MysteryBoxIntroDialog />
      <CookieConsentBanner />
    </ComingSoonGate>
  )
}
