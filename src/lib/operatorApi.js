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

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
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
export const registerOperator = (email, password, full_name) =>
  post("/operator/auth/register", { email, password, full_name });
export const logoutOperator = () => post("/operator/auth/logout", {});
export const requestOperatorRecovery = (email) => post("/operator/auth/forgot", { email });
export const validateOperatorResetToken = (token) =>
  get(`/operator/auth/reset-password?token=${encodeURIComponent(token)}`);
export const resetOperatorPassword = (token, password) =>
  post("/operator/auth/reset-password", { token, password });

// ── Subscription ──────────────────────────────────────────────────────────
export const getSubscription = () => get("/operator/subscription");
export const getPlans = () => get("/operator/subscription/plans");
export const getBillingOverview = (rid) => get(`/operator/restaurants/${rid}/billing/overview`);
export const startBillingCheckout = (rid, body) => post(`/operator/restaurants/${rid}/billing/checkout`, body);
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
export const setFeaturedDish = (rid, menu_item_id) =>
  patch(`/operator/restaurants/${rid}/profile/featured-dish`, { menu_item_id });

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

// ── Restaurant: QR Kit Orders ─────────────────────────────────────────────
export const getQrKitPreviewUrl = (rid, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return `${API}/operator/restaurants/${rid}/qr-kit-orders/preview${qs ? `?${qs}` : ""}`;
};
export const createQrKitOrder = (rid, body) => post(`/operator/restaurants/${rid}/qr-kit-orders`, body);
export const getQrKitOrder = (rid, orderId) => get(`/operator/restaurants/${rid}/qr-kit-orders/${orderId}`);

// ── Restaurant: Hours ─────────────────────────────────────────────────────
export const getHours = (rid) => get(`/operator/restaurants/${rid}/hours`);
export const updateHours = (rid, schedule) => put(`/operator/restaurants/${rid}/hours`, { schedule });
export const getExceptions = (rid) => get(`/operator/restaurants/${rid}/hours/exceptions`);
export const upsertException = (rid, body) => post(`/operator/restaurants/${rid}/hours/exceptions`, body);
export const deleteException = (rid, eid) => del(`/operator/restaurants/${rid}/hours/exceptions/${eid}`);

// ── Restaurant: Display Settings (TV Menu Board) ──────────────────────────
export const getDisplaySettings = (rid) =>
  get(`/operator/restaurants/${rid}/display-settings`);
export const updateDisplaySettings = (rid, body) =>
  patch(`/operator/restaurants/${rid}/display-settings`, body);

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

// ── Restaurant: Adobe Usage (Pro) ─────────────────────────────────────────
export const getAdobeUsageSummary = (rid) =>
  get(`/operator/restaurants/${rid}/adobe-usage`);

// ── Support ───────────────────────────────────────────────────────────────
export const getTickets = () => get("/operator/support/tickets");
export const createTicket = (body) => post("/operator/support/tickets", body);
export const replyTicket = (tid, message) => post(`/operator/support/tickets/${tid}/messages`, { message });
