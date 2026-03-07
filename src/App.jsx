// ============================================================
// Path: menubloc-frontend/src/App.jsx
// File: App.jsx
// Date: 2026-03-06
// Purpose:
//   Domain-aware routing:
//     - easymenuupload.com -> EasyMenuLanding on "/"
//     - grubbid.com (and everything else) -> GrubbidDiscovery on "/"
//
//   Routing cleanup:
//   - Canonical restaurant public page: /restaurants/:id
//   - Back-compat redirect: /restaurant/:id -> /restaurants/:id
//
//   QR admin route added 2026-03-06:
//   - /restaurants/:id/qr-codes -> QrCodesPage (admin/owner surface)
//
//   Analytics route tracking:
//   - Sends GA4 page_path updates on client-side route changes
// ============================================================

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";

import GrubbidDiscovery from "./pages/GrubbidDiscovery.jsx";
import GrubbidSearchResults from "./pages/GrubbidSearchResults.jsx";

import RestaurantSignup from "./pages/RestaurantSignup.jsx";
import RestaurantProfile from "./pages/RestaurantProfile.jsx"; // owner/admin profile (private)
import RestaurantPublicPage from "./pages/RestaurantPublicPage.jsx"; // public restaurant page

import MenuPage from "./pages/MenuPage.jsx";
import MenuDetailPage from "./pages/MenuDetailPage.jsx";
import MenuItemDetailPage from "./pages/MenuItemDetailPage.jsx";
import PublicMenuPage from "./pages/PublicMenuPage.jsx";

import DealsPage from "./pages/DealsPage.jsx";

import ClaimVerify from "./pages/ClaimVerify.jsx";
import EasyMenuLanding from "./pages/EasyMenuLanding.jsx";
import SubscriptionSelect from "./pages/SubscriptionSelect.jsx";
import Terms from "./pages/Terms.jsx";

import QrCodesPage from "./pages/QrCodesPage.jsx";

function isEasyMenuHost() {
  const host = (window?.location?.hostname || "").toLowerCase();
  return host === "easymenuupload.com" || host === "www.easymenuupload.com";
}

/**
 * Back-compat redirect for old singular route.
 * /restaurant/:id  ->  /restaurants/:id
 */
function RestaurantSingularRedirect() {
  const { id } = useParams();
  return <Navigate to={id ? `/restaurants/${id}` : "/restaurants"} replace />;
}

/**
 * GA4 client-side route tracking for the React SPA.
 * Safe no-op if gtag has not been loaded yet.
 */
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    const page_path = `${location.pathname}${location.search || ""}${location.hash || ""}`;

    window.gtag("config", "G-KLLBC4W5XH", {
      page_path,
    });
  }, [location]);

  return null;
}

export default function App() {
  const easyMenu = isEasyMenuHost();

  return (
    <BrowserRouter>
      <AnalyticsTracker />

      <Routes>
        {/* Root route depends on domain */}
        <Route path="/" element={easyMenu ? <EasyMenuLanding /> : <GrubbidDiscovery />} />

        {/* Search */}
        <Route path="/search" element={<GrubbidSearchResults />} />

        {/* Deals */}
        <Route path="/deals" element={<DealsPage />} />

        {/* QR admin — must come before /restaurants/:id to match correctly */}
        <Route path="/restaurants/:id/qr-codes" element={<QrCodesPage />} />

        {/* Restaurant public page (CANONICAL) */}
        <Route path="/restaurants/:id" element={<RestaurantPublicPage />} />

        {/* Back-compat: singular -> plural */}
        <Route path="/restaurant/:id" element={<RestaurantSingularRedirect />} />

        {/* Private/owner profile screen */}
        <Route path="/restaurant-profile/:id" element={<RestaurantProfile />} />

        {/* Restaurant signup — canonical + short alias */}
        <Route path="/restaurant/signup" element={<RestaurantSignup />} />
        <Route path="/signup" element={<RestaurantSignup />} />

        {/* Subscription selection (step after restaurant detail) */}
        <Route path="/restaurant/subscription" element={<SubscriptionSelect />} />

        {/* Terms of Service */}
        <Route path="/terms" element={<Terms />} />

        {/* Menus */}
        <Route path="/menus" element={<MenuPage />} />
        <Route path="/menus/:id" element={<MenuDetailPage />} />
        <Route path="/public/restaurants/:id/menu" element={<PublicMenuPage />} />
        <Route path="/menu-items/:id" element={<MenuItemDetailPage />} />

        {/* Claim verify */}
        <Route path="/claim/verify" element={<ClaimVerify />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}