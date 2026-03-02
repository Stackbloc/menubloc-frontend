// menubloc-frontend/src/App.jsx
/**
 * ============================================================
 * File: menubloc-frontend/src/App.jsx
 * Purpose:
 *   Domain-aware routing:
 *     - easymenuupload.com -> EasyMenuLanding on "/"
 *     - grubbid.com (and everything else) -> GrubbidDiscovery on "/"
 *
 * Routing cleanup:
 *   - Canonical restaurant public page: /restaurants/:id
 *   - Back-compat redirect: /restaurant/:id -> /restaurants/:id
 * ============================================================
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

import GrubbidDiscovery from "./pages/GrubbidDiscovery.jsx";
import GrubbidSearchResults from "./pages/GrubbidSearchResults.jsx";

import RestaurantSignup from "./pages/RestaurantSignup.jsx";
import RestaurantProfile from "./pages/RestaurantProfile.jsx"; // owner/admin profile (private)
import RestaurantPublicPage from "./pages/RestaurantPublicPage.jsx"; // public restaurant page

import MenuPage from "./pages/MenuPage.jsx";
import MenuDetailPage from "./pages/MenuDetailPage.jsx";
import MenuItemDetailPage from "./pages/MenuItemDetailPage.jsx";

import DealsPage from "./pages/DealsPage.jsx";

import ClaimVerify from "./pages/ClaimVerify.jsx";
import EasyMenuLanding from "./pages/EasyMenuLanding.jsx";

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

export default function App() {
  const easyMenu = isEasyMenuHost();

  return (
    <BrowserRouter>
      <Routes>
        {/* Root route depends on domain */}
        <Route path="/" element={easyMenu ? <EasyMenuLanding /> : <GrubbidDiscovery />} />

        {/* Search */}
        <Route path="/search" element={<GrubbidSearchResults />} />

        {/* Deals */}
        <Route path="/deals" element={<DealsPage />} />

        {/* Restaurant public page (CANONICAL) ✅ FIXED */}
        <Route path="/restaurants/:id" element={<RestaurantPublicPage />} />

        {/* Back-compat: singular -> plural */}
        <Route path="/restaurant/:id" element={<RestaurantSingularRedirect />} />

        {/* Private/owner profile screen */}
        <Route path="/restaurant-profile/:id" element={<RestaurantProfile />} />

        {/* Restaurant signup */}
        <Route path="/restaurant/signup" element={<RestaurantSignup />} />

        {/* Menus */}
        <Route path="/menus" element={<MenuPage />} />
        <Route path="/menus/:id" element={<MenuDetailPage />} />
        <Route path="/menu-items/:id" element={<MenuItemDetailPage />} />

        {/* Claim verify */}
        <Route path="/claim/verify" element={<ClaimVerify />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}