/**
 * ============================================================
 * Path: menubloc-frontend/src/lib/operatorApi.js
 * File: operatorApi.js
 * Date: 2026-03-23
 * Purpose:
 *   Shared operator API client.
 *   Every request uses credentials:'include' so session-based
 *   operator authentication persists across login and /me checks.
 * ============================================================
 */

import { appendLanguageParam, readStoredLanguage, withLanguageHeaders } from "./languageApi.js";

const VITE_ENV = import.meta.env || {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

// Exported for components that construct raw URLs (e.g. EventSource for SSE)
export const API_BASE = API;

async function req(path, opts = {}) {
  const language = opts.language || readStoredLanguage();
  const localizedPath = appendLanguageParam(path, language);
  const res = await fetch(`${API}${localizedPath}`, {
    credentials: "include",
    headers: withLanguageHeaders(
      { "Content-Type": "application/json", ...(opts.headers || {}) },
      language,
    ),
    ...opts,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.payload = json;
    throw error;
  }

  return json;
}

const get = (path) => req(path);
const post = (path, body) => req(path, { method: "POST", body: JSON.stringify(body) });
const patch = (path, body) => req(path, { method: "PATCH", body: JSON.stringify(body) });
const del = (path) => req(path, { method: "DELETE" });
const put = (path, body) => req(path, { method: "PUT", body: JSON.stringify(body) });

// ── Auth / Session ────────────────────────────────────────────────────────
export const getOperatorSession = () => get("/operator/auth/me");
export const loginOperator = (email, password) => post("/operator/auth/login", { email, password });
export const registerOperator = (email, password, full_name, consent = {}) =>
  post("/operator/auth/register", { email, password, full_name, ...consent });
export const logoutOperator = () => post("/operator/auth/logout", {});
export const sendOperatorEmailCode = (email) =>
  post("/restaurant-auth/send-email-code", { email });
export const resendOperatorEmailCode = (email) =>
  post("/restaurant-auth/resend-email-code", { email });
export const verifyOperatorEmailCode = (email, code) =>
  post("/restaurant-auth/verify-email-code", { email, code });
export const requestOperatorRecovery = (email, options = {}) =>
  post("/operator/auth/forgot", {
    email,
    ...(options.audience ? { audience: options.audience } : {}),
  });
export const validateOperatorResetToken = (token) =>
  get(`/operator/auth/reset-password?token=${encodeURIComponent(token)}`);
export const resetOperatorPassword = (token, password) =>
  post("/operator/auth/reset-password", { token, password });
export const changeOperatorPassword = (currentPassword, newPassword) =>
  post("/operator/auth/change-password", { current_password: currentPassword, new_password: newPassword });

// ── Subscription ──────────────────────────────────────────────────────────
export const getSubscription = () => get("/operator/subscription");
export const getPlans = () => get("/operator/subscription/plans");
export const upgradeSubscription = (body) => post("/operator/subscription/upgrade", body);
export const getBillingOverview = (rid) => get(`/operator/restaurants/${rid}/billing/overview`);
export const openBillingPortal = async (rid, body = {}) => {
  const result = await post(`/operator/restaurants/${rid}/billing/portal`, body);
  if (result?.portal_url && typeof window !== "undefined") {
    window.location.assign(result.portal_url);
  }
  return result;
};
export const syncAdobeUsageCharge = (rid) => post(`/operator/restaurants/${rid}/billing/usage/adobe/sync`, {});
export const createUsageInvoice = (rid, usageChargeId) =>
  post(`/operator/restaurants/${rid}/billing/usage/${usageChargeId}/invoice`, {});

// ── Restaurant: Adobe Design / Export ─────────────────────────────────────
export const getAdobeDesignConfig = (rid) =>
  get(`/operator/restaurants/${rid}/design/adobe/config`);

export const getAdobeDesignManifest = (rid, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/operator/restaurants/${rid}/design/adobe/manifest${qs ? `?${qs}` : ""}`);
};

export async function downloadAdobePdfExport(rid, body) {
  const res = await fetch(`${API}/operator/restaurants/${rid}/design/adobe/export/pdf`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return {
    blob: await res.blob(),
    filename: res.headers.get("content-disposition") || null,
  };
}

export async function downloadAdobeDocumentExport(rid, body) {
  const res = await fetch(`${API}/operator/restaurants/${rid}/design/adobe/export/document`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return {
    blob: await res.blob(),
    filename: res.headers.get("content-disposition") || null,
  };
}

export const getAdobeSocialPrompt = (rid, body) =>
  post(`/operator/restaurants/${rid}/design/adobe/social/prompt`, body);

// ── Restaurant: Profile ───────────────────────────────────────────────────
export const getProfile = (rid) => get(`/operator/restaurants/${rid}/profile`);
export const updateProfile = (rid, body) => patch(`/operator/restaurants/${rid}/profile`, body);
export const publishProfile = (rid) => post(`/operator/restaurants/${rid}/profile/publish`, {});
export const updateStatusBanners = (rid, status_banners) =>
  put(`/operator/restaurants/${rid}/profile/status-banners`, { status_banners });
export const replaceStatusEvents = (rid, status_type, events) =>
  put(`/operator/restaurants/${rid}/profile/status-events`, { status_type, events });
export const setFeaturedDish = (rid, menu_item_id) =>
  patch(`/operator/restaurants/${rid}/profile/featured-dish`, { menu_item_id });
export const uploadProfileLogo = (rid, file) => {
  const formData = new FormData();
  formData.append("logo", file);
  return reqForm(`/operator/restaurants/${rid}/profile/logo`, formData);
};
export const removeProfileLogo = (rid) =>
  del(`/operator/restaurants/${rid}/profile/logo`);
export const uploadProfileBanner = (rid, file) => {
  const formData = new FormData();
  formData.append("banner", file);
  return reqForm(`/operator/restaurants/${rid}/profile/banner`, formData);
};
export const removeProfileBanner = (rid) =>
  del(`/operator/restaurants/${rid}/profile/banner`);

// ── Restaurant: Onboarding Business Organization ──────────────────────────
export const getOwnedBusinessOrganization = (rid) =>
  get(`/operator/restaurants/${rid}/onboarding/organization`);
export const upsertOwnedBusinessOrganization = (rid, body) =>
  put(`/operator/restaurants/${rid}/onboarding/organization`, body);
export const completeOwnedBusinessOrganization = (rid, body = {}) =>
  post(`/operator/restaurants/${rid}/onboarding/organization/complete`, body);

// ── Restaurant: Onboarding Information (ownership-safe PATCH) ─────────────
export const getOwnedRestaurantInformation = (rid) =>
  get(`/operator/restaurants/${rid}/onboarding/information`);
export const updateOwnedRestaurantInformation = (rid, body) =>
  patch(`/operator/restaurants/${rid}/onboarding/information`, body);

// ── Restaurant: Onboarding Locations ──────────────────────────────────────
export const getOwnedLocations = (rid) =>
  get(`/operator/restaurants/${rid}/onboarding/locations`);
export const createOwnedLocation = (rid, body) =>
  post(`/operator/restaurants/${rid}/onboarding/locations`, body);
export const updateOwnedLocation = (rid, locationId, body) =>
  patch(`/operator/restaurants/${rid}/onboarding/locations/${locationId}`, body);
export const deleteOwnedLocation = (rid, locationId) =>
  del(`/operator/restaurants/${rid}/onboarding/locations/${locationId}`);
export const setPrimaryOwnedLocation = (rid, primary_location_id) =>
  post(`/operator/restaurants/${rid}/onboarding/locations/primary`, {
    primary_location_id,
    // legacy alias accepted by backend during transition
    location_id: primary_location_id,
  });
export const reorderOwnedLocations = (rid, location_ids) =>
  post(`/operator/restaurants/${rid}/onboarding/locations/reorder`, { location_ids });
export async function downloadLocationImportTemplate(rid) {
  const language = readStoredLanguage();
  const localizedPath = appendLanguageParam(
    `/operator/restaurants/${rid}/onboarding/locations/import/template`,
    language
  );
  const res = await fetch(`${API}${localizedPath}`, {
    credentials: "include",
    headers: withLanguageHeaders({}, language),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return res.text();
}
export const validateLocationImport = (rid, body) =>
  post(`/operator/restaurants/${rid}/onboarding/locations/import/validate`, body);
export const confirmLocationImport = (rid, preview_id) =>
  post(`/operator/restaurants/${rid}/onboarding/locations/import/confirm`, { preview_id });
export const completeOwnedLocationsCheckpoint = (rid, body = {}) =>
  post(`/operator/restaurants/${rid}/onboarding/locations/complete`, body);
export const getOnboardingCheckpoint = (rid) =>
  get(`/operator/restaurants/${rid}/onboarding/checkpoint`);
export const markOnboardingStage = (rid, body) =>
  post(`/operator/restaurants/${rid}/onboarding/checkpoint/stage`, body);
export const getLaunchReadiness = (rid) =>
  get(`/operator/restaurants/${rid}/onboarding/launch-readiness`);

// ── Restaurant: Menus ─────────────────────────────────────────────────────
export const getMenus = (rid) => get(`/operator/restaurants/${rid}/menus`);
export const createMenu = (rid, body) => post(`/operator/restaurants/${rid}/menus`, body);
export const getMenu = (rid, mid) => get(`/operator/restaurants/${rid}/menus/${mid}`);
export const updateMenu = (rid, mid, body) => patch(`/operator/restaurants/${rid}/menus/${mid}`, body);
export const publishMenu = (rid, mid) => post(`/operator/restaurants/${rid}/menus/${mid}/publish`, {});
export const archiveMenu = (rid, mid) => post(`/operator/restaurants/${rid}/menus/${mid}/archive`, {});
export const deleteMenu = (rid, mid) => del(`/operator/restaurants/${rid}/menus/${mid}`);

// ── Restaurant: Menu Items ────────────────────────────────────────────────
export const getMenuItems = (rid, mid) => get(`/operator/restaurants/${rid}/menus/${mid}/items`);
export const createMenuItem = (rid, mid, body) => post(`/operator/restaurants/${rid}/menus/${mid}/items`, body);
export const getMenuItem = (rid, iid) => get(`/operator/restaurants/${rid}/menu-items/${iid}`);
export const updateMenuItem = (rid, iid, body) => patch(`/operator/restaurants/${rid}/menu-items/${iid}`, body);
export const publishMenuItem = (rid, iid) => post(`/operator/restaurants/${rid}/menu-items/${iid}/publish`, {});
export const deleteMenuItem = (rid, iid) => del(`/operator/restaurants/${rid}/menu-items/${iid}`);
export const getPriceHistory = (rid, iid) => get(`/operator/restaurants/${rid}/menu-items/${iid}/price-history`);
export const submitMenuIntake = (rid, text) =>
  post(`/operator/restaurants/${rid}/menu-intake`, { text });

// ── Restaurant: CK structured menu editor (shared with owner Menu Manager) ─
function withUploadSession(path, uploadSessionId) {
  if (!uploadSessionId) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}upload_session_id=${encodeURIComponent(uploadSessionId)}`;
}

export const getCkMenus = (rid) => get(`/operator/restaurants/${rid}/ck-menus`);
export const getCkMenuFromUpload = (rid, uploadId) =>
  get(`/operator/restaurants/${rid}/ck-menus/from-upload/${encodeURIComponent(uploadId)}`);
export const getCkMenu = (rid, mid, uploadSessionId = null) =>
  get(withUploadSession(`/operator/restaurants/${rid}/ck-menus/${mid}`, uploadSessionId));
export const getCkMenuSourcePdf = (rid, mid, uploadSessionId = null) =>
  get(withUploadSession(`/operator/restaurants/${rid}/ck-menus/${mid}/source-pdf`, uploadSessionId));
export const updateCkMenu = (rid, mid, body, uploadSessionId = null) =>
  patch(withUploadSession(`/operator/restaurants/${rid}/ck-menus/${mid}`, uploadSessionId), {
    ...body,
    ...(uploadSessionId ? { upload_session_id: uploadSessionId } : {}),
  });
export const publishCkMenu = (rid, mid, uploadSessionId = null) =>
  post(withUploadSession(`/operator/restaurants/${rid}/ck-menus/${mid}/publish`, uploadSessionId), {
    ...(uploadSessionId ? { upload_session_id: uploadSessionId } : {}),
  });
export const unpublishCkMenu = (rid, mid, uploadSessionId = null) =>
  post(withUploadSession(`/operator/restaurants/${rid}/ck-menus/${mid}/unpublish`, uploadSessionId), {
    ...(uploadSessionId ? { upload_session_id: uploadSessionId } : {}),
  });
export const addCkMenuItem = (rid, mid, body, uploadSessionId = null) =>
  post(withUploadSession(`/operator/restaurants/${rid}/ck-menus/${mid}/items`, uploadSessionId), {
    ...body,
    ...(uploadSessionId ? { upload_session_id: uploadSessionId } : {}),
  });
export const updateCkMenuItem = (rid, mid, itemId, body, uploadSessionId = null) =>
  patch(
    withUploadSession(`/operator/restaurants/${rid}/ck-menus/${mid}/items/${itemId}`, uploadSessionId),
    { ...body, ...(uploadSessionId ? { upload_session_id: uploadSessionId } : {}) }
  );
export const deleteCkMenuItem = (rid, mid, itemId, uploadSessionId = null) =>
  del(withUploadSession(`/operator/restaurants/${rid}/ck-menus/${mid}/items/${itemId}`, uploadSessionId));

/** Adapter for SharedMenuEditor — binds optional upload_session_id for edit logging. */
export function createOperatorCkMenuApi(uploadSessionId = null) {
  return {
    updateItem: (rid, mid, itemId, body) => updateCkMenuItem(rid, mid, itemId, body, uploadSessionId),
    deleteItem: (rid, mid, itemId) => deleteCkMenuItem(rid, mid, itemId, uploadSessionId),
    addItem: (rid, mid, body) => addCkMenuItem(rid, mid, body, uploadSessionId),
    updateMenu: (rid, mid, body) => updateCkMenu(rid, mid, body, uploadSessionId),
    publishMenu: (rid, mid) => publishCkMenu(rid, mid, uploadSessionId),
    unpublishMenu: (rid, mid) => unpublishCkMenu(rid, mid, uploadSessionId),
  };
}

// ── Restaurant: Menu Worksheet (post-parse grid) ──────────────────────────
export const getMenuWorksheet = (rid, mid, uploadSessionId = null) =>
  get(withUploadSession(`/operator/restaurants/${rid}/menus/${mid}/worksheet`, uploadSessionId));

export const saveMenuWorksheet = (rid, mid, body) =>
  put(`/operator/restaurants/${rid}/menus/${mid}/worksheet`, body);

export const publishMenuWorksheet = (rid, mid, body = {}) =>
  post(`/operator/restaurants/${rid}/menus/${mid}/worksheet/publish`, body);

// ── Restaurant: Deals ─────────────────────────────────────────────────────
export const getDeals = (rid, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/operator/restaurants/${rid}/deals${qs ? `?${qs}` : ""}`);
};
export const createDeal = (rid, body) => post(`/operator/restaurants/${rid}/deals`, body);
export const getDeal = (rid, did) => get(`/operator/restaurants/${rid}/deals/${did}`);
export const updateDeal = (rid, did, body) => patch(`/operator/restaurants/${rid}/deals/${did}`, body);
export const publishDeal = (rid, did) => post(`/operator/restaurants/${rid}/deals/${did}/publish`, {});
export const pauseDeal = (rid, did) => post(`/operator/restaurants/${rid}/deals/${did}/pause`, {});
export const deleteDeal = (rid, did) => del(`/operator/restaurants/${rid}/deals/${did}`);
export const getDealBillboard    = (rid, did)       => get(`/operator/restaurants/${rid}/deals/${did}/billboard`);
export const upsertDealBillboard = (rid, did, body) => put(`/operator/restaurants/${rid}/deals/${did}/billboard`, body);
export const removeDealBillboard = (rid, did)       => del(`/operator/restaurants/${rid}/deals/${did}/billboard`);
export const uploadBillboardPhoto = (rid, did, file) => {
  const fd = new FormData();
  fd.append("photo", file);
  return fetch(`${API}/operator/restaurants/${rid}/deals/${did}/billboard/photo`, {
    method: "POST",
    credentials: "include",
    body: fd,
  }).then(r => r.json());
};

// ── Restaurant: QR Kit Orders ─────────────────────────────────────────────
export const getQrKitPreviewUrl = (rid, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return `${API}/operator/restaurants/${rid}/qr-kit-orders/preview${qs ? `?${qs}` : ""}`;
};
export const getQrMerchandiseCatalog = (rid) =>
  get(`/operator/restaurants/${rid}/qr-kit-orders/catalog`);
export const getQrMerchandiseQuote = (rid, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/operator/restaurants/${rid}/qr-kit-orders/quote${qs ? `?${qs}` : ""}`);
};
export const requestQrMerchandiseBulkQuote = (rid, body) =>
  post(`/operator/restaurants/${rid}/qr-kit-orders/bulk-quote-requests`, body);
export const getQrMerchandiseEntitlements = (rid) =>
  get(`/operator/restaurants/${rid}/qr-kit-orders/entitlements`);
export const fulfillQrMerchandiseEntitlement = (rid, body) =>
  post(`/operator/restaurants/${rid}/qr-kit-orders/entitlements/fulfill`, body);
export const createQrKitOrder = (rid, body) => post(`/operator/restaurants/${rid}/qr-kit-orders`, body);
export const getQrKitOrder = (rid, orderId) => get(`/operator/restaurants/${rid}/qr-kit-orders/${orderId}`);

export async function uploadQrDoorPhoto(rid, file) {
  const formData = new FormData();
  formData.append("photo", file);
  const res = await fetch(`${API}/operator/restaurants/${rid}/qr-kit-orders/door-photo`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
  return json;
}

// ── Restaurant: Primary Digital QR ───────────────────────────────────────
export const getPrimaryQr = (rid) => get(`/operator/restaurants/${rid}/qr`);

// ── Restaurant: Sticker QR (/r/DOOR-...) ─────────────────────────────────
export const getOperatorQrStickers = (rid) => get(`/operator/restaurants/${rid}/qr-stickers`);
export const validateOperatorQrStickerActivation = (rid, body) =>
  post(`/operator/restaurants/${rid}/qr-stickers/activate/validate`, body);
export const activateOperatorQrSticker = (rid, body) =>
  post(`/operator/restaurants/${rid}/qr-stickers/activate`, body);
export const generateOperatorQrStickerBatch = (body) =>
  post(`/operator/qr-stickers/generate-batch`, body);
export const previewOperatorQrStickerUrl = (rid, qrCode) =>
  `${API}/operator/restaurants/${rid}/qr-stickers/${encodeURIComponent(qrCode)}/preview`;
export const downloadOperatorQrStickerUrl = (rid, qrCode) =>
  `${API}/operator/restaurants/${rid}/qr-stickers/${encodeURIComponent(qrCode)}/download`;
export const downloadOperatorQrStickerPngUrl = (rid, qrCode) =>
  `${API}/operator/restaurants/${rid}/qr-stickers/${encodeURIComponent(qrCode)}/download-png`;
export const deactivateOperatorQrSticker = (rid, qrCode) =>
  post(`/operator/restaurants/${rid}/qr-stickers/${encodeURIComponent(qrCode)}/deactivate`, {});
export const replaceOperatorQrSticker = (rid, qrCode) =>
  post(`/operator/restaurants/${rid}/qr-stickers/${encodeURIComponent(qrCode)}/replace`, {});

// ── PayPal Platform Billing (retained; disabled for new restaurant signups) ─
export const getPayPalCheckoutPlans = () =>
  get("/api/paypal/platform/plans");
export const createPayPalSubscriptionCheckout = (body) =>
  post("/api/paypal/platform/subscription-checkout", body);
export const cancelPayPalSubscription = (body) =>
  post("/api/paypal/platform/subscriptions/cancel", body);
export const getPayPalSubscriptionStatus = (restaurantId) =>
  get(`/api/paypal/platform/subscriptions/${restaurantId}`);
export const createPayPalMarketplaceReferral = (body) =>
  post("/api/paypal/platform/marketplace/referral-link", body);
export const getPayPalMarketplaceStatus = (restaurantId) =>
  get(`/api/paypal/platform/marketplace/status/${restaurantId}`);

// ── Stripe Platform Billing (primary for restaurant subscriptions + QR kits) ─
export const getCheckoutPlans = () =>
  get("/api/stripe/platform/plans");
export const createPlatformPaymentIntent = (body) =>
  post("/api/stripe/platform/payment-intents", body);
export const createPlatformCheckoutSession = (body) =>
  post("/api/stripe/platform/checkout-sessions", body);
export const createPlatformSubscription = (body) =>
  post("/api/stripe/platform/subscriptions", body);
export const cancelPlatformSubscription = (body) =>
  post("/api/stripe/platform/subscriptions/cancel", body);
export const getPlatformSubscriptionStatus = (restaurantId) =>
  get(`/api/stripe/platform/subscriptions/${restaurantId}`);

// ── Stripe Connect (marketplace restaurant payouts) ───────────────────────
export const getStripeConnectStatus = (restaurantId) =>
  get(`/api/stripe/connect/status/${restaurantId}`);
export const startStripeConnectOnboarding = (restaurantId) =>
  post("/api/stripe/connect/start", { restaurantId });
export const createStripeConnectDashboardLink = (restaurantId) =>
  post("/api/stripe/connect/dashboard-link", { restaurantId });

// ── Restaurant: Hours ─────────────────────────────────────────────────────
export const getHours = (rid) => get(`/operator/restaurants/${rid}/hours`);
export const updateHours = (rid, schedule) => put(`/operator/restaurants/${rid}/hours`, { schedule });
export const getExceptions = (rid) => get(`/operator/restaurants/${rid}/hours/exceptions`);
export const upsertException = (rid, body) => post(`/operator/restaurants/${rid}/hours/exceptions`, body);
export const deleteException = (rid, eid) => del(`/operator/restaurants/${rid}/hours/exceptions/${eid}`);

// ── Restaurant: Bid-Free Bidding™ ─────────────────────────────────────────
export const getCartNegotiationSettings = (rid) =>
  get(`/operator/restaurants/${rid}/cart-negotiation`);
export const updateCartNegotiationSettings = (rid, body) =>
  patch(`/operator/restaurants/${rid}/cart-negotiation`, body);

export const getUnlockSavingsSettings = (rid) =>
  get(`/operator/restaurants/${rid}/unlock-savings`);
export const updateUnlockSavingsSettings = (rid, body) =>
  patch(`/operator/restaurants/${rid}/unlock-savings`, body);

// ── Restaurant: Display Settings (TV Menu Board) ──────────────────────────
export const getDisplaySettings = (rid) =>
  get(`/operator/restaurants/${rid}/display-settings`);
export const updateDisplaySettings = (rid, body) =>
  patch(`/operator/restaurants/${rid}/display-settings`, body);

// ── Restaurant: Menu Themes (Design Lab) ──────────────────────────────────
export const getMenuThemes = (rid) =>
  get(`/operator/restaurants/${rid}/menu-themes`);
export const saveMenuTheme = (rid, slot, body) =>
  req(`/operator/restaurants/${rid}/menu-themes/${slot}`, { method: "PUT", body: JSON.stringify(body) });
export const activateMenuTheme = (rid, slot) =>
  req(`/operator/restaurants/${rid}/menu-themes/${slot}/activate`, { method: "PATCH", body: "{}" });

// ── Restaurant: Delivery Accounts ─────────────────────────────────────────
export const getDeliverySettings = (rid) =>
  get(`/operator/restaurants/${rid}/delivery`);
export const updateDeliverySettings = (rid, body) =>
  patch(`/operator/restaurants/${rid}/delivery/settings`, body);
export const saveDeliveryProviderAccount = (rid, provider, body) =>
  req(`/operator/restaurants/${rid}/delivery/providers/${provider}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
export const disconnectDeliveryProviderAccount = (rid, provider) =>
  del(`/operator/restaurants/${rid}/delivery/providers/${provider}`);

// ── Restaurant: Orders (existing endpoints — do not remove) ───────────────
export const getRestaurantOrders = (rid, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return get(`/api/orders/restaurant/${rid}${qs ? `?${qs}` : ""}`);
};
export const getRestaurantOrderDetail = (orderId) =>
  get(`/api/orders/${orderId}/detail`);
export const updateRestaurantOrderStatus = (orderId, orderStatus) =>
  patch(`/api/orders/${orderId}/status`, { orderStatus });

// ── Restaurant: Order Receiver (KDS operator endpoints) ───────────────────
export const getLiveOrders = (rid) =>
  get(`/operator/restaurants/${rid}/orders/live`);

export const getOrderAvailability = (rid) =>
  get(`/operator/restaurants/${rid}/orders/availability`);

export const updateOrderAvailability = (rid, body) =>
  patch(`/operator/restaurants/${rid}/orders/availability`, body);

export const getOperatorOrderDetail = (rid, orderId) =>
  get(`/operator/restaurants/${rid}/orders/${orderId}`);

export const acceptOrder = (rid, orderId) =>
  post(`/operator/restaurants/${rid}/orders/${orderId}/accept`, {});

export const confirmOrder = (rid, orderId) =>
  acceptOrder(rid, orderId);

export const cancelOrder = (rid, orderId, reason = "") =>
  post(`/operator/restaurants/${rid}/orders/${orderId}/cancel`, {
    cancellation_reason: reason,
  });

export const declineOrder = (rid, orderId, body = {}) =>
  post(`/operator/restaurants/${rid}/orders/${orderId}/decline`, body);

export const markOrderPreparing = (rid, orderId) =>
  post(`/operator/restaurants/${rid}/orders/${orderId}/prepare`, {});

export const markOrderReady = (rid, orderId) =>
  post(`/operator/restaurants/${rid}/orders/${orderId}/ready`, {});

export const markOrderCompleted = (rid, orderId) =>
  post(`/operator/restaurants/${rid}/orders/${orderId}/complete`, {});

export const confirmDeliveryPickup = (rid, orderId) =>
  post(`/operator/restaurants/${rid}/orders/${orderId}/picked-up`, {});

export const getOrderHistory = (rid, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  ).toString();
  return get(`/operator/restaurants/${rid}/orders/history${qs ? `?${qs}` : ""}`);
};

// ── Restaurant: Menu Studio — Schedules (Pro) ─────────────────────────────
export const duplicateMenu = (rid, mid) =>
  post(`/operator/restaurants/${rid}/menus/${mid}/duplicate`, {});
export const getMenuSchedules = (rid, mid) =>
  get(`/operator/restaurants/${rid}/menus/${mid}/schedules`);
export const createMenuSchedule = (rid, mid, body) =>
  post(`/operator/restaurants/${rid}/menus/${mid}/schedules`, body);
export const updateMenuSchedule = (rid, mid, sid, body) =>
  req(`/operator/restaurants/${rid}/menus/${mid}/schedules/${sid}`, { method: "PATCH", body: JSON.stringify(body) });
export const deleteMenuSchedule = (rid, mid, sid) =>
  del(`/operator/restaurants/${rid}/menus/${mid}/schedules/${sid}`);
export const activateMenuNow = (rid, mid) =>
  post(`/operator/restaurants/${rid}/menus/${mid}/activate-now`, {});
export const clearMenuOverride = (rid) =>
  del(`/operator/restaurants/${rid}/menus/override`);
export const getActiveMenu = (rid) =>
  get(`/operator/restaurants/${rid}/menus/active-menu`);

// ── Restaurant: Menu Studio — Outputs (Pro) ───────────────────────────────
export const getMenuOutputs = (rid) =>
  get(`/operator/restaurants/${rid}/outputs`);
export const createMenuOutput = (rid, body) =>
  post(`/operator/restaurants/${rid}/outputs`, body);
export const getMenuOutput = (rid, oid) =>
  get(`/operator/restaurants/${rid}/outputs/${oid}`);
export const triggerMenuOutputExport = (rid, oid) =>
  post(`/operator/restaurants/${rid}/outputs/${oid}/export`, {});
export const deleteMenuOutput = (rid, oid) =>
  del(`/operator/restaurants/${rid}/outputs/${oid}`);

// ── Restaurant: Menu Studio — Brand (Pro) ─────────────────────────────────
export const getBrandProfile = (rid) =>
  get(`/operator/restaurants/${rid}/brand`);
export const updateBrandProfile = (rid, body) =>
  patch(`/operator/restaurants/${rid}/brand`, body);
export const uploadBrandLogo = (rid, body) =>
  post(`/operator/restaurants/${rid}/brand/logo`, body);
export const removeBrandLogo = (rid) =>
  del(`/operator/restaurants/${rid}/brand/logo`);
export const uploadBrandHero = (rid, file) => {
  const formData = new FormData();
  formData.append("hero", file);
  return reqForm(`/operator/restaurants/${rid}/brand/hero`, formData);
};
export const removeBrandHero = (rid) =>
  del(`/operator/restaurants/${rid}/brand/hero`);

// ── Menu item photos ──────────────────────────────────────────────────────
export const listMenuItemPhotos = (itemId) =>
  get(`/operator/menu-items/${itemId}/photos`);
export const uploadMenuItemPhoto = (itemId, file, { isPrimary = true } = {}) => {
  const formData = new FormData();
  formData.append("photo", file);
  if (isPrimary) formData.append("is_primary", "true");
  return reqForm(`/operator/menu-items/${itemId}/photo`, formData);
};
export const patchMenuItemPhoto = (photoId, body) =>
  patch(`/operator/menu-item-photos/${photoId}`, body);
export const deleteMenuItemPhoto = (photoId) =>
  del(`/operator/menu-item-photos/${photoId}`);
export const restoreMenuItemPhoto = (photoId) =>
  patch(`/operator/menu-item-photos/${photoId}`, { status: "active", is_primary: true });

// ── Restaurant: Adobe Usage (Pro) ─────────────────────────────────────────
export const getAdobeUsageSummary = (rid) =>
  get(`/operator/restaurants/${rid}/adobe-usage`);

// ── Support ───────────────────────────────────────────────────────────────
export const getHelpKnownIssues = () => get("/operator/help/known-issues");
export const getTickets = () => get("/operator/support/tickets");
export const createTicket = (body) => post("/operator/support/tickets", body);
export const replyTicket = (tid, message) => post(`/operator/support/tickets/${tid}/messages`, { message });

// ── Restaurant: Owner PIN / Security ─────────────────────────────────────
export const getSensitiveSession = (rid) =>
  get(`/operator/restaurants/${rid}/security/sensitive-session`);
export const setupOwnerPin = (rid, pin) =>
  post(`/operator/restaurants/${rid}/security/pin/setup`, { pin });
export const verifyOwnerPin = (rid, pin) =>
  post(`/operator/restaurants/${rid}/security/pin/verify`, { pin });
export const resetOwnerPin = (rid) =>
  post(`/operator/restaurants/${rid}/security/pin/reset`, {});

// ── Food Truck: Current Location ──────────────────────────────────────────
export const updateFoodTruckCurrentLocation = (id, data) =>
  patch(`/api/food-trucks/${id}/current-location`, data);

// ── Camera menu upload (page-by-page OCR + owner review) ───────────────────
async function reqForm(path, formData, { method = "POST" } = {}) {
  const language = readStoredLanguage();
  const localizedPath = appendLanguageParam(path, language);
  const res = await fetch(`${API}${localizedPath}`, {
    method,
    credentials: "include",
    headers: withLanguageHeaders({}, language),
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.error || json.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.payload = json;
    throw error;
  }
  return json;
}

export const createMenuCameraSession = (restaurantId) =>
  post("/operator/menu-camera-upload/sessions", { restaurant_id: restaurantId });

export const getMenuCameraSession = (sessionId, restaurantId) =>
  get(
    `/operator/menu-camera-upload/sessions/${encodeURIComponent(sessionId)}?restaurant_id=${restaurantId}`
  );

export const uploadMenuCameraPage = (sessionId, restaurantId, pageNumber, formData) => {
  formData.set("restaurant_id", String(restaurantId));
  formData.set("page_number", String(pageNumber));
  return reqForm(`/operator/menu-camera-upload/sessions/${encodeURIComponent(sessionId)}/pages`, formData);
};

export const processMenuCameraPage = (sessionId, restaurantId, pageNumber) =>
  post(
    `/operator/menu-camera-upload/sessions/${encodeURIComponent(sessionId)}/pages/${pageNumber}/process`,
    { restaurant_id: restaurantId }
  );

export const updateMenuCameraPageItems = (sessionId, restaurantId, pageNumber, items) =>
  patch(
    `/operator/menu-camera-upload/sessions/${encodeURIComponent(sessionId)}/pages/${pageNumber}`,
    { restaurant_id: restaurantId, items }
  );

export const confirmMenuCameraPage = (sessionId, restaurantId, pageNumber) =>
  post(
    `/operator/menu-camera-upload/sessions/${encodeURIComponent(sessionId)}/pages/${pageNumber}/confirm`,
    { restaurant_id: restaurantId }
  );

export const finalizeMenuCameraSession = (sessionId, restaurantId) =>
  post(
    `/operator/menu-camera-upload/sessions/${encodeURIComponent(sessionId)}/finalize`,
    { restaurant_id: restaurantId }
  );
