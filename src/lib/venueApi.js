/**
 * Venue advertising API client.
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
const patch = (path, body) => req(path, { method: "PATCH", body: JSON.stringify(body || {}) });
const del = (path) => req(path, { method: "DELETE" });

export const getVenueSession = () => get("/venue/auth/me");
export const loginVenue = (email, password, venueId = null) =>
  post("/venue/auth/login", { email, password, venue_id: venueId || undefined });
export const logoutVenue = () => post("/venue/auth/logout", {});
export const switchVenue = (venueId) => post("/venue/auth/switch-venue", { venue_id: venueId });

export const getVenueMeta = () => get("/venue/meta");
export const getVenueClusters = () => get("/venue/clusters");

export const listAdInventory = (clusterId = null) => {
  const qs = clusterId ? `?cluster_id=${encodeURIComponent(clusterId)}` : "";
  return get(`/venue/ad-inventory${qs}`);
};
export const getAdInventory = (id) => get(`/venue/ad-inventory/${id}`);
export const createAdInventory = (body) => post("/venue/ad-inventory", body);
export const updateAdInventory = (id, body) => patch(`/venue/ad-inventory/${id}`, body);
export const deleteAdInventory = (id) => del(`/venue/ad-inventory/${id}`);

export const listAdvertisements = (inventoryId = null) => {
  const qs = inventoryId ? `?inventory_id=${encodeURIComponent(inventoryId)}` : "";
  return get(`/venue/advertisements${qs}`);
};
export const getAdvertisement = (id) => get(`/venue/advertisements/${id}`);
export const createAdvertisement = (body) => post("/venue/advertisements", body);
export const updateAdvertisement = (id, body) => patch(`/venue/advertisements/${id}`, body);
export const deleteAdvertisement = (id) => del(`/venue/advertisements/${id}`);

export async function uploadAdImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API}/venue/advertisements/upload-image`, {
    credentials: "include",
    method: "POST",
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.error || `Upload failed (${res.status})`);
    error.status = res.status;
    error.payload = json;
    throw error;
  }
  return json;
}

export const getVenueBilling = () => get("/venue/billing");
export const getVenueStripeSetup = () => get("/venue/stripe-setup");
export const getVenueCampaigns = () => get("/venue/campaigns");
export const getVenueAnalytics = () => get("/venue/analytics");

export const listOwnerVenues = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/api/owner/venues${qs ? `?${qs}` : ""}`);
};
export const getOwnerVenue = (id) => get(`/api/owner/venues/${id}`);
export const createOwnerVenue = (body) => post("/api/owner/venues", body);
export const updateOwnerVenue = (id, body) => patch(`/api/owner/venues/${id}`, body);
export const listAvailableClustersForVenue = (venueId = null) => {
  const qs = venueId ? `?venue_id=${encodeURIComponent(venueId)}` : "";
  return get(`/api/owner/venues/clusters/available${qs}`);
};
export const assignVenueClusters = (id, clusterIds) =>
  req(`/api/owner/venues/${id}/clusters`, {
    method: "PUT",
    body: JSON.stringify({ cluster_ids: clusterIds }),
  });
export const inviteVenueOperator = (id, body) => post(`/api/owner/venues/${id}/memberships`, body);

export const listDestinationVenueLiveFeedVideos = (destinationVenueId) =>
  get(`/api/owner/destination-venues/${encodeURIComponent(String(destinationVenueId))}/live-feed-videos`);

export async function uploadDestinationVenueLiveFeedMedia(destinationVenueId, file) {
  const formData = new FormData();
  formData.append("photo", file);
  const res = await fetch(
    `${API}/api/owner/destination-venues/${encodeURIComponent(String(destinationVenueId))}/live-feed-videos/photo`,
    { credentials: "include", method: "POST", body: formData }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.error || `Upload failed (${res.status})`);
    error.status = res.status;
    error.payload = json;
    throw error;
  }
  return json;
}

export const createDestinationVenueLiveFeedVideo = (destinationVenueId, body) =>
  post(
    `/api/owner/destination-venues/${encodeURIComponent(String(destinationVenueId))}/live-feed-videos`,
    body
  );

export { API as VENUE_API_BASE };
