/**
 * ============================================================
 * File:    App.jsx
 * Path:    menubloc-frontend/src/App.jsx
 * Date:    2026-04-03
 * Purpose:
 *   Domain-aware routing:
 *     - easymenuupload.com -> EasyMenuLanding on "/"
 *     - crm.menuply.com (primary) / crm.grubbid.com (legacy) -> internal CRM shell
 *     - grubbid.com (and everything else) -> GrubbidDiscovery on "/"
 *
 *   Public route support:
 *   - Canonical restaurant public page: /restaurants/:slugOrId
 *   - Canonical public menu page: /restaurants/:slugOrId/menu
 *   - Canonical public menu item page: /restaurants/:restaurantSlug/menu-items/:id
 *   - Back-compat redirect: /restaurant/:slugOrId -> /restaurants/:slugOrId
 *
 *   Analytics route tracking:
 *   - Sends GA4 page_path updates on client-side route changes
 * ============================================================
 */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { useCanonical } from "./hooks/useCanonical.js";
import { captureEvent, initPostHog } from "./services/posthog.js";
import { CartProvider } from "./context/CartContext.jsx";
import { OrderCartProvider } from "./context/OrderCartContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import OrderCartDrawer from "./components/OrderCartDrawer.jsx";
import BasketResumePrompt from "./components/basket/BasketResumePrompt.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import { OperatorProvider, useOperator } from "./context/OperatorContext.jsx";
import { OwnerProvider, useOwner } from "./context/OwnerContext.jsx";
import { CrmProvider, useCrm } from "./context/CrmContext.jsx";
import { ConsumerProvider } from "./context/ConsumerContext.jsx";
import { FoodInterestsProvider } from "./context/FoodInterestsContext.jsx";
import ConsumerSignup from "./pages/consumer/ConsumerSignup.jsx";
import ConsumerLogin from "./pages/consumer/ConsumerLogin.jsx";
import AppleAuthCallback from "./pages/consumer/AppleAuthCallback.jsx";
import ConsumerForgotPassword from "./pages/consumer/ConsumerForgotPassword.jsx";
import ConsumerResetPassword from "./pages/consumer/ConsumerResetPassword.jsx";
import ConsumerProfile from "./pages/consumer/ConsumerProfile.jsx";
import ConsumerFollowing from "./pages/consumer/ConsumerFollowing.jsx";
import OperatorLogin from "./pages/operator/OperatorLogin.jsx";
import OperatorSignup from "./pages/operator/OperatorSignup.jsx";
import OperatorEmailVerification from "./pages/operator/OperatorEmailVerification.jsx";
import OperatorRecovery from "./pages/operator/OperatorRecovery.jsx";
import OperatorResetPassword from "./pages/operator/OperatorResetPassword.jsx";
import OperatorDashboard from "./pages/operator/OperatorDashboard.jsx";
import OperatorDeliveryPage from "./pages/operator/OperatorDeliveryPage.jsx";
import RestaurantOrdersPage from "./pages/operator/RestaurantOrdersPage.jsx";
import RestaurantOrderDetailPage from "./pages/operator/RestaurantOrderDetailPage.jsx";
import OperatorMenuEditor from "./pages/operator/OperatorMenuEditor.jsx";
import OperatorDealsEditor from "./pages/operator/OperatorDealsEditor.jsx";
import OperatorClaimSearch from "./pages/operator/OperatorClaimSearch.jsx";
import OperatorProfileEditor from "./pages/operator/OperatorProfileEditor.jsx";
import OperatorHoursEditor from "./pages/operator/OperatorHoursEditor.jsx";
import OperatorSubscription from "./pages/operator/OperatorSubscription.jsx";
import OperatorMyAccount from "./pages/operator/OperatorMyAccount.jsx";
import OperatorAdobeStudio from "./pages/operator/OperatorAdobeStudio.jsx";
import OperatorQrKitOrder from "./pages/operator/OperatorQrKitOrder.jsx";
import OperatorDisplaySettings from "./pages/operator/OperatorDisplaySettings.jsx";
import RestaurantHelpCenter from "./pages/operator/RestaurantHelpCenter.jsx";
import OwnerLogin from "./pages/owner/OwnerLogin.jsx";
import OwnerDashboard from "./pages/owner/OwnerDashboard.jsx";
import OwnerSiteAnalytics from "./pages/owner/OwnerSiteAnalytics.jsx";
import OwnerSearchAnalytics from "./pages/owner/OwnerSearchAnalytics.jsx";
import OwnerRestaurants from "./pages/owner/OwnerRestaurants.jsx";
import OwnerRevenue from "./pages/owner/OwnerRevenue.jsx";
import OwnerSupportTickets from "./pages/owner/OwnerSupportTickets.jsx";
import OwnerTicketDetail from "./pages/owner/OwnerTicketDetail.jsx";
import OwnerMenuUploads from "./pages/owner/OwnerMenuUploads.jsx";
import OwnerMenuUploadDetail from "./pages/owner/OwnerMenuUploadDetail.jsx";
import OperatorMenuStudio from "./pages/operator/OperatorMenuStudio.jsx";
import OperatorBrandSettings from "./pages/operator/OperatorBrandSettings.jsx";
import OperatorCartNegotiationSettings from "./pages/operator/OperatorCartNegotiationSettings.jsx";

import GrubbidDiscovery from "./pages/GrubbidDiscovery.jsx";
import GrubbidHomeV1 from "./components/GrubbidHomeV1.jsx";
import GrubbidSearchResults from "./pages/GrubbidSearchResults.jsx";
import FoodInterestsPage from "./pages/FoodInterestsPage.jsx";

import RestaurantSignup from "./pages/RestaurantSignup.jsx";
import RestaurantSignupEntry from "./pages/RestaurantSignupEntry.jsx";
import RestaurantPhilosophy from "./pages/RestaurantPhilosophy.jsx";
import RestaurantFoundersSignup from "./pages/RestaurantFoundersSignup.jsx";
import ProfileSearchPage from "./pages/ProfileSearchPage.jsx";
import RestaurantProfile from "./pages/RestaurantProfile.jsx";
import RestaurantBillboard from "./pages/RestaurantBillboard.jsx";
import RestaurantPublicPage from "./pages/RestaurantPublicPage.jsx";

import MenuPage from "./pages/MenuPage.jsx";
import MenuDetailPage from "./pages/MenuDetailPage.jsx";
import MenuItemDetailPage from "./pages/MenuItemDetailPage.jsx";
import MenuItemInfoPage from "./pages/MenuItemInfoPage.jsx";
import PublicMenuPage from "./pages/PublicMenuPage.jsx";
import PublicMenuDisplayPage from "./pages/PublicMenuDisplayPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import BuyMeThisPage from "./pages/BuyMeThisPage.jsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.jsx";
import BrowseMenus from "./pages/BrowseMenus.jsx";
import TopPicksPage from "./pages/TopPicksPage.jsx";

import DealsPage from "./pages/DealsPage.jsx";
import DealDetailPage from "./pages/DealDetailPage.jsx";

import ClaimVerify from "./pages/ClaimVerify.jsx";
import MenuVerificationPage from "./pages/MenuVerificationPage.jsx";
import EasyMenuLanding from "./pages/EasyMenuLanding.jsx";
import SubscriptionSelect from "./pages/SubscriptionSelect.jsx";
import MenuDesignSelectPage from "./pages/MenuDesignSelectPage.jsx";
import RestaurantQrUpsell from "./pages/RestaurantQrUpsell.jsx";
import MenuUploadChoicePage from "./pages/MenuUploadChoicePage.jsx";
import MenuCapturePage from "./pages/MenuCapturePage.jsx";
import Terms from "./pages/Terms.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import RestaurantMerchantTerms from "./pages/RestaurantMerchantTerms.jsx";
import RestaurantSubscriptionTerms from "./pages/RestaurantSubscriptionTerms.jsx";
import AboutGrubbid from "./pages/AboutGrubbid.jsx";
import Contact from "./pages/Contact.jsx";

import QrCodesPage from "./pages/QrCodesPage.jsx";
import PdfUploadPage from "./pages/PdfUploadPage.jsx";
import SpreadsheetUploadPage from "./pages/SpreadsheetUploadPage.jsx";
import FoodTruckPage from "./pages/FoodTruckPage.jsx";
import FoodTrucksPage from "./pages/FoodTrucksPage.jsx";
import FoodTruckSchedulePage from "./pages/FoodTruckSchedulePage.jsx";
import FoodTruckSignup from "./pages/FoodTruckSignup.jsx";
import OperatorIntakePage from "./pages/menulibrarian_mobile.jsx";
import CrmDashboard from "./pages/crm/CrmDashboard.jsx";
import AdminOrdersPage from "./pages/crm/AdminOrdersPage.jsx";
import AdminOrderDetailPage from "./pages/crm/AdminOrderDetailPage.jsx";
import CrmLeadList from "./pages/crm/CrmLeadList.jsx";
import CrmLeadDetail from "./pages/crm/CrmLeadDetail.jsx";
import CrmTasks from "./pages/crm/CrmTasks.jsx";
import CrmReports from "./pages/crm/CrmReports.jsx";
import CrmLogin from "./pages/crm/CrmLogin.jsx";
import CrmForgotPassword from "./pages/crm/CrmForgotPassword.jsx";
import CrmResetPassword from "./pages/crm/CrmResetPassword.jsx";
import CrmSubscriptions from "./pages/crm/CrmSubscriptions.jsx";
import CrmCommissions from "./pages/crm/CrmCommissions.jsx";
import FoodInterestAuthPrompt from "./components/food-interests/FoodInterestAuthPrompt.jsx";

function OperatorRoute({ children }) {
  const { isAuthenticated, isEmailVerified, loading } = useOperator();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/operator/login" replace />;
  if (!isEmailVerified) return <Navigate to="/operator/verify-email" replace />;
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
  return host === "crm.menuply.com" || host === "crm.grubbid.com";
}

function CrmHostRoot() {
  const { isAuthenticated, loading } = useCrm();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? "/crm" : "/crm/login"} replace />;
}

function HostRouteRedirect({ to }) {
  return <Navigate to={to} replace />;
}

function RestaurantSingularRedirect() {
  const { slugOrId } = useParams();
  return <Navigate to={slugOrId ? `/restaurants/${slugOrId}` : "/restaurants"} replace />;
}

function TruckRedirect() {
  const { slugOrId } = useParams();
  return <Navigate to={slugOrId ? `/foodtrucks/${slugOrId}` : "/"} replace />;
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const GA_SCRIPT_ID = "grubbid-ga4-script";
const GA_DEBUG_QUERY_PARAM = "ga_debug";
const GA_DEBUG_STORAGE_KEY = "grubbid.analytics.debug";

function isPublicGrubbidHost() {
  const host = (window?.location?.hostname || "").toLowerCase();
  if (!host) return false;
  if (host === "grubbid.com" || host === "www.grubbid.com") return true;
  // Consumer prod + previews (Vercel); GA stream is shared with Grubbid property.
  if (host === "menuply.com" || host === "www.menuply.com") return true;
  if (host.endsWith(".vercel.app")) return true;
  if (host === "localhost" || host === "127.0.0.1") return true;
  return false;
}

function isAnalyticsDebugEnabled() {
  if (typeof window === "undefined") return false;

  try {
    const params = new URLSearchParams(window.location.search || "");
    const queryValue = params.get(GA_DEBUG_QUERY_PARAM);
    if (queryValue === "1" || queryValue === "true") {
      window.localStorage?.setItem(GA_DEBUG_STORAGE_KEY, "1");
      return true;
    }
    if (queryValue === "0" || queryValue === "false") {
      window.localStorage?.removeItem(GA_DEBUG_STORAGE_KEY);
      return false;
    }
  } catch {
    // Ignore query parsing/localStorage failures and fall back.
  }

  try {
    return window.localStorage?.getItem(GA_DEBUG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setAnalyticsDebugState(patch) {
  if (typeof window === "undefined") return;

  const previous = window.__grubbidAnalyticsDebug && typeof window.__grubbidAnalyticsDebug === "object"
    ? window.__grubbidAnalyticsDebug
    : {};

  window.__grubbidAnalyticsDebug = {
    ...previous,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  if (window.__grubbidAnalyticsDebug.enabled && typeof console !== "undefined") {
    console.info("[analytics]", window.__grubbidAnalyticsDebug);
  }
}

function ensureGoogleAnalyticsLoaded() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const host = (window.location.hostname || "").toLowerCase();
  const publicHost = isPublicGrubbidHost();
  const debugEnabled = isAnalyticsDebugEnabled();
  const gaIdPresent = Boolean(GA_ID);

  setAnalyticsDebugState({
    enabled: debugEnabled,
    host,
    measurementId: GA_ID || null,
    gaIdPresent,
    publicHost,
  });

  if (!gaIdPresent) {
    setAnalyticsDebugState({
      initialized: false,
      ready: false,
      reason: "missing_measurement_id",
    });
    if (publicHost && import.meta.env.PROD && typeof console !== "undefined" && !window.__grubbidGaMissingIdWarned) {
      window.__grubbidGaMissingIdWarned = true;
      console.warn(
        "[GA4] VITE_GA_MEASUREMENT_ID was not set at build time. Add it in Vercel (Project → Settings → Environment Variables) for Production and Preview, then redeploy. Also confirm the value matches Admin → Data streams → Web → Measurement ID."
      );
    }
    return false;
  }

  if (!publicHost) {
    setAnalyticsDebugState({
      initialized: false,
      ready: false,
      reason: "host_not_allowed",
    });
    return false;
  }

  if (window.__grubbidGaInitialized) {
    setAnalyticsDebugState({
      initialized: true,
      ready: true,
      reason: null,
      scriptPresent: Boolean(document.getElementById(GA_SCRIPT_ID)),
    });
    return true;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.dataset.loaded = "false";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    script.onload = () => {
      script.dataset.loaded = "true";
      setAnalyticsDebugState({
        scriptLoaded: true,
        scriptLoadError: false,
      });
    };
    script.onerror = () => {
      script.dataset.loaded = "false";
      setAnalyticsDebugState({
        scriptLoaded: false,
        scriptLoadError: true,
        reason: "script_load_failed",
      });
    };
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    send_page_view: false,
    cookie_domain: "auto",
  });
  window.__grubbidGaInitialized = true;
  setAnalyticsDebugState({
    initialized: true,
    ready: true,
    reason: null,
    scriptPresent: true,
    scriptLoaded: document.getElementById(GA_SCRIPT_ID)?.dataset?.loaded === "true",
  });
  return true;
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return null;
}

function AnalyticsTracker() {
  const location = useLocation();
  const { operator } = useOperator();
  const { owner } = useOwner();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const gaReady = ensureGoogleAnalyticsLoaded();
    const pagePath = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    const pageTitle = typeof document !== "undefined" ? document.title || "Menuply" : "Menuply";
    const pageLocation = window.location.href;

    captureEvent("pageview", {
      path: location.pathname,
    });

    if (gaReady && typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_title: pageTitle,
        page_path: pagePath,
        page_location: pageLocation,
      });

      setAnalyticsDebugState({
        lastPageView: {
          page_title: pageTitle,
          page_path: pagePath,
          page_location: pageLocation,
          sentAt: new Date().toISOString(),
        },
      });
    }

    const api = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
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

    fetch(`${api}/api/analytics/page-visit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path: pagePath,
        session_id: sessionId || null,
        user_id: owner?.id || operator?.id || null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        device_type: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop",
        metadata: {
          title: pageTitle,
          ga_enabled: gaReady,
          ga_measurement_id: gaReady ? GA_ID : null,
        },
      }),
    })
      .then((response) => {
        setAnalyticsDebugState({
          backendVisitStatus: response.ok ? "ok" : "error",
          backendVisitHttpStatus: response.status,
          lastBackendVisitAt: new Date().toISOString(),
        });
      })
      .catch(() => {
        setAnalyticsDebugState({
          backendVisitStatus: "network_error",
          lastBackendVisitAt: new Date().toISOString(),
        });
      });
  }, [location, operator?.id, owner?.id]);

  return null;
}

function CanonicalUpdater() {
  useCanonical();
  return null;
}

function AppShell({ easyMenu, crmHost }) {
  return (
    <>
      <ScrollToTop />
      <CanonicalUpdater />
      <AnalyticsTracker />
      {crmHost ? null : <CartDrawer />}
      {crmHost ? null : <OrderCartDrawer />}
      {crmHost ? null : <BasketResumePrompt />}
      {crmHost ? null : <FoodInterestAuthPrompt />}

      <Routes>
        <Route path="/" element={crmHost ? <CrmHostRoot /> : easyMenu ? <EasyMenuLanding /> : <GrubbidDiscovery />} />

        <Route path="/search" element={crmHost ? <HostRouteRedirect to="/crm" /> : <GrubbidSearchResults />} />
        <Route path="/food-interests" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodInterestsPage />} />
        <Route path="/browse-menus" element={crmHost ? <HostRouteRedirect to="/crm" /> : <BrowseMenus />} />
        <Route path="/top-picks" element={crmHost ? <HostRouteRedirect to="/crm" /> : <TopPicksPage />} />
        <Route path="/top5/healthiest" element={crmHost ? <HostRouteRedirect to="/crm" /> : <TopPicksPage />} />

        <Route path="/deals" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DealsPage />} />
        <Route path="/deals/:dealId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DealDetailPage />} />

        <Route path="/restaurants/:id/qr-codes" element={crmHost ? <HostRouteRedirect to="/crm" /> : <QrCodesPage />} />

        <Route path="/foodtruck/signup" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTruckSignup />} />
        <Route path="/foodtrucks" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTrucksPage />} />
        <Route path="/foodtrucks/:slugOrId/schedule" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTruckSchedulePage />} />
        <Route path="/foodtrucks/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTruckPage />} />
        <Route path="/trucks/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <TruckRedirect />} />

        <Route path="/restaurants/:slugOrId/billboard" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantBillboard />} />
        <Route path="/restaurants/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantPublicPage />} />
        <Route path="/restaurants/:slugOrId/menu" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuPage />} />
        <Route path="/menu-template-preview" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuPage />} />
        <Route path="/restaurant/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSingularRedirect />} />

        <Route path="/restaurant-profile/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantProfile />} />

        <Route path="/restaurant/onboarding" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantPhilosophy />} />
        <Route path="/restaurant/join" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantFoundersSignup />} />
        <Route path="/restaurant/signup" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSignupEntry />} />
        <Route path="/restaurant/signup/account" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSignup />} />
        <Route path="/signup" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSignupEntry />} />
        <Route path="/pricing" element={crmHost ? <HostRouteRedirect to="/crm" /> : <SubscriptionSelect />} />
        <Route path="/profilesearch" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ProfileSearchPage />} />
        <Route path="/restaurant/subscription" element={crmHost ? <HostRouteRedirect to="/crm" /> : <SubscriptionSelect />} />
        <Route path="/restaurant/qr-upsell" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantQrUpsell />} />
        <Route path="/restaurant/design-select" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuDesignSelectPage />} />
        <Route path="/restaurant/menu-upload-choice" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuUploadChoicePage />} />
        <Route path="/menu-capture" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuCapturePage />} />

        <Route path="/terms" element={crmHost ? <HostRouteRedirect to="/crm" /> : <Terms />} />
        <Route path="/privacy" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PrivacyPolicy />} />
        <Route path="/restaurant/terms" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantMerchantTerms />} />
        <Route path="/restaurant/subscription-terms" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSubscriptionTerms />} />
        <Route path="/about" element={crmHost ? <HostRouteRedirect to="/crm" /> : <AboutGrubbid />} />
        <Route path="/contact" element={crmHost ? <HostRouteRedirect to="/crm" /> : <Contact />} />

        <Route path="/restaurant/pdf-upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PdfUploadPage />} />
        <Route path="/restaurant/ocr-upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PdfUploadPage />} />
        <Route path="/restaurant/spreadsheet-upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <SpreadsheetUploadPage />} />

        <Route path="/menus" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuPage />} />
        <Route path="/menus/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuDetailPage />} />
        <Route path="/public/restaurants/:id/menu" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuPage />} />
        <Route path="/public/restaurants/:id/display" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuDisplayPage />} />
        <Route path="/checkout" element={crmHost ? <HostRouteRedirect to="/crm" /> : <CheckoutPage />} />
        <Route path="/bmt/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <BuyMeThisPage />} />
        <Route path="/orders/:orderId/confirmation" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OrderConfirmationPage />} />
        <Route path="/restaurants/:restaurantSlug/menu-items/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuItemDetailPage />} />
        <Route path="/menu-items/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuItemDetailPage />} />
        <Route path="/restaurants/:restaurantSlug/menu-item-info/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuItemInfoPage />} />
        <Route path="/menu-item-info/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuItemInfoPage />} />

        <Route path="/field/intake" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorIntakePage />} />
        <Route path="/claim/verify" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ClaimVerify />} />
        <Route
          path="/menu-verification/:token"
          element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuVerificationPage />}
        />

        <Route path="/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <Navigate to="/account/login" replace />} />
        <Route path="/forgot-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <Navigate to="/account/forgot-password" replace />} />
        <Route path="/reset-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <Navigate to="/account/reset-password" replace />} />
        <Route path="/account/signup" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerSignup />} />
        <Route path="/account/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerLogin />} />
        <Route path="/auth/apple/callback" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <AppleAuthCallback />} />
        <Route path="/account/forgot-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerForgotPassword />} />
        <Route path="/account/reset-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerResetPassword />} />
        <Route path="/account" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConsumerProfile />} />
        <Route path="/account/following" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConsumerFollowing />} />

        <Route path="/operator/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorLogin />} />
        <Route path="/operator/signup" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorSignup />} />
        <Route path="/operator/verify-email" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorEmailVerification />} />
        <Route path="/operator/recover" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorRecovery />} />
        <Route path="/operator/reset-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorResetPassword />} />
        <Route path="/operator/claim" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorClaimSearch /></OperatorRoute>} />
        <Route path="/operator" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDashboard /></OperatorRoute>} />
        <Route path="/operator/orders" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><RestaurantOrdersPage /></OperatorRoute>} />
        <Route path="/operator/orders/:orderId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><RestaurantOrderDetailPage /></OperatorRoute>} />
        <Route path="/operator/delivery" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDeliveryPage /></OperatorRoute>} />
        <Route path="/operator/help" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><RestaurantHelpCenter /></OperatorRoute>} />
        <Route path="/operator/profile" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorProfileEditor /></OperatorRoute>} />
        <Route path="/operator/menu" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuEditor /></OperatorRoute>} />
        <Route path="/operator/menu/:menuId/edit" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuEditor /></OperatorRoute>} />
        <Route path="/operator/menu/upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuEditor /></OperatorRoute>} />
        <Route path="/operator/menu/upload/paste" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuEditor /></OperatorRoute>} />
        <Route path="/operator/menu/upload/pdf" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><PdfUploadPage /></OperatorRoute>} />
        <Route path="/operator/menu/upload/spreadsheet" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><SpreadsheetUploadPage /></OperatorRoute>} />
        <Route path="/operator/menu/upload/photo" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><PdfUploadPage /></OperatorRoute>} />
        <Route path="/operator/design" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorAdobeStudio /></OperatorRoute>} />
        <Route path="/operator/deals" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDealsEditor /></OperatorRoute>} />
        <Route path="/operator/hours" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorHoursEditor /></OperatorRoute>} />
        <Route path="/operator/bid-free-bidding" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorCartNegotiationSettings /></OperatorRoute>} />
        <Route path="/operator/qr-kits/order" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorQrKitOrder /></OperatorRoute>} />
        <Route path="/operator/subscription" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorSubscription /></OperatorRoute>} />
        <Route path="/operator/my-account" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMyAccount /></OperatorRoute>} />
        <Route path="/operator/display-settings" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDisplaySettings /></OperatorRoute>} />
        <Route path="/operator/menu-studio" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuStudio /></OperatorRoute>} />
        <Route path="/operator/brand" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorBrandSettings /></OperatorRoute>} />

        <Route path="/owner/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OwnerLogin />} />
        <Route path="/owner" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/analytics" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerSiteAnalytics /></OwnerRoute>} />
        <Route path="/owner/search-analytics" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerSearchAnalytics /></OwnerRoute>} />
        <Route path="/owner/restaurants" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerRestaurants /></OwnerRoute>} />
        <Route path="/owner/revenue" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerRevenue /></OwnerRoute>} />
        <Route path="/owner/support" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerSupportTickets /></OwnerRoute>} />
        <Route path="/owner/support/:ticketId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerTicketDetail /></OwnerRoute>} />
        <Route path="/owner/menu-uploads" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerMenuUploads /></OwnerRoute>} />
        <Route path="/owner/menu-uploads/:uploadId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerMenuUploadDetail /></OwnerRoute>} />

        <Route path="/crm/login" element={<CrmLogin />} />
        <Route path="/crm/forgot-password" element={<CrmForgotPassword />} />
        <Route path="/crm/reset-password" element={<CrmResetPassword />} />
        <Route path="/crm" element={<CrmRoute><CrmDashboard /></CrmRoute>} />
        <Route path="/crm/subscriptions" element={<CrmRoute><CrmSubscriptions /></CrmRoute>} />
        <Route path="/crm/commissions" element={<CrmRoute><CrmCommissions /></CrmRoute>} />
        <Route path="/crm/orders" element={<CrmRoute><AdminOrdersPage /></CrmRoute>} />
        <Route path="/crm/orders/:orderId" element={<CrmRoute><AdminOrderDetailPage /></CrmRoute>} />
        <Route path="/crm/leads" element={<CrmRoute><CrmLeadList /></CrmRoute>} />
        <Route path="/crm/leads/:id" element={<CrmRoute><CrmLeadDetail /></CrmRoute>} />
        <Route path="/crm/tasks" element={<CrmRoute><CrmTasks /></CrmRoute>} />
        <Route path="/crm/reports" element={<CrmRoute><CrmReports /></CrmRoute>} />
        <Route path="/admin/crm" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/leads" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/leads/:id" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/tasks" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/reports" element={<CrmLegacyRedirect />} />

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
    <ConsumerProvider>
      <FoodInterestsProvider>
        <OwnerProvider>
          <CrmProvider>
            <OperatorProvider>
              <CartProvider>
                <OrderCartProvider>
                  <LanguageProvider>
                    <BrowserRouter>
                      <AppShell easyMenu={easyMenu} crmHost={crmHost} />
                    </BrowserRouter>
                  </LanguageProvider>
                </OrderCartProvider>
              </CartProvider>
            </OperatorProvider>
          </CrmProvider>
        </OwnerProvider>
      </FoodInterestsProvider>
    </ConsumerProvider>
  );
}
