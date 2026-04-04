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
    throw new Error(msg);
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
    throw new Error(msg);
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
  getOrder,
  toConsumerErrorMessage,
};
