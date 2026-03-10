// ============================================================
// File:    App.jsx
// Path:    menubloc-frontend/src/App.jsx
// Date:    2026-03-10
// Purpose:
//   Domain-aware routing:
//     - easymenuupload.com -> EasyMenuLanding on "/"
//     - grubbid.com (and everything else) -> GrubbidDiscovery on "/"
//
//   Routing cleanup:
//   - Canonical restaurant public page: /restaurants/:slugOrId
//   - Back-compat redirect: /restaurant/:slugOrId -> /restaurants/:slugOrId
//
//   QR admin route added 2026-03-06:
//   - /restaurants/:id/qr-codes -> QrCodesPage (admin/owner surface)
//
//   Design upgrade route added 2026-03-09:
//   - /restaurant/design-select -> MenuDesignSelectPage (onboarding step 4)
//
//   Analytics route tracking:
//   - Sends GA4 page_path updates on client-side route changes
// ============================================================

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";

import GrubbidDiscovery from "./pages/GrubbidDiscovery.jsx";
import GrubbidSearchResults from "./pages/GrubbidSearchResults.jsx";

import RestaurantSignup from "./pages/RestaurantSignup.jsx";
import ProfileSearchPage from "./pages/ProfileSearchPage.jsx";
import RestaurantProfile from "./pages/RestaurantProfile.jsx";
import RestaurantPublicPage from "./pages/RestaurantPublicPage.jsx";

import MenuPage from "./pages/MenuPage.jsx";
import MenuDetailPage from "./pages/MenuDetailPage.jsx";
import MenuItemDetailPage from "./pages/MenuItemDetailPage.jsx";
import PublicMenuPage from "./pages/PublicMenuPage.jsx";
import BrowseMenus from "./pages/BrowseMenus.jsx";

import DealsPage from "./pages/DealsPage.jsx";

import ClaimVerify from "./pages/ClaimVerify.jsx";
import EasyMenuLanding from "./pages/EasyMenuLanding.jsx";
import SubscriptionSelect from "./pages/SubscriptionSelect.jsx";
import MenuDesignSelectPage from "./pages/MenuDesignSelectPage.jsx";
import Terms from "./pages/Terms.jsx";

import QrCodesPage from "./pages/QrCodesPage.jsx";
import PdfUploadPage from "./pages/PdfUploadPage.jsx";
import SpreadsheetUploadPage from "./pages/SpreadsheetUploadPage.jsx";

function isEasyMenuHost() {
  const host = (window?.location?.hostname || "").toLowerCase();
  return host === "easymenuupload.com" || host === "www.easymenuupload.com";
}

/**
 * Back-compat redirect for old singular route.
 * /restaurant/:slugOrId  ->  /restaurants/:slugOrId
 */
function RestaurantSingularRedirect() {
  const { slugOrId } = useParams();
  return <Navigate to={slugOrId ? `/restaurants/${slugOrId}` : "/restaurants"} replace />;
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
        <Route path="/browse-menus" element={<BrowseMenus />} />

        {/* Deals */}
        <Route path="/deals" element={<DealsPage />} />

        {/* QR admin — keep id-based and before public restaurant route */}
        <Route path="/restaurants/:id/qr-codes" element={<QrCodesPage />} />

        {/* Restaurant public page (CANONICAL) */}
        <Route path="/restaurants/:slugOrId" element={<RestaurantPublicPage />} />

        {/* Back-compat: singular -> plural */}
        <Route path="/restaurant/:slugOrId" element={<RestaurantSingularRedirect />} />

        {/* Private/owner profile screen */}
        <Route path="/restaurant-profile/:id" element={<RestaurantProfile />} />

        {/* Restaurant signup — canonical + short alias */}
        <Route path="/restaurant/signup" element={<RestaurantSignup />} />
        <Route path="/signup" element={<RestaurantSignup />} />

        {/* Onboarding step 2: find existing listing or create new */}
        <Route path="/profilesearch" element={<ProfileSearchPage />} />

        {/* Onboarding step 3: subscription / plan selection */}
        <Route path="/restaurant/subscription" element={<SubscriptionSelect />} />

        {/* Onboarding step 4: design style selection (Adobe integration ready) */}
        <Route path="/restaurant/design-select" element={<MenuDesignSelectPage />} />

        {/* Terms of Service */}
        <Route path="/terms" element={<Terms />} />

        {/* Menu upload (onboarding step 5) */}
        <Route path="/restaurant/pdf-upload" element={<PdfUploadPage />} />
        <Route path="/restaurant/spreadsheet-upload" element={<SpreadsheetUploadPage />} />

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