// ============================================================
// File:    App.jsx
// Path:    menubloc-frontend/src/App.jsx
// Date:    2026-03-10
// Purpose:
//   Domain-aware routing:
//     - easymenuupload.com -> EasyMenuLanding on "/"
//     - crm.grubbid.com -> internal CRM shell
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
import { LanguageProvider } from "./context/LanguageContext.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import { OperatorProvider, useOperator } from "./context/OperatorContext.jsx";
import { OwnerProvider, useOwner } from "./context/OwnerContext.jsx";
import { CrmProvider, useCrm } from "./context/CrmContext.jsx";
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
import CrmDashboard from "./pages/crm/CrmDashboard.jsx";
import CrmLeadList from "./pages/crm/CrmLeadList.jsx";
import CrmLeadDetail from "./pages/crm/CrmLeadDetail.jsx";
import CrmTasks from "./pages/crm/CrmTasks.jsx";
import CrmReports from "./pages/crm/CrmReports.jsx";
import CrmLogin from "./pages/crm/CrmLogin.jsx";

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

function CrmRoute({ children }) {
  const { isAuthenticated, loading } = useCrm();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/crm/login" replace />;
  return children;
}

function CrmLegacyRedirect() {
  const location = useLocation();
  const nextPath = location.pathname.replace(/^\/admin\/crm/, "/crm") || "/crm";
  return <Navigate to={`${nextPath}${location.search || ""}${location.hash || ""}`} replace />;
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

function isCrmHost() {
  const host = (window?.location?.hostname || "").toLowerCase();
  return host === "crm.grubbid.com";
}

function CrmHostRoot() {
  const { isAuthenticated, loading } = useCrm();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? "/crm" : "/crm/login"} replace />;
}

function HostRouteRedirect({ to }) {
  return <Navigate to={to} replace />;
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

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

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

    if (GA_ID && typeof window.gtag === "function") {
      window.gtag("config", GA_ID, { page_path });
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

function AppShell({ easyMenu, crmHost }) {
  return (
    <>
      <AnalyticsTracker />
      {crmHost ? null : <CartDrawer />}

      <Routes>
        {/* Root route depends on domain */}
        <Route path="/" element={crmHost ? <CrmHostRoot /> : easyMenu ? <EasyMenuLanding /> : <GrubbidDiscovery />} />

        {/* Search */}
        <Route path="/search" element={crmHost ? <HostRouteRedirect to="/crm" /> : <GrubbidSearchResults />} />
        <Route path="/browse-menus" element={crmHost ? <HostRouteRedirect to="/crm" /> : <BrowseMenus />} />
        <Route path="/top-picks" element={crmHost ? <HostRouteRedirect to="/crm" /> : <TopPicksPage />} />
        <Route path="/top5/healthiest" element={crmHost ? <HostRouteRedirect to="/crm" /> : <TopPicksPage />} />

        {/* Deals */}
        <Route path="/deals" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DealsPage />} />

        {/* QR admin — keep id-based and before public restaurant route */}
        <Route path="/restaurants/:id/qr-codes" element={crmHost ? <HostRouteRedirect to="/crm" /> : <QrCodesPage />} />

        {/* Food truck signup */}
        <Route path="/foodtruck/signup" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTruckSignup />} />

        {/* Food truck public pages */}
        <Route path="/foodtrucks/:slugOrId/schedule" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTruckSchedulePage />} />
        <Route path="/foodtrucks/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTruckPage />} />

        {/* Back-compat: old /trucks/:slugOrId -> /foodtrucks/:slugOrId */}
        <Route path="/trucks/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <TruckRedirect />} />

        {/* Restaurant public page (CANONICAL) */}
        <Route path="/restaurants/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantPublicPage />} />

        {/* Back-compat: singular -> plural */}
        <Route path="/restaurant/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSingularRedirect />} />

        {/* Private/owner profile screen */}
        <Route path="/restaurant-profile/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantProfile />} />

        {/* Restaurant signup — canonical + short alias */}
        <Route path="/restaurant/signup" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSignup />} />
        <Route path="/signup" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSignup />} />

        {/* Onboarding step 2: find existing listing or create new */}
        <Route path="/profilesearch" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ProfileSearchPage />} />

        {/* Onboarding step 3: subscription / plan selection */}
        <Route path="/restaurant/subscription" element={crmHost ? <HostRouteRedirect to="/crm" /> : <SubscriptionSelect />} />

        {/* Onboarding step 4: design style selection (Adobe integration ready) */}
        <Route path="/restaurant/design-select" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuDesignSelectPage />} />

        {/* Terms of Service */}
        <Route path="/terms" element={crmHost ? <HostRouteRedirect to="/crm" /> : <Terms />} />

        {/* Menu upload (onboarding step 5) */}
        <Route path="/restaurant/pdf-upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PdfUploadPage />} />
        <Route path="/restaurant/spreadsheet-upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <SpreadsheetUploadPage />} />

        {/* Menus */}
        <Route path="/menus" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuPage />} />
        <Route path="/menus/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuDetailPage />} />
        <Route path="/public/restaurants/:id/menu" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuPage />} />
        <Route path="/public/restaurants/:id/display" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuDisplayPage />} />
        <Route path="/restaurants/:restaurantSlug/menu-items/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuItemDetailPage />} />
        <Route path="/menu-items/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuItemDetailPage />} />

        {/* Operator intake — MenuLibrarianBot (smartphone paste flow) */}
        <Route path="/field/intake" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorIntakePage />} />

        {/* Claim verify */}
        <Route path="/claim/verify" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ClaimVerify />} />

        {/* ── Operator backend portal ────────────────────────────── */}
        <Route path="/operator/login"        element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorLogin />} />
        <Route path="/operator/recover"      element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorRecovery />} />
        <Route path="/operator/reset-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorResetPassword />} />
        <Route path="/operator/claim"        element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorClaimSearch /></OperatorRoute>} />
        <Route path="/operator"              element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDashboard /></OperatorRoute>} />
        <Route path="/operator/profile"      element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorProfileEditor /></OperatorRoute>} />
        <Route path="/operator/menu"         element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuEditor /></OperatorRoute>} />
        <Route path="/operator/design"       element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorAdobeStudio /></OperatorRoute>} />
        <Route path="/operator/deals"        element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDealsEditor /></OperatorRoute>} />
        <Route path="/operator/hours"        element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorHoursEditor /></OperatorRoute>} />
        <Route path="/operator/qr-kits/order" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorQrKitOrder /></OperatorRoute>} />
        <Route path="/operator/subscription" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorSubscription /></OperatorRoute>} />
        <Route path="/operator/display-settings" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDisplaySettings /></OperatorRoute>} />

        <Route path="/owner/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OwnerLogin />} />
        <Route path="/owner" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/analytics" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerSiteAnalytics /></OwnerRoute>} />
        <Route path="/owner/search-analytics" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerSearchAnalytics /></OwnerRoute>} />
        <Route path="/owner/restaurants" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerRestaurants /></OwnerRoute>} />
        <Route path="/owner/revenue" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerRevenue /></OwnerRoute>} />
        <Route path="/owner/support" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerSupportTickets /></OwnerRoute>} />
        <Route path="/owner/support/:ticketId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerTicketDetail /></OwnerRoute>} />
        <Route path="/operator/menu-studio"      element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuStudio /></OperatorRoute>} />
        <Route path="/operator/brand"            element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorBrandSettings /></OperatorRoute>} />
        <Route path="/crm/login" element={<CrmLogin />} />
        <Route path="/crm" element={<CrmRoute><CrmDashboard /></CrmRoute>} />
        <Route path="/crm/leads" element={<CrmRoute><CrmLeadList /></CrmRoute>} />
        <Route path="/crm/leads/:id" element={<CrmRoute><CrmLeadDetail /></CrmRoute>} />
        <Route path="/crm/tasks" element={<CrmRoute><CrmTasks /></CrmRoute>} />
        <Route path="/crm/reports" element={<CrmRoute><CrmReports /></CrmRoute>} />
        <Route path="/admin/crm" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/leads" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/leads/:id" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/tasks" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/reports" element={<CrmLegacyRedirect />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {crmHost ? null : <SiteFooter />}
    </>
  );
}

export default function App() {
  const easyMenu = isEasyMenuHost();
  const crmHost = isCrmHost();

  return (
    <OwnerProvider>
    <CrmProvider>
    <OperatorProvider>
    <CartProvider>
    <LanguageProvider>
    <BrowserRouter>
      <AppShell easyMenu={easyMenu} crmHost={crmHost} />
    </BrowserRouter>
    </LanguageProvider>
    </CartProvider>
    </OperatorProvider>
    </CrmProvider>
    </OwnerProvider>
  );
}
