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
import { CartProvider } from "./context/CartContext.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import { OperatorProvider, useOperator } from "./context/OperatorContext.jsx";
import { OwnerProvider, useOwner } from "./context/OwnerContext.jsx";
import OperatorLogin from "./pages/operator/OperatorLogin.jsx";
import OperatorRecovery from "./pages/operator/OperatorRecovery.jsx";
import OperatorResetPassword from "./pages/operator/OperatorResetPassword.jsx";
import OperatorDashboard from "./pages/operator/OperatorDashboard.jsx";
import OperatorMenuEditor from "./pages/operator/OperatorMenuEditor.jsx";
import OperatorDealsEditor from "./pages/operator/OperatorDealsEditor.jsx";
import OperatorClaimSearch from "./pages/operator/OperatorClaimSearch.jsx";
import OperatorProfileEditor from "./pages/operator/OperatorProfileEditor.jsx";
import OperatorHoursEditor from "./pages/operator/OperatorHoursEditor.jsx";
import OperatorSubscription from "./pages/operator/OperatorSubscription.jsx";
import OperatorAdobeStudio from "./pages/operator/OperatorAdobeStudio.jsx";
import OperatorQrKitOrder from "./pages/operator/OperatorQrKitOrder.jsx";
import OperatorDisplaySettings from "./pages/operator/OperatorDisplaySettings.jsx";
import OwnerLogin from "./pages/owner/OwnerLogin.jsx";
import OwnerDashboard from "./pages/owner/OwnerDashboard.jsx";
import OwnerSiteAnalytics from "./pages/owner/OwnerSiteAnalytics.jsx";
import OwnerSearchAnalytics from "./pages/owner/OwnerSearchAnalytics.jsx";
import OwnerRestaurants from "./pages/owner/OwnerRestaurants.jsx";
import OwnerRevenue from "./pages/owner/OwnerRevenue.jsx";
import OwnerSupportTickets from "./pages/owner/OwnerSupportTickets.jsx";
import OwnerTicketDetail from "./pages/owner/OwnerTicketDetail.jsx";
import OperatorMenuStudio from "./pages/operator/OperatorMenuStudio.jsx";
import OperatorBrandSettings from "./pages/operator/OperatorBrandSettings.jsx";

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
import PublicMenuDisplayPage from "./pages/PublicMenuDisplayPage.jsx";
import BrowseMenus from "./pages/BrowseMenus.jsx";
import Top5HealthiestPage from "./pages/Top5HealthiestPage.jsx";
import TopPicksPage from "./pages/TopPicksPage.jsx";

import DealsPage from "./pages/DealsPage.jsx";

import ClaimVerify from "./pages/ClaimVerify.jsx";
import EasyMenuLanding from "./pages/EasyMenuLanding.jsx";
import SubscriptionSelect from "./pages/SubscriptionSelect.jsx";
import MenuDesignSelectPage from "./pages/MenuDesignSelectPage.jsx";
import Terms from "./pages/Terms.jsx";

import QrCodesPage from "./pages/QrCodesPage.jsx";
import PdfUploadPage from "./pages/PdfUploadPage.jsx";
import SpreadsheetUploadPage from "./pages/SpreadsheetUploadPage.jsx";
import FoodTruckPage from "./pages/FoodTruckPage.jsx";
import FoodTruckSchedulePage from "./pages/FoodTruckSchedulePage.jsx";
import FoodTruckSignup from "./pages/FoodTruckSignup.jsx";
import OperatorIntakePage from "./pages/menulibrarian_mobile.jsx";

/**
 * Protect operator routes — redirect to /operator/login if not authenticated.
 * Shows nothing while the session check is in flight.
 */
function OperatorRoute({ children }) {
  const { isAuthenticated, loading } = useOperator();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/operator/login" replace />;
  return children;
}

function OwnerRoute({ children }) {
  const { isAuthenticated, loading } = useOwner();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/owner/login" replace />;
  return children;
}

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
 * Back-compat redirect for renamed food truck route.
 * /trucks/:slugOrId  ->  /foodtrucks/:slugOrId
 */
function TruckRedirect() {
  const { slugOrId } = useParams();
  return <Navigate to={slugOrId ? `/foodtrucks/${slugOrId}` : "/"} replace />;
}

/**
 * GA4 client-side route tracking for the React SPA.
 * Safe no-op if gtag has not been loaded yet.
 */
function AnalyticsTracker() {
  const location = useLocation();
  const { operator } = useOperator();
  const { owner } = useOwner();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const page_path = `${location.pathname}${location.search || ""}${location.hash || ""}`;

    if (typeof window.gtag === "function") {
      window.gtag("config", "G-KLLBC4W5XH", { page_path });
    }

    const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
    const key = "grubbid.analytics.session_id";
    let sessionId = "";
    try {
      sessionId = String(window.sessionStorage.getItem(key) || "");
      if (!sessionId) {
        sessionId = typeof window.crypto?.randomUUID === "function"
          ? window.crypto.randomUUID()
          : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.sessionStorage.setItem(key, sessionId);
      }
    } catch {
      sessionId = "";
    }

    fetch(`${API}/api/analytics/page-visit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path: page_path,
        session_id: sessionId || null,
        user_id: owner?.id || operator?.id || null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        device_type: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop",
        metadata: {
          title: typeof document !== "undefined" ? document.title || null : null,
        },
      }),
    }).catch(() => {});
  }, [location, operator?.id, owner?.id]);

  return null;
}

export default function App() {
  const easyMenu = isEasyMenuHost();

  return (
    <OwnerProvider>
    <OperatorProvider>
    <CartProvider>
    <BrowserRouter>
      <AnalyticsTracker />
      <CartDrawer />

      <Routes>
        {/* Root route depends on domain */}
        <Route path="/" element={easyMenu ? <EasyMenuLanding /> : <GrubbidDiscovery />} />

        {/* Search */}
        <Route path="/search" element={<GrubbidSearchResults />} />
        <Route path="/browse-menus" element={<BrowseMenus />} />
        <Route path="/top-picks" element={<TopPicksPage />} />
        <Route path="/top5/healthiest" element={<TopPicksPage />} />

        {/* Deals */}
        <Route path="/deals" element={<DealsPage />} />

        {/* QR admin — keep id-based and before public restaurant route */}
        <Route path="/restaurants/:id/qr-codes" element={<QrCodesPage />} />

        {/* Food truck signup */}
        <Route path="/foodtruck/signup" element={<FoodTruckSignup />} />

        {/* Food truck public pages */}
        <Route path="/foodtrucks/:slugOrId/schedule" element={<FoodTruckSchedulePage />} />
        <Route path="/foodtrucks/:slugOrId" element={<FoodTruckPage />} />

        {/* Back-compat: old /trucks/:slugOrId -> /foodtrucks/:slugOrId */}
        <Route path="/trucks/:slugOrId" element={<TruckRedirect />} />

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
        <Route path="/public/restaurants/:id/display" element={<PublicMenuDisplayPage />} />
        <Route path="/restaurants/:restaurantSlug/menu-items/:id" element={<MenuItemDetailPage />} />
        <Route path="/menu-items/:id" element={<MenuItemDetailPage />} />

        {/* Operator intake — MenuLibrarianBot (smartphone paste flow) */}
        <Route path="/field/intake" element={<OperatorIntakePage />} />

        {/* Claim verify */}
        <Route path="/claim/verify" element={<ClaimVerify />} />

        {/* ── Operator backend portal ────────────────────────────── */}
        <Route path="/operator/login"        element={<OperatorLogin />} />
        <Route path="/operator/recover"      element={<OperatorRecovery />} />
        <Route path="/operator/reset-password" element={<OperatorResetPassword />} />
        <Route path="/operator/claim"        element={<OperatorRoute><OperatorClaimSearch /></OperatorRoute>} />
        <Route path="/operator"              element={<OperatorRoute><OperatorDashboard /></OperatorRoute>} />
        <Route path="/operator/profile"      element={<OperatorRoute><OperatorProfileEditor /></OperatorRoute>} />
        <Route path="/operator/menu"         element={<OperatorRoute><OperatorMenuEditor /></OperatorRoute>} />
        <Route path="/operator/design"       element={<OperatorRoute><OperatorAdobeStudio /></OperatorRoute>} />
        <Route path="/operator/deals"        element={<OperatorRoute><OperatorDealsEditor /></OperatorRoute>} />
        <Route path="/operator/hours"        element={<OperatorRoute><OperatorHoursEditor /></OperatorRoute>} />
        <Route path="/operator/qr-kits/order" element={<OperatorRoute><OperatorQrKitOrder /></OperatorRoute>} />
        <Route path="/operator/subscription" element={<OperatorRoute><OperatorSubscription /></OperatorRoute>} />
        <Route path="/operator/display-settings" element={<OperatorRoute><OperatorDisplaySettings /></OperatorRoute>} />

        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route path="/owner" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/analytics" element={<OwnerRoute><OwnerSiteAnalytics /></OwnerRoute>} />
        <Route path="/owner/search-analytics" element={<OwnerRoute><OwnerSearchAnalytics /></OwnerRoute>} />
        <Route path="/owner/restaurants" element={<OwnerRoute><OwnerRestaurants /></OwnerRoute>} />
        <Route path="/owner/revenue" element={<OwnerRoute><OwnerRevenue /></OwnerRoute>} />
        <Route path="/owner/support" element={<OwnerRoute><OwnerSupportTickets /></OwnerRoute>} />
        <Route path="/owner/support/:ticketId" element={<OwnerRoute><OwnerTicketDetail /></OwnerRoute>} />
        <Route path="/operator/menu-studio"      element={<OperatorRoute><OperatorMenuStudio /></OperatorRoute>} />
        <Route path="/operator/brand"            element={<OperatorRoute><OperatorBrandSettings /></OperatorRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </CartProvider>
    </OperatorProvider>
    </OwnerProvider>
  );
}
