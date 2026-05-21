// ============================================================
// Path: menubloc-frontend/src/lib/api.js
// File: api.js
// Date: 2026-03-06
// Purpose:
//   Minimal API helper used across the frontend.
//   No React / JSX should ever be in this file.
//   Added apiPatch for QR code activate/deactivate support.
// ============================================================

// VITE_API_BASE_URL must be set in Vercel env vars for production.
// In local dev it falls back to localhost:3001 automatically.
const VITE_ENV = import.meta.env || {};

const API_BASE = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : "")
).replace(/\/$/, "");

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

export function toConsumerErrorMessage(error, fallbackMessage) {
  if (error?.code === "restaurant_unavailable" && error?.message) {
    return String(error.message);
  }

  const message = String(error?.message || error || "").trim();
  const normalized = message.toLowerCase();

  if (
    !message ||
    normalized === "failed to fetch" ||
    normalized === "server error" ||
    normalized === "not found" ||
    normalized.includes("request failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed") ||
    normalized.startsWith("http ")
  ) {
    return fallbackMessage;
  }

  return message;
}

export async function apiGet(path) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  const data = await safeJson(res);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `GET ${url} failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function apiPost(path, body) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await safeJson(res);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `POST ${url} failed (${res.status})`;
    const error = new Error(msg);
    if (data && typeof data === "object") {
      Object.assign(error, data);
    }
    throw error;
  }
  return data;
}

export async function apiPatch(path, body) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await safeJson(res);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `PATCH ${url} failed (${res.status})`;
    const error = new Error(msg);
    if (data && typeof data === "object") {
      Object.assign(error, data);
    }
    throw error;
  }
  return data;
}

// Common endpoints (optional helpers)
export async function searchPublicMenu(query) {
  const q = encodeURIComponent(query || "");
  return apiGet(`/public/search?q=${q}`);
}

export async function getRestaurantMenu(restaurantId) {
  return apiGet(`/public/restaurants/${encodeURIComponent(String(restaurantId))}/menu`);
}

export async function getBrowseMenus(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });
  return apiGet(`/menus/browse?${search.toString()}`);
}

export async function getBrowseItems(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });
  return apiGet(`/menus/browse-items?${search.toString()}`);
}

export async function previewOrder(body) {
  return apiPost("/api/orders/preview", body);
}

export async function createOrderPaymentIntent(body) {
  return apiPost("/api/orders/create-payment-intent", body);
}

export async function getOrder(orderId) {
  return apiGet(`/api/orders/${encodeURIComponent(String(orderId))}`);
}

export async function createBmtSession(body) {
  return apiPost("/api/bmt/create", body);
}

export async function getBmtSession(token) {
  return apiGet(`/api/bmt/${encodeURIComponent(String(token))}`);
}

export async function createBmtCheckoutSession(token, body) {
  return apiPost(`/api/bmt/${encodeURIComponent(String(token))}/create-checkout-session`, body);
}

/**
 * Preflight: same market gate as GET /menu-items/compare (items must be in the same city/state).
 * Similar rows are already vetted; use when the caller does not have compare_eligible from /similar.
 */
export async function fetchCompareEligibility(baseItemId, candidateItemId) {
  const params = new URLSearchParams({
    baseItemId: String(baseItemId),
    candidateItemId: String(candidateItemId),
  });
  return apiGet(`/menu-items/compare/eligibility?${params.toString()}`);
}

/**
 * Fetch the compare payload for two menu items.
 * Calls GET /menu-items/compare?baseItemId=X&candidateItemId=Y[&lat=Z&lng=W]
 *
 * By default runs GET /menu-items/compare/eligibility first so incompatible pairs never load the heavy payload.
 * Pass { skipEligibilityCheck: true } only when the caller already proved eligibility (e.g. similar row has compare_eligible === true).
 */
export async function fetchCompareItems(baseItemId, candidateItemId, lat, lng, options = {}) {
  if (!options.skipEligibilityCheck) {
    const el = await fetchCompareEligibility(baseItemId, candidateItemId);
    if (!el?.ok || el.eligible !== true) {
      const err = new Error("These menu items cannot be compared.");
      err.code = "COMPARE_INELIGIBLE";
      throw err;
    }
  }
  const params = new URLSearchParams({
    baseItemId: String(baseItemId),
    candidateItemId: String(candidateItemId),
  });
  if (lat != null) params.set("lat", String(lat));
  if (lng != null) params.set("lng", String(lng));
  return apiGet(`/menu-items/compare?${params.toString()}`);
}

/**
 * Fetch item-specific similar dishes for one menu item.
 * Search-card Similar must use the backend route rather than page-level grouped items.
 */
export async function fetchSimilarItems(menuItemId, options = {}) {
  const params = new URLSearchParams();
  if (options.lat != null) params.set("lat", String(options.lat));
  if (options.lng != null) params.set("lng", String(options.lng));

  if (options.filters && typeof options.filters === "object") {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value === null || value === undefined || value === "") continue;
      params.set(key, String(value));
    }
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiGet(`/menu-items/${encodeURIComponent(String(menuItemId))}/similar${suffix}`);
}

export default {
  apiGet,
  apiPost,
  apiPatch,
  searchPublicMenu,
  getRestaurantMenu,
  getBrowseMenus,
  getBrowseItems,
  previewOrder,
  createOrderPaymentIntent,
  createBmtSession,
  getBmtSession,
  createBmtCheckoutSession,
  getOrder,
  toConsumerErrorMessage,
  fetchCompareEligibility,
  fetchCompareItems,
  fetchSimilarItems,
};
