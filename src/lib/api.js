// menubloc-frontend/src/lib/api.js
// Minimal API helper used across the frontend.
// No React / JSX should ever be in this file.

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

export async function apiGet(path) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, { method: "GET" });
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

// Common endpoints (optional helpers)
export async function searchPublicMenu(query) {
  const q = encodeURIComponent(query || "");
  return apiGet(`/public/search?q=${q}`);
}

export async function getRestaurantMenu(restaurantId) {
  return apiGet(`/public/restaurants/${encodeURIComponent(String(restaurantId))}/menu`);
}

export default {
  apiGet,
  apiPost,
  searchPublicMenu,
  getRestaurantMenu,
};
