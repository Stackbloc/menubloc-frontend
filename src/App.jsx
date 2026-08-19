/**
 * ============================================================
 * File:    App.jsx
 * Path:    menubloc-frontend/src/App.jsx
 * Date:    2026-04-03
 * Purpose:
 *   Domain-aware routing:
 *     - easymenuupload.com -> EasyMenuLanding on "/"
 *     - crm.menuply.com (primary) / crm.grubbid.com (legacy) -> internal CRM shell
 *     - venues.menuply.com -> venue destination demo (Coachella 2027 Place)
 *     - grubbid.com (and everything else) -> HomeRoot on "/" (HomeNext live; legacy via flag or /home-legacy)
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

import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Navigate, useParams, useLocation } from "react-router-dom";
import SentryRoutePerformance from "./components/SentryRoutePerformance.jsx";
import { SentryRoutes } from "./instrument.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useCanonical } from "./hooks/useCanonical.js";
import { captureEvent, initPostHog } from "./services/posthog.js";
import { sendPageVisit, setAnalyticsStaffSession } from "./lib/analyticsPageVisitSend.js";
import { isCityStateSlug } from "./lib/cityStateSlug.js";
import { apiGet } from "./lib/api.js";
import { CartProvider } from "./context/CartContext.jsx";
import { OrderCartProvider } from "./context/OrderCartContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import OrderCartDrawer from "./components/OrderCartDrawer.jsx";
import BasketResumePrompt from "./components/basket/BasketResumePrompt.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import { OperatorProvider, useOperator } from "./context/OperatorContext.jsx";
import {
  isFoodTruckRestaurant,
  resolveFoodTruckOnboardingRoute,
} from "./lib/foodTruckOnboarding.js";
import { OwnerProvider, useOwner } from "./context/OwnerContext.jsx";
import { CrmProvider, useCrm } from "./context/CrmContext.jsx";
import { ConsumerProvider } from "./context/ConsumerContext.jsx";
import ConsumerSessionToast from "./components/ConsumerSessionToast.jsx";
import ConsumerSignup from "./pages/consumer/ConsumerSignup.jsx";
import DinerSignup from "./pages/consumer/DinerSignup.jsx";
import ConsumerLogin from "./pages/consumer/ConsumerLogin.jsx";
import AppleAuthCallback from "./pages/consumer/AppleAuthCallback.jsx";
import ConsumerForgotPassword from "./pages/consumer/ConsumerForgotPassword.jsx";
import ConsumerResetPassword from "./pages/consumer/ConsumerResetPassword.jsx";
import ConsumerEduVerify from "./pages/consumer/ConsumerEduVerify.jsx";
import ConsumerProfile from "./pages/consumer/ConsumerProfile.jsx";
import ConsumerFollowing from "./pages/consumer/ConsumerFollowing.jsx";
import ConsumerConnections from "./pages/consumer/ConsumerConnections.jsx";
import ConsumerConnectionPeerPage from "./pages/consumer/ConsumerConnectionPeerPage.jsx";
import DinerQrPage from "./pages/consumer/DinerQrPage.jsx";
import MeetMeHerePage from "./pages/consumer/MeetMeHerePage.jsx";
import WhatWeDoingPage from "./pages/consumer/WhatWeDoingPage.jsx";
import WhatWeDoingSessionPage from "./pages/consumer/WhatWeDoingSessionPage.jsx";
import ConsumerNotificationsPage from "./pages/consumer/ConsumerNotificationsPage.jsx";
import DinerQrConnectPage from "./pages/consumer/DinerQrConnectPage.jsx";
import DinerQrScanRedirectPage from "./pages/consumer/DinerQrScanRedirectPage.jsx";
import DiningCrewsPage, {
  DiningCrewDetailPage,
  DiningCrewInvitePage,
} from "./pages/consumer/DiningCrewsPage.jsx";
import ImEatingPage from "./pages/consumer/ImEatingPage.jsx";
import InviteToEatStartPage from "./pages/consumer/InviteToEatStartPage.jsx";
import EventsBrowsePage from "./pages/EventsBrowsePage.jsx";
import WhatIAteTodayPage from "./pages/consumer/WhatIAteTodayPage.jsx";
import ConnectionPeerWhatIAtePage from "./pages/consumer/ConnectionPeerWhatIAtePage.jsx";
import MyMenuplyPage from "./pages/consumer/MyMenuplyPage.jsx";
import ConnectionsEatingPage from "./pages/consumer/ConnectionsEatingPage.jsx";
import ConnectionsPlanningPage from "./pages/consumer/ConnectionsPlanningPage.jsx";
import ActivityPage from "./pages/ActivityPage.jsx";
import DinerStatusPage from "./pages/consumer/DinerStatusPage.jsx";
import ClusterSubscriptionsPage from "./pages/consumer/ClusterSubscriptionsPage.jsx";
import SocialOnboardingPage from "./pages/consumer/SocialOnboardingPage.jsx";
import ConsumerOrderFeedbackPage from "./pages/consumer/ConsumerOrderFeedbackPage.jsx";
import ProviderApp from "./pages/provider/ProviderApp.jsx";
import AccountWelcome from "./pages/consumer/AccountWelcome.jsx";
import OperatorLogin from "./pages/operator/OperatorLogin.jsx";
import OperatorSignup from "./pages/operator/OperatorSignup.jsx";
import OperatorEmailVerification from "./pages/operator/OperatorEmailVerification.jsx";
import OperatorRecovery from "./pages/operator/OperatorRecovery.jsx";
import OperatorResetPassword from "./pages/operator/OperatorResetPassword.jsx";
import OperatorDashboard from "./pages/operator/OperatorDashboard.jsx";
import OperatorDeliveryPage from "./pages/operator/OperatorDeliveryPage.jsx";
import RestaurantOrdersPage from "./pages/operator/RestaurantOrdersPage.jsx";
import OperatorOrderFeedbackPage from "./pages/operator/OperatorOrderFeedbackPage.jsx";
import RestaurantOrderDetailPage from "./pages/operator/RestaurantOrderDetailPage.jsx";
import OperatorTabletPage from "./pages/operator/OperatorTabletPage.jsx";
import OperatorMenuEditor from "./pages/operator/OperatorMenuEditor.jsx";
import OperatorCkMenuEditorPage from "./pages/operator/OperatorCkMenuEditorPage.jsx";
import OperatorMenuWorksheetPage from "./pages/operator/OperatorMenuWorksheetPage.jsx";
import OperatorMenuWorksheetHubPage from "./pages/operator/OperatorMenuWorksheetHubPage.jsx";
import OperatorMenuCameraUpload from "./pages/operator/OperatorMenuCameraUpload.jsx";
import OperatorDealsEditor from "./pages/operator/OperatorDealsEditor.jsx";
import OperatorVenuePackagePage from "./pages/operator/OperatorVenuePackagePage.jsx";
import OperatorEventsEditor from "./pages/operator/OperatorEventsEditor.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import EventGroupDetailPage, {
  EventGroupInvitePage,
} from "./pages/EventGroupDetailPage.jsx";
import OperatorClaimSearch from "./pages/operator/OperatorClaimSearch.jsx";
import OperatorProfileEditor from "./pages/operator/OperatorProfileEditor.jsx";
import OperatorHoursEditor from "./pages/operator/OperatorHoursEditor.jsx";
import OperatorSubscription from "./pages/operator/OperatorSubscription.jsx";
import OperatorMyAccount from "./pages/operator/OperatorMyAccount.jsx";
import OperatorMerchantAccountPage from "./pages/operator/OperatorMerchantAccountPage.jsx";
import OperatorAdobeStudio from "./pages/operator/OperatorAdobeStudio.jsx";
import OperatorQrKitOrder from "./pages/operator/OperatorQrKitOrder.jsx";
import OperatorBillboardsPage from "./pages/operator/OperatorBillboardsPage.jsx";
import RestaurantHelpCenter from "./pages/operator/RestaurantHelpCenter.jsx";
import OwnerLogin from "./pages/owner/OwnerLogin.jsx";
import {
  OwnerVenueDetailPage,
  OwnerVenuesListPage,
} from "./pages/owner/venues/OwnerVenuesPages.jsx";
import { VenueProvider, useVenue } from "./context/VenueContext.jsx";
import VenueLogin from "./pages/venue/VenueLogin.jsx";
import VenueInventoryPage from "./pages/venue/VenueInventoryPage.jsx";
import VenueAdvertisementsPage from "./pages/venue/VenueAdvertisementsPage.jsx";
import {
  VenueAnalyticsPage,
  VenueBillingPage,
  VenueCampaignsPage,
  VenueStripeSetupPage,
} from "./pages/venue/VenuePlaceholderPages.jsx";
import { DistributorProvider, useDistributor } from "./context/DistributorContext.jsx";
import DistributorLogin from "./pages/distributor/DistributorLogin.jsx";
import DistributorAccountLogin from "./pages/distributor/DistributorAccountLogin.jsx";
import DistributorAccountSignup from "./pages/distributor/DistributorAccountSignup.jsx";
import DistributorDashboard from "./pages/distributor/DistributorDashboard.jsx";
import DistributorSearchPage from "./pages/distributor/DistributorSearchPage.jsx";
import DistributorRestaurantProfile from "./pages/distributor/DistributorRestaurantProfile.jsx";
import {
  DistributorConnectedPage,
  DistributorPendingPage,
  DistributorReportedPage,
} from "./pages/distributor/DistributorConnectionLists.jsx";
import {
  DistributorInboxPage,
  DistributorThreadPage,
} from "./pages/distributor/DistributorMessagesPage.jsx";
import OperatorDistributorRelationships from "./pages/operator/OperatorDistributorRelationships.jsx";
import OwnerRecovery from "./pages/owner/OwnerRecovery.jsx";
import OwnerResetPassword from "./pages/owner/OwnerResetPassword.jsx";
import OwnerDashboard from "./pages/owner/OwnerDashboard.jsx";
import OwnerDiners from "./pages/owner/OwnerDiners.jsx";
import OwnerPlatformIntelligence from "./pages/owner/intelligence/OwnerPlatformIntelligence.jsx";
import OwnerRestaurants from "./pages/owner/OwnerRestaurants.jsx";
import OwnerRevenue from "./pages/owner/OwnerRevenue.jsx";
import OwnerSupportTickets from "./pages/owner/OwnerSupportTickets.jsx";
import OwnerTicketDetail from "./pages/owner/OwnerTicketDetail.jsx";
import OwnerMenuUploads from "./pages/owner/OwnerMenuUploads.jsx";
import OwnerProfileManager from "./pages/owner/OwnerProfileManager.jsx";
import OwnerMenuEditorPage from "./pages/owner/OwnerMenuEditorPage.jsx";
import OwnerMenuUploadDetail from "./pages/owner/OwnerMenuUploadDetail.jsx";
import OwnerMenuUploadReviewItems from "./pages/owner/OwnerMenuUploadReviewItems.jsx";
import OwnerQrStickers from "./pages/owner/OwnerQrStickers.jsx";
import OwnerMarketExpansion from "./pages/owner/OwnerMarketExpansion.jsx";
import OwnerPhmsRouter from "./pages/owner/phms/OwnerPhmsRouter.jsx";
import OwnerDeploymentOperations from "./pages/owner/OwnerDeploymentOperations.jsx";
import OwnerHomepageControl from "./pages/owner/OwnerHomepageControl.jsx";
import SubscriptionDesignerList from "./pages/owner/subscriptionDesigner/SubscriptionDesignerList.jsx";
import SubscriptionDesignerPlanEditor from "./pages/owner/subscriptionDesigner/SubscriptionDesignerPlanEditor.jsx";
import SubscriptionDesignerFeatures from "./pages/owner/subscriptionDesigner/SubscriptionDesignerFeatures.jsx";
import SubscriptionDesignerPreview from "./pages/owner/subscriptionDesigner/SubscriptionDesignerPreview.jsx";
import SubscriptionDesignerAudit from "./pages/owner/subscriptionDesigner/SubscriptionDesignerAudit.jsx";
import OwnerHelpCenter from "./pages/owner/OwnerHelpCenter.jsx";
import OperatorQrStickers from "./pages/operator/OperatorQrStickers.jsx";
import OperatorMenuStudio from "./pages/operator/OperatorMenuStudio.jsx";
import OperatorBrandSettings from "./pages/operator/OperatorBrandSettings.jsx";
import OperatorCartNegotiationSettings from "./pages/operator/OperatorCartNegotiationSettings.jsx";

import HomeRoot from "./pages/HomeRoot.jsx";
import HomeNext from "./pages/HomeNext.jsx";
import LegacyDiscoveryHome from "./pages/LegacyDiscoveryHome.jsx";
import GrubbidHomeV1 from "./components/GrubbidHomeV1.jsx";
import GrubbidSearchResults from "./pages/GrubbidSearchResults.jsx";

import RestaurantSignup from "./pages/RestaurantSignup.jsx";
import RestaurantSignupEntry from "./pages/RestaurantSignupEntry.jsx";
import RestaurantOnboardingWelcome from "./pages/RestaurantOnboardingWelcome.jsx";
import RestaurantOnboardingProcessing from "./pages/RestaurantOnboardingProcessing.jsx";
import RestaurantOnboardingOrganization from "./pages/RestaurantOnboardingOrganization.jsx";
import RestaurantOnboardingInformation from "./pages/RestaurantOnboardingInformation.jsx";
import RestaurantOnboardingLocations from "./pages/RestaurantOnboardingLocations.jsx";
import RestaurantOnboardingProfileComplete from "./pages/RestaurantOnboardingProfileComplete.jsx";
import RestaurantMenuLive from "./pages/RestaurantMenuLive.jsx";
import FranchisesPage from "./pages/FranchisesPage.jsx";
import RestaurantFreeProfileSignup from "./pages/RestaurantFreeProfileSignup.jsx";
import RestaurantPhilosophy from "./pages/RestaurantPhilosophy.jsx";
import RestaurantFoundersSignup from "./pages/RestaurantFoundersSignup.jsx";
import JoinPage from "./pages/JoinPage.jsx";
import JoinDinersPage from "./pages/JoinDinersPage.jsx";
import { isJoinLandingPath } from "./lib/joinMarketConfig.js";
import ProfileSearchPage from "./pages/ProfileSearchPage.jsx";
import RestaurantProfile from "./pages/RestaurantProfile.jsx";
import RestaurantPublicPage from "./pages/RestaurantPublicPage.jsx";
import DistributorPublicPage from "./pages/DistributorPublicPage.jsx";
import DistributorsDirectoryPage from "./pages/DistributorsDirectoryPage.jsx";
import DistributorJoinPage from "./pages/DistributorJoinPage.jsx";
import DistributorClaimPage from "./pages/DistributorClaimPage.jsx";
import DistributorProfileEditPage from "./pages/distributor/DistributorProfileEditPage.jsx";
import RestaurantsLandingPage from "./pages/RestaurantsLandingPage.jsx";

import MenuPage from "./pages/MenuPage.jsx";
import MenuItemDetailPage from "./pages/MenuItemDetailPage.jsx";
import ComparePage from "./pages/ComparePage.jsx";
import MenuItemInfoPage from "./pages/MenuItemInfoPage.jsx";
import PublicMenuPage from "./pages/PublicMenuPage.jsx";
import PublicMenuDisplayPage from "./pages/PublicMenuDisplayPage.jsx";
import MarketAggregatorPage from "./pages/MarketAggregatorPage.jsx";
import ClusterPage from "./pages/ClusterPage.jsx";
import ClustersDirectoryPage from "./pages/ClustersDirectoryPage.jsx";
import ClusterCityDirectoryPage from "./pages/ClusterCityDirectoryPage.jsx";
import CommunityClusterCreatePage from "./pages/CommunityClusterCreatePage.jsx";
import DestinationVenueFoodPage from "./pages/DestinationVenueFoodPage.jsx";
import DestinationVenuePage from "./pages/DestinationVenuePage.jsx";
import DestinationVenueOrderPage from "./pages/DestinationVenueOrderPage.jsx";
import NflStadiumsDirectoryPage from "./pages/NflStadiumsDirectoryPage.jsx";
import MarketMenuItemPage from "./pages/MarketMenuItemPage.jsx";
import MenuItemCanonicalRoute from "./pages/MenuItemCanonicalRoute.jsx";
import MenuThemesPage from "./pages/MenuThemesPage.jsx";
import DemoPage from "./pages/DemoPage.jsx";
import DemoPresentation from "./presentation/DemoPresentation.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import BuyMeThisPage from "./pages/BuyMeThisPage.jsx";
import EatInvitationPage from "./pages/EatInvitationPage.jsx";
import JoinMeLandingPage from "./pages/JoinMeLandingPage.jsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.jsx";
import BrowseMenus from "./pages/BrowseMenus.jsx";
import FoodInterestsPage from "./pages/FoodInterestsPage.jsx";

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
import PhotoStandards from "./pages/PhotoStandards.jsx";
import AboutMenuply from "./pages/AboutMenuply.jsx";
import Contact from "./pages/Contact.jsx";
import CreativeProsPage from "./pages/CreativeProsPage.jsx";

import QrCodesPage from "./pages/QrCodesPage.jsx";
import PdfUploadPage from "./pages/PdfUploadPage.jsx";
import ManualMenuEntryPage from "./pages/ManualMenuEntryPage.jsx";
import SpreadsheetUploadPage from "./pages/SpreadsheetUploadPage.jsx";
import FoodTruckPage from "./pages/FoodTruckPage.jsx";
import FoodTrucksPage from "./pages/FoodTrucksPage.jsx";
import FoodTruckSchedulePage from "./pages/FoodTruckSchedulePage.jsx";
import FoodTruckSignup from "./pages/FoodTruckSignup.jsx";
import FoodTruckOnboardingDetails from "./pages/FoodTruckOnboardingDetails.jsx";
import OperatorIntakePage from "./pages/menulibrarian_mobile.jsx";
import CrmDashboard from "./pages/crm/CrmDashboard.jsx";
import AdminOrdersPage from "./pages/crm/AdminOrdersPage.jsx";
import AdminOrderDetailPage from "./pages/crm/AdminOrderDetailPage.jsx";
import CrmLeadList from "./pages/crm/CrmLeadList.jsx";
import CrmLeadDetail from "./pages/crm/CrmLeadDetail.jsx";
import CrmTasks from "./pages/crm/CrmTasks.jsx";
import CrmFollowUps from "./pages/crm/CrmFollowUps.jsx";
import CrmContacts from "./pages/crm/CrmContacts.jsx";
import CrmEmailTemplates from "./pages/crm/CrmEmailTemplates.jsx";
import CrmActivity from "./pages/crm/CrmActivity.jsx";
import CrmSeedExplorer from "./pages/crm/CrmSeedExplorer.jsx";
import CrmClusterList from "./pages/crm/CrmClusterList.jsx";
import CrmClusterDetail from "./pages/crm/CrmClusterDetail.jsx";
import CrmClusterPreviewPage from "./pages/crm/CrmClusterPreviewPage.jsx";
import CrmBusinessDevelopment from "./pages/crm/CrmBusinessDevelopment.jsx";
import CrmBusinessDevelopmentDetail from "./pages/crm/CrmBusinessDevelopmentDetail.jsx";
import CrmReports from "./pages/crm/CrmReports.jsx";
import CrmQrInventory from "./pages/crm/CrmQrInventory.jsx";
import CrmMarketplacePage from "./pages/crm/CrmMarketplacePage.jsx";
import BuildInfoPage from "./pages/BuildInfoPage.jsx";
import CrmLogin from "./pages/crm/CrmLogin.jsx";
import CrmForgotPassword from "./pages/crm/CrmForgotPassword.jsx";
import CrmResetPassword from "./pages/crm/CrmResetPassword.jsx";
import CrmSubscriptions from "./pages/crm/CrmSubscriptions.jsx";
import CrmCommissions from "./pages/crm/CrmCommissions.jsx";

function OperatorRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isEmailVerified, loading, selectedRestaurant, restaurants } = useOperator();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/operator/login" replace />;
  if (!isEmailVerified) return <Navigate to="/operator/verify-email" replace />;
  const restaurant = selectedRestaurant || restaurants?.[0] || null;
  if (restaurant && isFoodTruckRestaurant(restaurant)) {
    const next = resolveFoodTruckOnboardingRoute(restaurant);
    const current = `${location.pathname}${location.search || ""}`;
    const routeSearch = new URLSearchParams(location.search || "");
    const allowed =
      (location.pathname === "/operator/subscription" &&
        routeSearch.get("onboarding") === "food_truck") ||
      location.pathname === "/operator/verify-email" ||
      location.pathname === "/restaurant/pdf-upload" ||
      location.pathname === "/foodtruck/onboarding/details";
    if (next !== "/operator" && !allowed && current !== next) {
      return <Navigate to={next} replace />;
    }
  }
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

function CrmClustersAdminRedirect() {
  const { id } = useParams();
  const location = useLocation();
  const base = id ? `/clusters/admin/${id}` : "/clusters/admin";
  return <Navigate to={`${base}${location.search || ""}${location.hash || ""}`} replace />;
}

function OnboardingAliasRedirect() {
  const location = useLocation();
  return <Navigate to="/restaurant/onboarding" replace state={location.state} />;
}

function OperatorMarketplaceLegacyRedirect() {
  const location = useLocation();
  return <Navigate to={`/operator/marketplace${location.search || ""}${location.hash || ""}`} replace />;
}

export function ConsumerLegacyRedirect({ nextPath }) {
  const location = useLocation();
  return <Navigate to={`${nextPath}${location.search || ""}${location.hash || ""}`} replace />;
}

function OwnerRoute({ children }) {
  const { isAuthenticated, loading } = useOwner();
  if (loading) return <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f7f1ea 0%, #efe5db 100%)" }} />;
  if (!isAuthenticated) return <Navigate to="/owner/login" replace />;
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function VenueRoute({ children }) {
  const { isAuthenticated, loading } = useVenue();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/venue/login" replace />;
  return children;
}

function DistributorRoute({ children }) {
  const { isAuthenticated, loading } = useDistributor();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/distributor/login" replace />;
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

/** AEG / venue destination demo host — public Place experience, not CRM. */
function isVenuesHost() {
  const host = (window?.location?.hostname || "").toLowerCase();
  return host === "venues.menuply.com" || host === "www.venues.menuply.com";
}

const VENUES_DEMO_CLUSTER_PATH = "/clusters/california/indio/coachella-2027";

function VenuesHostRoot() {
  return <Navigate to={VENUES_DEMO_CLUSTER_PATH} replace />;
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

function OldUploadDetailRedirect() {
  const { uploadId } = useParams();
  return <Navigate to={`/owner/menu-manager/uploads/${uploadId}`} replace />;
}

function OldUploadReviewRedirect() {
  const { uploadId } = useParams();
  return <Navigate to={`/owner/menu-manager/uploads/${uploadId}/review-items`} replace />;
}

// Disambiguation: /restaurants/:slugOrId is both the profile URL and the market aggregator URL.
// City-state heuristic alone false-positives real restaurant slugs that end in a
// state code (e.g. chipotle-los-angeles-ca). Prefer an exact restaurant slug match.
function RestaurantOrMarketRouter() {
  const { slugOrId } = useParams();
  const looksLikeMarket = isCityStateSlug(slugOrId);
  const [mode, setMode] = useState(() => (looksLikeMarket ? "checking" : "restaurant"));

  useEffect(() => {
    if (!looksLikeMarket) {
      setMode("restaurant");
      return undefined;
    }
    let cancelled = false;
    setMode("checking");
    apiGet(`/public/restaurants/${encodeURIComponent(String(slugOrId || ""))}`)
      .then((data) => {
        if (cancelled) return;
        const restaurant = data?.restaurant || data;
        const hasRestaurant =
          data?.ok !== false &&
          restaurant &&
          (restaurant.id != null || restaurant.slug || restaurant.restaurant_name || restaurant.name);
        setMode(hasRestaurant ? "restaurant" : "market");
      })
      .catch(() => {
        if (!cancelled) setMode("market");
      });
    return () => {
      cancelled = true;
    };
  }, [slugOrId, looksLikeMarket]);

  if (!looksLikeMarket || mode === "restaurant") return <RestaurantPublicPage />;
  if (mode === "market") return <MarketAggregatorPage />;
  return null;
}

// Handles the canonical 3-segment route /restaurants/:state/:city/:restaurantSlug.
// RestaurantPublicPage reads both slugOrId and restaurantSlug from useParams(),
// so no extra wrapper logic is required — the component resolves the param itself.
function CanonicalRestaurantProfile() {
  return <RestaurantPublicPage />;
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
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has("highlightItem")) return;
    window.scrollTo(0, 0);
  }, [location.pathname]);
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
    // Sync staff flag for search + page-visit helpers (owner/operator sessions).
    setAnalyticsStaffSession(Boolean(owner?.id || operator?.id));
  }, [owner?.id, operator?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const gaReady = ensureGoogleAnalyticsLoaded();
    const pagePath = `${location.pathname}${location.search || ""}${location.hash || ""}`;
    const pageTitle = typeof document !== "undefined" ? document.title || "Menuply" : "Menuply";
    const pageLocation = window.location.href;
    const isStaff = Boolean(owner?.id || operator?.id);

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

    // Restaurant and dish-detail pages own their analytics send so they can
    // include restaurant_id / menu_item_id after data loads.
    const PAGE_OWNED_VISIT_PREFIXES = ["/restaurants/", "/public/restaurants/", "/menu-items/"];
    if (PAGE_OWNED_VISIT_PREFIXES.some((p) => location.pathname.startsWith(p))) return;

    // Owner/operator traffic is excluded from consumer Platform Intelligence.
    if (isStaff) {
      setAnalyticsDebugState({
        backendVisitStatus: "skipped_staff",
        lastBackendVisitAt: new Date().toISOString(),
      });
      return;
    }

    sendPageVisit({
      path: pagePath,
      user_id: null,
      metadata: {
        title: pageTitle,
        ga_enabled: gaReady,
        ga_measurement_id: gaReady ? GA_ID : null,
      },
    });
    setAnalyticsDebugState({
      backendVisitStatus: "sent",
      lastBackendVisitAt: new Date().toISOString(),
    });
  }, [location, operator?.id, owner?.id]);

  return null;
}

function CanonicalUpdater() {
  useCanonical();
  return null;
}

function AppShell({ easyMenu, crmHost, venuesHost }) {
  const location = useLocation();
  const joinLandingRoute = isJoinLandingPath(location.pathname);
  const joinSignupRoute =
    location.pathname === "/restaurant/signup/free-profile" ||
    location.pathname === "/restaurant/signup/account" ||
    location.pathname === "/diner/signup";
  const restaurantOnboardingRoute =
    location.pathname === "/restaurant/onboarding" ||
    location.pathname.startsWith("/restaurant/onboarding/");
  const operatorTabletRoute = location.pathname === "/operator/tablet";
  const presentationRoute = location.pathname === "/demo";
  const hidePublicChrome =
    crmHost ||
    joinLandingRoute ||
    joinSignupRoute ||
    restaurantOnboardingRoute ||
    operatorTabletRoute ||
    presentationRoute;

  return (
    <>
      <ScrollToTop />
      <CanonicalUpdater />
      <AnalyticsTracker />
      {hidePublicChrome ? null : <CartDrawer />}
      {hidePublicChrome ? null : <OrderCartDrawer />}
      {hidePublicChrome ? null : <BasketResumePrompt />}
      {hidePublicChrome ? null : <ConsumerSessionToast />}
      <SentryRoutes>
        <Route
          path="/"
          element={
            crmHost ? (
              <CrmHostRoot />
            ) : venuesHost ? (
              <VenuesHostRoot />
            ) : easyMenu ? (
              <EasyMenuLanding />
            ) : (
              <HomeRoot />
            )
          }
        />
        <Route path="/home-legacy" element={crmHost ? <HostRouteRedirect to="/crm" /> : <LegacyDiscoveryHome />} />
        <Route path="/home-next" element={crmHost ? <HostRouteRedirect to="/crm" /> : venuesHost ? <VenuesHostRoot /> : <HomeNext />} />

        <Route path="/clusters" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ClustersDirectoryPage />} />
        <Route path="/clusters/community/new" element={crmHost ? <HostRouteRedirect to="/crm" /> : <CommunityClusterCreatePage />} />
        <Route path="/clusters/admin" element={<CrmRoute><CrmClusterList /></CrmRoute>} />
        <Route path="/clusters/admin/:id" element={<CrmRoute><CrmClusterDetail /></CrmRoute>} />
        <Route path="/clusters/admin/:id/preview" element={<CrmRoute><CrmClusterPreviewPage /></CrmRoute>} />
        <Route
          path="/clusters/stadiums/nfl"
          element={crmHost ? <HostRouteRedirect to="/crm" /> : <NflStadiumsDirectoryPage />}
        />
        <Route
          path="/nfl/stadiums"
          element={crmHost ? <HostRouteRedirect to="/crm" /> : <Navigate to="/clusters/stadiums/nfl" replace />}
        />
        <Route path="/clusters/:stateSlug/:citySlug/:clusterSlug" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ClusterPage />} />
        <Route path="/clusters/:stateSlug/:citySlug" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ClusterCityDirectoryPage />} />
        <Route
          path="/destination-venues/:slug/food"
          element={crmHost ? <HostRouteRedirect to="/crm" /> : <DestinationVenueFoodPage />}
        />
        <Route
          path="/destination-venues/:slug/order"
          element={crmHost ? <HostRouteRedirect to="/crm" /> : <DestinationVenueOrderPage />}
        />
        <Route
          path="/destination-venues/:slug"
          element={crmHost ? <HostRouteRedirect to="/crm" /> : <DestinationVenuePage />}
        />
        <Route path="/search" element={crmHost ? <HostRouteRedirect to="/crm" /> : <GrubbidSearchResults />} />
        <Route path="/compare" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ComparePage />} />
        <Route path="/browse-menus" element={crmHost ? <HostRouteRedirect to="/crm" /> : <BrowseMenus />} />
        <Route path="/waiter" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodInterestsPage />} />
        <Route path="/deals" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DealsPage />} />
        <Route path="/deals/:dealId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DealDetailPage />} />
        <Route path="/events/groups/invite/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <EventGroupInvitePage />} />
        <Route path="/events/groups/:slug" element={crmHost ? <HostRouteRedirect to="/crm" /> : <EventGroupDetailPage />} />
        <Route path="/events" element={crmHost ? <HostRouteRedirect to="/crm" /> : <EventsBrowsePage />} />
        <Route path="/events/:slug" element={crmHost ? <HostRouteRedirect to="/crm" /> : <EventDetailPage />} />

        <Route path="/restaurants/:id/qr-codes" element={crmHost ? <HostRouteRedirect to="/crm" /> : <QrCodesPage />} />

        <Route path="/foodtruck/signup" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTruckSignup />} />
        <Route path="/foodtruck/onboarding/details" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><FoodTruckOnboardingDetails /></OperatorRoute>} />
        <Route path="/foodtrucks" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTrucksPage />} />
        <Route path="/foodtrucks/:slugOrId/schedule" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTruckSchedulePage />} />
        <Route path="/foodtrucks/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FoodTruckPage />} />
        <Route path="/trucks/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <TruckRedirect />} />

        <Route
          path="/restaurants/:slugOrId/billboard"
          element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSingularRedirect />}
        />
        {/* Canonical 3-segment routes — /restaurants/:state/:city/:restaurantSlug */}
        <Route path="/restaurants" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantsLandingPage />} />
        <Route path="/restaurants/:state/:city/:restaurantSlug/menu" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuPage />} />
        <Route path="/restaurants/:state/:city/:restaurantSlug/menu-items/:itemSlug" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuItemCanonicalRoute />} />
        <Route path="/restaurants/:state/:city/:restaurantSlug" element={crmHost ? <HostRouteRedirect to="/crm" /> : <CanonicalRestaurantProfile />} />
        {/* Legacy 2-segment market-scoped routes (kept for backward compat — middleware redirects to canonical) */}
        <Route path="/restaurants/:slugOrId/:restaurantSlug/menu" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuPage />} />
        <Route path="/restaurants/:slugOrId/:restaurantSlug/menu-items/:itemSlug" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuItemCanonicalRoute />} />
        {/* Single-segment: market aggregator when slug is city-state, profile otherwise */}
        <Route path="/restaurants/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantOrMarketRouter />} />
        <Route path="/restaurants/:slugOrId/menu" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuPage />} />
        <Route path="/distributors" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorsDirectoryPage />} />
        <Route path="/distributors/join" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorJoinPage />} />
        <Route path="/distributors/:slug/claim" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorClaimPage />} />
        <Route path="/distributors/:slug" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorPublicPage />} />
        <Route path="/menu-template-preview" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuPage />} />
        <Route path="/menu-design-lab" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuThemesPage />} />
        <Route path="/menu-themes" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuThemesPage />} />
        <Route path="/demo" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DemoPresentation />} />
        <Route path="/demo_menus" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DemoPage />} />
        <Route path="/restaurant/:slugOrId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSingularRedirect />} />

        <Route path="/restaurant-profile/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantProfile />} />

        <Route path="/restaurant/onboarding" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantPhilosophy />} />
        <Route path="/onboarding" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OnboardingAliasRedirect />} />
        <Route path="/restaurant/onboarding/welcome" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantOnboardingWelcome />} />
        <Route path="/restaurant/onboarding/organization" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantOnboardingOrganization />} />
        <Route path="/restaurant/onboarding/information" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantOnboardingInformation />} />
        <Route path="/restaurant/onboarding/locations" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantOnboardingLocations />} />
        <Route path="/restaurant/onboarding/profile-complete" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantOnboardingProfileComplete />} />
        <Route path="/restaurant/onboarding/processing" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantOnboardingProcessing />} />
        <Route path="/restaurant/onboarding/success" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantMenuLive />} />
        <Route path="/join" element={crmHost ? <HostRouteRedirect to="/crm" /> : <JoinPage />} />
        <Route path="/join/losangeles" element={crmHost ? <HostRouteRedirect to="/crm" /> : <JoinPage marketKey="losangeles" />} />
        <Route path="/join/los-angeles" element={crmHost ? <HostRouteRedirect to="/crm" /> : <JoinPage marketKey="losangeles" />} />
        <Route path="/join/dothan" element={crmHost ? <HostRouteRedirect to="/crm" /> : <JoinPage marketKey="dothan" />} />
        <Route path="/join/diners" element={crmHost ? <HostRouteRedirect to="/crm" /> : <JoinDinersPage />} />
        <Route path="/restaurant/join" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantFoundersSignup />} />
        <Route path="/franchises" element={crmHost ? <HostRouteRedirect to="/crm" /> : <FranchisesPage />} />
        <Route path="/restaurant/signup" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSignupEntry />} />
        <Route path="/restaurant/signup/account" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantSignup />} />
        <Route path="/restaurant/signup/free-profile" element={crmHost ? <HostRouteRedirect to="/crm" /> : <RestaurantFreeProfileSignup />} />
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
        <Route path="/photo-standards" element={<PhotoStandards />} />
        <Route path="/about" element={crmHost ? <HostRouteRedirect to="/crm" /> : <AboutMenuply />} />
        <Route path="/contact" element={crmHost ? <HostRouteRedirect to="/crm" /> : <Contact />} />
        <Route path="/creative-pros" element={crmHost ? <HostRouteRedirect to="/crm" /> : <CreativeProsPage />} />

        <Route path="/restaurant/pdf-upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PdfUploadPage />} />
        <Route path="/restaurant/ocr-upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PdfUploadPage />} />
        <Route path="/restaurant/manual-menu-entry" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ManualMenuEntryPage />} />
        <Route path="/restaurant/spreadsheet-upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <SpreadsheetUploadPage />} />

        <Route path="/menus" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MenuPage />} />
        <Route path="/public/restaurants/:id/menu" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuPage />} />
        <Route path="/public/restaurants/:id/display" element={crmHost ? <HostRouteRedirect to="/crm" /> : <PublicMenuDisplayPage />} />
        <Route path="/checkout" element={crmHost ? <HostRouteRedirect to="/crm" /> : <CheckoutPage />} />
        <Route path="/bmt/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <BuyMeThisPage />} />
        <Route path="/eat/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <EatInvitationPage />} />
        <Route path="/invite/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <EatInvitationPage />} />
        <Route path="/join-me/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <JoinMeLandingPage />} />
        <Route path="/orders/confirmation/:publicOrderToken" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OrderConfirmationPage />} />
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
        <Route path="/forgot-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerLegacyRedirect nextPath="/account/forgot-password" />} />
        <Route path="/reset-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerLegacyRedirect nextPath="/account/reset-password" />} />
        <Route path="/account/signup" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerSignup />} />
        <Route path="/diner/signup" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <DinerSignup />} />
        <Route path="/account/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerLogin />} />
        <Route path="/auth/apple/callback" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <AppleAuthCallback />} />
        <Route path="/account/forgot-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerForgotPassword />} />
        <Route path="/account/reset-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerResetPassword />} />
        <Route path="/account/edu-verify" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <ConsumerEduVerify />} />
        <Route path="/account" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConsumerProfile />} />
        <Route path="/my-menuply" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MyMenuplyPage />} />
        <Route path="/my-menuply/connections-eating" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConnectionsEatingPage />} />
        <Route path="/my-menuply/connections-planning" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConnectionsPlanningPage />} />
        <Route path="/activity" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ActivityPage />} />
        <Route path="/account/welcome" element={crmHost ? <HostRouteRedirect to="/crm" /> : <AccountWelcome />} />
        <Route path="/account/social-onboarding" element={crmHost ? <HostRouteRedirect to="/crm" /> : <SocialOnboardingPage />} />
        <Route path="/account/following" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConsumerFollowing />} />
        <Route path="/account/connections/:peerId/what-i-ate" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConnectionPeerWhatIAtePage />} />
        <Route path="/account/connections/:peerId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConsumerConnectionPeerPage />} />
        <Route path="/account/connections" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConsumerConnections />} />
        <Route path="/account/diner-qr" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DinerQrPage />} />
        <Route path="/account/meet-me-here" element={crmHost ? <HostRouteRedirect to="/crm" /> : <MeetMeHerePage />} />
        <Route path="/account/invite-to-eat" element={crmHost ? <HostRouteRedirect to="/crm" /> : <InviteToEatStartPage />} />
        <Route path="/account/what-we-doing" element={crmHost ? <HostRouteRedirect to="/crm" /> : <WhatWeDoingPage />} />
        <Route path="/account/what-we-doing/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <WhatWeDoingSessionPage />} />
        <Route path="/account/notifications" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConsumerNotificationsPage />} />
        <Route path="/d/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DinerQrScanRedirectPage />} />
        <Route path="/connect/d/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DinerQrConnectPage />} />
        <Route path="/account/dining-crews" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DiningCrewsPage />} />
        <Route path="/account/dining-crews/invite/:token" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DiningCrewInvitePage />} />
        <Route path="/account/dining-crews/:crewId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DiningCrewDetailPage />} />
        <Route path="/account/im-eating" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ImEatingPage />} />
        <Route path="/account/what-i-ate" element={crmHost ? <HostRouteRedirect to="/crm" /> : <WhatIAteTodayPage />} />
        <Route path="/account/diner-status" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DinerStatusPage />} />
        <Route path="/account/cluster-subscriptions" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ClusterSubscriptionsPage />} />
        <Route path="/account/feedback" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ConsumerOrderFeedbackPage />} />

        <Route path="/provider/*" element={crmHost ? <HostRouteRedirect to="/crm" /> : <ProviderApp />} />

        <Route path="/operator/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorLogin />} />
        <Route path="/operator/signup" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorSignup />} />
        <Route path="/operator/verify-email" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorEmailVerification />} />
        <Route path="/operator/recover" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorRecovery />} />
        <Route path="/operator/reset-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OperatorResetPassword />} />
        <Route path="/operator/claim" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorClaimSearch /></OperatorRoute>} />
        <Route path="/operator" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDashboard /></OperatorRoute>} />
        <Route path="/operator/tablet" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorTabletPage /></OperatorRoute>} />
        <Route path="/operator/orders" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><RestaurantOrdersPage /></OperatorRoute>} />
        <Route path="/operator/orders/:orderId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><RestaurantOrderDetailPage /></OperatorRoute>} />
        <Route path="/operator/feedback" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorOrderFeedbackPage /></OperatorRoute>} />
        <Route path="/operator/merchant" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMerchantAccountPage /></OperatorRoute>} />
        <Route path="/operator/delivery" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDeliveryPage /></OperatorRoute>} />
        <Route path="/operator/help" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><RestaurantHelpCenter /></OperatorRoute>} />
        <Route path="/operator/profile" element={crmHost ? <HostRouteRedirect to="/crm" /> : <Navigate to="/operator/profile-editor" replace />} />
        <Route path="/operator/profile-editor" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorProfileEditor /></OperatorRoute>} />
        <Route path="/operator/menulab" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuEditor /></OperatorRoute>} />
        <Route path="/operator/menu-worksheet" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuWorksheetHubPage /></OperatorRoute>} />
        <Route path="/operator/restaurants/:restaurantId/menus/:menuId/worksheet" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuWorksheetPage /></OperatorRoute>} />
        <Route path="/operator/restaurants/:restaurantId/ck-menus/:menuId/edit" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorCkMenuEditorPage /></OperatorRoute>} />
        <Route path="/operator/menu" element={<Navigate to="/operator/menulab" replace />} />
        <Route path="/operator/menu/camera-upload" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuCameraUpload /></OperatorRoute>} />
        <Route path="/operator/menu/:menuId/edit" element={<Navigate to="/operator/menulab" replace />} />
        <Route path="/operator/menu/upload" element={<Navigate to="/operator/menulab" replace />} />
        <Route path="/operator/menu/upload/paste" element={<Navigate to="/operator/menulab" replace />} />
        <Route path="/operator/menu/upload/manual" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><ManualMenuEntryPage /></OperatorRoute>} />
        <Route path="/operator/menu/upload/spreadsheet" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><SpreadsheetUploadPage /></OperatorRoute>} />
        <Route path="/operator/menu/upload/pdf" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><PdfUploadPage /></OperatorRoute>} />
        <Route path="/operator/menu/upload/photo" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><PdfUploadPage /></OperatorRoute>} />
        <Route path="/operator/design" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorAdobeStudio /></OperatorRoute>} />
        <Route path="/operator/deals" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDealsEditor /></OperatorRoute>} />
        <Route path="/operator/events" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorVenuePackagePage /></OperatorRoute>} />
        <Route path="/operator/events/manage" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorEventsEditor /></OperatorRoute>} />
        <Route path="/operator/hours" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorHoursEditor /></OperatorRoute>} />
        <Route path="/operator/bid-free-bidding" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorCartNegotiationSettings /></OperatorRoute>} />
        <Route path="/operator/marketplace" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorQrKitOrder /></OperatorRoute>} />
        <Route path="/operator/qr-kits/order" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorMarketplaceLegacyRedirect />} />
        <Route path="/operator/qr-stickers" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorQrStickers /></OperatorRoute>} />
        <Route path="/operator/subscription" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorSubscription /></OperatorRoute>} />
        <Route path="/operator/my-account" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMyAccount /></OperatorRoute>} />
        <Route path="/operator/distributor-relationships" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorDistributorRelationships /></OperatorRoute>} />
        <Route path="/operator/billboards" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorBillboardsPage /></OperatorRoute>} />
        <Route path="/operator/display-settings" element={crmHost ? <HostRouteRedirect to="/crm" /> : <Navigate to="/operator/billboards" replace />} />
        <Route path="/operator/menu-studio" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorMenuStudio /></OperatorRoute>} />
        <Route path="/operator/menudesign" element={<Navigate to="/operator/menulab" replace />} />
        <Route path="/operator/brand" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OperatorRoute><OperatorBrandSettings /></OperatorRoute>} />

        <Route path="/venue/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <VenueLogin />} />
        <Route path="/venue" element={crmHost ? <HostRouteRedirect to="/crm" /> : <VenueRoute><Navigate to="/venue/advertising/inventory" replace /></VenueRoute>} />
        <Route path="/venue/advertising/inventory" element={crmHost ? <HostRouteRedirect to="/crm" /> : <VenueRoute><VenueInventoryPage /></VenueRoute>} />
        <Route path="/venue/advertising/advertisements" element={crmHost ? <HostRouteRedirect to="/crm" /> : <VenueRoute><VenueAdvertisementsPage /></VenueRoute>} />
        <Route path="/venue/advertising/campaigns" element={crmHost ? <HostRouteRedirect to="/crm" /> : <VenueRoute><VenueCampaignsPage /></VenueRoute>} />
        <Route path="/venue/advertising/analytics" element={crmHost ? <HostRouteRedirect to="/crm" /> : <VenueRoute><VenueAnalyticsPage /></VenueRoute>} />
        <Route path="/venue/advertising/billing" element={crmHost ? <HostRouteRedirect to="/crm" /> : <VenueRoute><VenueBillingPage /></VenueRoute>} />
        <Route path="/venue/advertising/stripe-setup" element={crmHost ? <HostRouteRedirect to="/crm" /> : <VenueRoute><VenueStripeSetupPage /></VenueRoute>} />

        <Route path="/distributor/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <DistributorLogin />} />
        <Route path="/distributor/account/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <DistributorAccountLogin />} />
        <Route path="/distributor/account/signup" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <DistributorAccountSignup />} />
        <Route path="/distributor" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorDashboard /></DistributorRoute>} />
        <Route path="/distributor/profile" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorProfileEditPage /></DistributorRoute>} />
        <Route path="/distributor/restaurants" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorSearchPage /></DistributorRoute>} />
        <Route path="/distributor/search" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorSearchPage /></DistributorRoute>} />
        <Route path="/distributor/connected" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorConnectedPage /></DistributorRoute>} />
        <Route path="/distributor/pending" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorPendingPage /></DistributorRoute>} />
        <Route path="/distributor/reported" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorReportedPage /></DistributorRoute>} />
        <Route path="/distributor/restaurants/:restaurantId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorRestaurantProfile /></DistributorRoute>} />
        <Route path="/distributor/messages" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorInboxPage /></DistributorRoute>} />
        <Route path="/distributor/messages/:relationshipId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <DistributorRoute><DistributorThreadPage /></DistributorRoute>} />

        <Route path="/owner/login" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OwnerLogin />} />
        <Route path="/owner/recover" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OwnerRecovery />} />
        <Route path="/owner/reset-password" element={crmHost ? <HostRouteRedirect to="/crm/login" /> : <OwnerResetPassword />} />
        <Route path="/owner" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/diners" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerDiners /></OwnerRoute>} />
        <Route path="/owner/intelligence/*" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerPlatformIntelligence /></OwnerRoute>} />
        <Route path="/owner/analytics" element={<Navigate to="/owner/intelligence/site-activity" replace />} />
        <Route path="/owner/search-analytics" element={<Navigate to="/owner/intelligence/search-demand" replace />} />
        <Route path="/owner/restaurants" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerRestaurants /></OwnerRoute>} />
        <Route path="/owner/venues" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerVenuesListPage /></OwnerRoute>} />
        <Route path="/owner/venues/:id" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerVenueDetailPage /></OwnerRoute>} />
        <Route path="/owner/revenue" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerRevenue /></OwnerRoute>} />
        <Route path="/owner/support" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerSupportTickets /></OwnerRoute>} />
        <Route path="/owner/support/:ticketId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerTicketDetail /></OwnerRoute>} />
        <Route path="/owner/help" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerHelpCenter /></OwnerRoute>} />
        <Route path="/owner/profile-manager" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerProfileManager /></OwnerRoute>} />
        <Route path="/owner/menu-manager" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerMenuUploads /></OwnerRoute>} />
        <Route path="/owner/restaurants/:restaurantId/menus/:menuId/edit" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerMenuEditorPage /></OwnerRoute>} />
        <Route path="/owner/menu-manager/uploads/:uploadId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerMenuUploadDetail /></OwnerRoute>} />
        <Route path="/owner/menu-manager/uploads/:uploadId/review-items" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerMenuUploadReviewItems /></OwnerRoute>} />
        <Route path="/owner/menu-uploads" element={<Navigate to="/owner/menu-manager" replace />} />
        <Route path="/owner/menu-uploads/:uploadId" element={<OldUploadDetailRedirect />} />
        <Route path="/owner/menu-uploads/:uploadId/review-items" element={<OldUploadReviewRedirect />} />
        <Route path="/owner/qr-stickers" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerQrStickers /></OwnerRoute>} />
        <Route path="/owner/market-expansion" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerMarketExpansion /></OwnerRoute>} />
        <Route path="/owner/phms/*" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerPhmsRouter /></OwnerRoute>} />
        <Route path="/owner/homepage" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerHomepageControl /></OwnerRoute>} />
        <Route path="/owner/subscription-designer" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><SubscriptionDesignerList /></OwnerRoute>} />
        <Route path="/owner/subscription-designer/new" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><SubscriptionDesignerPlanEditor /></OwnerRoute>} />
        <Route path="/owner/subscription-designer/plans/:planId" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><SubscriptionDesignerPlanEditor /></OwnerRoute>} />
        <Route path="/owner/subscription-designer/features" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><SubscriptionDesignerFeatures /></OwnerRoute>} />
        <Route path="/owner/subscription-designer/preview" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><SubscriptionDesignerPreview /></OwnerRoute>} />
        <Route path="/owner/subscription-designer/audit" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><SubscriptionDesignerAudit /></OwnerRoute>} />
        <Route path="/owner/deployments" element={crmHost ? <HostRouteRedirect to="/crm" /> : <OwnerRoute><OwnerDeploymentOperations /></OwnerRoute>} />

        <Route path="/crm/login" element={<CrmLogin />} />
        <Route path="/crm/forgot-password" element={<CrmForgotPassword />} />
        <Route path="/crm/reset-password" element={<CrmResetPassword />} />
        <Route path="/crm" element={<CrmRoute><CrmDashboard /></CrmRoute>} />
        <Route path="/crm/subscriptions" element={<CrmRoute><CrmSubscriptions /></CrmRoute>} />
        <Route path="/crm/commissions" element={<CrmRoute><CrmCommissions /></CrmRoute>} />
        <Route path="/crm/orders" element={<CrmRoute><AdminOrdersPage /></CrmRoute>} />
        <Route path="/crm/orders/:orderId" element={<CrmRoute><AdminOrderDetailPage /></CrmRoute>} />
        <Route path="/crm/leads" element={<CrmRoute><CrmLeadList /></CrmRoute>} />
        <Route path="/crm/companies" element={<CrmRoute><CrmLeadList mode="companies" /></CrmRoute>} />
        <Route path="/crm/restaurants" element={<CrmRoute><CrmLeadList mode="companies" /></CrmRoute>} />
        <Route path="/crm/leads/:id" element={<CrmRoute><CrmLeadDetail /></CrmRoute>} />
        <Route path="/crm/follow-ups" element={<CrmRoute><CrmFollowUps /></CrmRoute>} />
        <Route path="/crm/contacts" element={<CrmRoute><CrmContacts /></CrmRoute>} />
        <Route path="/crm/email-templates" element={<CrmRoute><CrmEmailTemplates /></CrmRoute>} />
        <Route path="/crm/activity" element={<CrmRoute><CrmActivity /></CrmRoute>} />
        <Route path="/crm/business-development" element={<CrmRoute><CrmBusinessDevelopment /></CrmRoute>} />
        <Route path="/crm/business-development/:id" element={<CrmRoute><CrmBusinessDevelopmentDetail /></CrmRoute>} />
        <Route path="/crm/referral-prospects" element={<Navigate to="/crm/business-development" replace />} />
        <Route path="/crm/referral-prospects/:id" element={<CrmRoute><CrmBusinessDevelopmentDetail /></CrmRoute>} />
        <Route path="/crm/tasks" element={<CrmRoute><CrmTasks /></CrmRoute>} />
        <Route path="/crm/seed-explorer" element={<CrmRoute><CrmSeedExplorer /></CrmRoute>} />
        <Route path="/crm/clusters" element={<Navigate to="/clusters/admin" replace />} />
        <Route path="/crm/clusters/:id" element={<CrmClustersAdminRedirect />} />
        <Route path="/crm/reports" element={<CrmRoute><CrmReports /></CrmRoute>} />
        <Route path="/crm/qr-inventory" element={<CrmRoute><CrmQrInventory /></CrmRoute>} />
        <Route path="/crm/marketplace" element={<CrmRoute><CrmMarketplacePage /></CrmRoute>} />
        <Route path="/admin/crm" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/leads" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/leads/:id" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/tasks" element={<CrmLegacyRedirect />} />
        <Route path="/admin/crm/reports" element={<CrmLegacyRedirect />} />

        <Route path="/build-info" element={<BuildInfoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </SentryRoutes>

      {hidePublicChrome ? null : <SiteFooter />}
    </>
  );
}

export default function App() {
  const easyMenu = isEasyMenuHost();
  const crmHost = isCrmHost();
  const venuesHost = isVenuesHost();

  return (
    <ConsumerProvider>
      <OwnerProvider>
        <CrmProvider>
          <OperatorProvider>
            <VenueProvider>
            <DistributorProvider>
            <CartProvider>
              <LanguageProvider>
                <OrderCartProvider>
                  <BrowserRouter>
                    <SentryRoutePerformance />
                    <AppShell easyMenu={easyMenu} crmHost={crmHost} venuesHost={venuesHost} />
              </BrowserRouter>
                </OrderCartProvider>
              </LanguageProvider>
            </CartProvider>
            </DistributorProvider>
            </VenueProvider>
          </OperatorProvider>
        </CrmProvider>
      </OwnerProvider>
    </ConsumerProvider>
  );
}
