/**
 * Distributor network API client.
 * Uses shared DEFAULT_PROD_API_BASE pattern (Railway fallback — not same-origin).
 */

const VITE_ENV = import.meta.env || {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

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
const post = (path, body) => req(path, { method: "POST", body: JSON.stringify(body || {}) });
const patch = (path, body) =>
  req(path, { method: "PATCH", body: JSON.stringify(body || {}) });

export const getDistributorSession = () => get("/distributor/auth/me");
export const loginDistributor = (email, password, distributorId = null) =>
  post("/distributor/auth/login", {
    email,
    password,
    distributor_id: distributorId || undefined,
  });
export const logoutDistributor = () => post("/distributor/auth/logout", {});
export const switchDistributor = (distributorId) =>
  post("/distributor/auth/switch-distributor", { distributor_id: distributorId });

export const getDistributorDashboard = () => get("/distributor/dashboard");

export const listDistributorCatalog = () => get("/distributor/catalog/distributors");

export function searchDistributorRestaurants(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== "") qs.set(k, String(v).trim());
  });
  const q = qs.toString();
  return get(`/distributor/restaurants/search${q ? `?${q}` : ""}`);
}

export const getReportedRestaurants = () => get("/distributor/restaurants/reported");
export const getConnectedRestaurants = () => get("/distributor/restaurants/connected");
export const getPendingRestaurants = () => get("/distributor/restaurants/pending");
export const getDistributorRestaurant = (restaurantId) =>
  get(`/distributor/restaurants/${restaurantId}`);
export const requestRestaurantConnection = (restaurantId) =>
  post(`/distributor/restaurants/${restaurantId}/connection-requests`, {});

export const getDistributorInbox = () => get("/distributor/messages/inbox");
export const getDistributorMessages = (relationshipId) =>
  get(`/distributor/relationships/${relationshipId}/messages`);
export const postDistributorMessage = (relationshipId, body) =>
  post(`/distributor/relationships/${relationshipId}/messages`, { body });

/** Claimed-distributor public profile editor */
export const getDistributorPublicProfile = () => get("/distributor/profile");
export const updateDistributorPublicProfile = (body) =>
  patch("/distributor/profile", body);
