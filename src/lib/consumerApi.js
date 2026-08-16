/**
 * ============================================================
 * Path: menubloc-frontend/src/lib/consumerApi.js
 * Purpose:
 *   Consumer API client. Uses session cookies (credentials:include).
 *   Mirrors the pattern used in operatorApi.js.
 * ============================================================
 */

import { appendLanguageParam, readStoredLanguage, withLanguageHeaders } from "./languageApi.js";

const VITE_ENV = import.meta.env || {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

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

const get  = (path)        => req(path);
const post = (path, body)  => req(path, { method: "POST",   body: JSON.stringify(body) });
const put  = (path, body)  => req(path, { method: "PUT",    body: JSON.stringify(body) });
const patch = (path, body) => req(path, { method: "PATCH",  body: JSON.stringify(body) });
const del  = (path)        => req(path, { method: "DELETE" });

// ── Auth ──────────────────────────────────────────────────────────────────
export const getConsumerSession    = ()                    => get("/api/consumer-auth/me");
export const signupConsumer        = (body)                => post("/api/consumer-auth/signup", body);
export const loginConsumer         = (email, password)     => post("/api/consumer-auth/login", { email, password });
export const loginConsumerWithGoogle = (credential, consent = {}) => post("/api/consumer-auth/google", { credential, ...consent });
export const loginConsumerWithApple  = (body)              => post("/api/consumer-auth/apple", body);
export const logoutConsumer        = ()                    => post("/api/consumer-auth/logout", {});
export const forgotPassword        = (email)               => post("/api/consumer-auth/forgot-password", { email });
export const validateResetToken    = (token)               => get(`/api/consumer-auth/reset-password?token=${encodeURIComponent(token)}`);
export const resetPassword         = (token, password)     => post("/api/consumer-auth/reset-password", { token, password });
export const changePassword        = (currentPassword, newPassword) => post("/api/consumer-auth/change-password", { current_password: currentPassword, new_password: newPassword });
export const sendSmsCode           = (phone_number)        => post("/api/consumer-auth/sms/send",   { phone_number });
export const verifySmsCode         = (phone_number, code, verification_sid = null)  => post("/api/consumer-auth/sms/verify", { phone_number, code, verification_sid });
export const sendPhoneChangeCode   = (phone_number)        => post("/api/consumer-auth/phone/send", { phone_number });
export const verifyPhoneChangeCode = (phone_number, code, verification_sid = null) =>
  post("/api/consumer-auth/phone/verify", { phone_number, code, verification_sid });
export const sendEduVerification = (edu_email) =>
  post("/api/consumer-auth/edu/send", { edu_email });
export const peekEduVerification = (token) =>
  get(`/api/consumer-auth/edu/verify?token=${encodeURIComponent(token)}`);
export const confirmEduVerification = (token) =>
  post("/api/consumer-auth/edu/verify", { token });

// ── Connections (people — not restaurant Following) ───────────────────────
export const listConnections = (status = null) =>
  get(
    status
      ? `/api/consumer/connections?status=${encodeURIComponent(status)}`
      : "/api/consumer/connections"
  );
export const requestConnection = (body) => post("/api/consumer/connections", body);
export const acceptConnection = (id) =>
  post(`/api/consumer/connections/${encodeURIComponent(String(id))}/accept`, {});
export const declineConnection = (id) =>
  post(`/api/consumer/connections/${encodeURIComponent(String(id))}/decline`, {});
export const removeConnection = (id) =>
  del(`/api/consumer/connections/${encodeURIComponent(String(id))}`);

// ── Personal Diner QR (Phase 1) ───────────────────────────────────────────
export const getMyDinerQr = () => get("/api/consumer/diner-qr");
export const updateDinerQrPrivacy = (body) => put("/api/consumer/diner-qr/privacy", body);
export const connectViaDinerQr = (token) =>
  post(`/api/consumer/diner-qr/${encodeURIComponent(String(token))}/connect`, {});
export const fetchPublicDinerQr = (token) =>
  get(`/api/public/diner-qr/${encodeURIComponent(String(token))}`);

export async function uploadDinerAvatar(file) {
  const language = readStoredLanguage();
  const form = new FormData();
  form.append("avatar", file);
  const localizedPath = appendLanguageParam("/api/consumer/profile/avatar", language);
  const res = await fetch(`${API}${localizedPath}`, {
    method: "POST",
    credentials: "include",
    headers: withLanguageHeaders({}, language),
    body: form,
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

/** Absolute URL for diner avatar or QR image paths served by the API. */
export function resolveConsumerMediaUrl(pathOrUrl) {
  const raw = String(pathOrUrl || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API}${raw}`;
  return `${API}/${raw}`;
}

// ── Dining Crews ──────────────────────────────────────────────────────────
export const listDiningCrews = () => get("/api/consumer/dining-crews");
export const discoverPublicDiningCrews = ({ q = "", limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return get(`/api/consumer/dining-crews/discover${qs ? `?${qs}` : ""}`);
};
export const createDiningCrew = (payload) => {
  const body =
    typeof payload === "string" || payload == null
      ? { name: payload }
      : {
          name: payload.name,
          description: payload.description,
          visibility: payload.visibility,
          max_members: payload.max_members,
          membership_approval: payload.membership_approval,
        };
  return post("/api/consumer/dining-crews", body);
};
export const getDiningCrew = (crewId) =>
  get(`/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}`);
export const updateDiningCrew = (crewId, body = {}) =>
  patch(`/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}`, body);
export const inviteToDiningCrew = (crewId, body = {}) =>
  post(`/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}/invitations`, body);
export const requestJoinDiningCrew = (crewId) =>
  post(`/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}/join-requests`, {});
export const listDiningCrewJoinRequests = (crewId) =>
  get(`/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}/join-requests`);
export const resolveDiningCrewJoinRequest = (crewId, requestId, decision) =>
  post(
    `/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}/join-requests/${encodeURIComponent(String(requestId))}/resolve`,
    { decision }
  );
export const voteDiningCrewJoinRequest = (crewId, requestId, vote) =>
  post(
    `/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}/join-requests/${encodeURIComponent(String(requestId))}/vote`,
    { vote }
  );
export const setDiningCrewMemberRole = (crewId, userId, role) =>
  post(
    `/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}/members/${encodeURIComponent(String(userId))}/role`,
    { role }
  );
export const getDiningCrewInvitation = (token) =>
  get(`/api/consumer/dining-crews/invitations/${encodeURIComponent(String(token))}`);
export const acceptDiningCrewInvitation = (token) =>
  post(`/api/consumer/dining-crews/invitations/${encodeURIComponent(String(token))}/accept`, {});
export const declineDiningCrewInvitation = (token) =>
  post(`/api/consumer/dining-crews/invitations/${encodeURIComponent(String(token))}/decline`, {});
export const listDiningCrewConversations = (crewId) =>
  get(`/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}/conversations`);
export const startDiningCrewConversation = (crewId, title = null) =>
  post(`/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}/conversations`, {
    title,
  });
export const listDiningCrewMessages = (conversationId) =>
  get(
    `/api/consumer/dining-crews/conversations/${encodeURIComponent(String(conversationId))}/messages`
  );
export const postDiningCrewMessage = (conversationId, body) =>
  post(
    `/api/consumer/dining-crews/conversations/${encodeURIComponent(String(conversationId))}/messages`,
    body
  );
export async function postDiningCrewPhoto(conversationId, { file, body = null, restaurant_id = null, menu_item_id = null, cluster_id = null } = {}) {
  const language = readStoredLanguage();
  const path = appendLanguageParam(
    `/api/consumer/dining-crews/conversations/${encodeURIComponent(String(conversationId))}/photos`,
    language
  );
  const form = new FormData();
  form.append("photo", file);
  if (body) form.append("body", body);
  if (restaurant_id) form.append("restaurant_id", String(restaurant_id));
  if (menu_item_id) form.append("menu_item_id", String(menu_item_id));
  if (cluster_id) form.append("cluster_id", String(cluster_id));
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    headers: withLanguageHeaders({}, language),
    body: form,
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
export const CONSUMER_API_BASE = API;
export const searchDiningCrewEntities = ({ type, q = "", restaurant_id = null, limit = 8 } = {}) => {
  const params = new URLSearchParams();
  if (type) params.set("type", String(type));
  if (q) params.set("q", String(q));
  if (restaurant_id) params.set("restaurant_id", String(restaurant_id));
  if (limit) params.set("limit", String(limit));
  return get(`/api/consumer/dining-crews/entity-search?${params.toString()}`);
};

// ── I'm Eating / food activity ────────────────────────────────────────────
export const listMyFoodActivity = (limit = null) =>
  get(
    limit
      ? `/api/consumer/food-activity?limit=${encodeURIComponent(String(limit))}`
      : "/api/consumer/food-activity"
  );
export const createImEating = (body) => post("/api/consumer/food-activity", body);
export const deleteMyFoodActivity = (id) =>
  del(`/api/consumer/food-activity/${encodeURIComponent(String(id))}`);

// ── Diner Status (quick emoji signals) ────────────────────────────────────
export const listMyDinerStatuses = (limit = null) =>
  get(
    limit
      ? `/api/consumer/diner-statuses?limit=${encodeURIComponent(String(limit))}`
      : "/api/consumer/diner-statuses"
  );
export const createDinerStatus = (body) => post("/api/consumer/diner-statuses", body);
export const deleteMyDinerStatus = (id) =>
  del(`/api/consumer/diner-statuses/${encodeURIComponent(String(id))}`);

// ── Cluster subscriptions (food report feed) ──────────────────────────────
export const listMyClusterSubscriptions = (includePaused = false) =>
  get(
    `/api/consumer/cluster-subscriptions${includePaused ? "?include_paused=1" : ""}`
  );
export const getClusterSubscriptionStatus = (clusterId) =>
  get(`/api/consumer/cluster-subscriptions/${encodeURIComponent(String(clusterId))}`);
export const subscribeToCluster = (clusterId) =>
  post(`/api/consumer/cluster-subscriptions/${encodeURIComponent(String(clusterId))}`, {});
export const unsubscribeFromCluster = (clusterId) =>
  del(`/api/consumer/cluster-subscriptions/${encodeURIComponent(String(clusterId))}`);
export const fetchClusterReportFeed = ({ hours = 72, maxClusters = 8 } = {}) => {
  const params = new URLSearchParams();
  if (hours) params.set("hours", String(hours));
  if (maxClusters) params.set("max_clusters", String(maxClusters));
  const qs = params.toString();
  return get(`/api/consumer/cluster-report-feed${qs ? `?${qs}` : ""}`);
};

export const getSocialOnboarding = () => get("/api/consumer/social-onboarding");
export const putSocialOnboarding = (onboarding) =>
  put("/api/consumer/social-onboarding", { onboarding });

// ── Profile ───────────────────────────────────────────────────────────────
export const getConsumerProfile    = ()     => get("/api/consumer/profile");
export const updateConsumerProfile = (body) => put("/api/consumer/profile", body);
export const getFollowedRestaurants = ()    => get("/api/consumer/followed-restaurants");

// ── Preferences ───────────────────────────────────────────────────────────
export const getPreferences        = ()     => get("/api/consumer/profile/preferences");
export const updatePreferences     = (body) => put("/api/consumer/profile/preferences", body);

// ── Saved Locations ───────────────────────────────────────────────────────
export const getLocations          = ()         => get("/api/consumer/profile/locations");
export const addLocation           = (body)     => post("/api/consumer/profile/locations", body);
export const updateLocation        = (id, body) => put(`/api/consumer/profile/locations/${id}`, body);
export const deleteLocation        = (id)       => del(`/api/consumer/profile/locations/${id}`);

// ── Foods To Avoid ────────────────────────────────────────────────────────
export const getFoodsToAvoid     = ()     => get("/api/consumer/foods-to-avoid");
export const updateFoodsToAvoid  = (keys) => put("/api/consumer/foods-to-avoid", { foods_to_avoid: keys });

// ── Restaurant Follows ─────────────────────────────────────────────────────
export const getRestaurantFollowStatus = (restaurantId) =>
  get(`/api/restaurants/${encodeURIComponent(String(restaurantId))}/follow-status`);
export const followRestaurant = (restaurantId) =>
  post(`/api/restaurants/${encodeURIComponent(String(restaurantId))}/follow`, {});
export const unfollowRestaurant = (restaurantId) =>
  del(`/api/restaurants/${encodeURIComponent(String(restaurantId))}/follow`);

// ── Menu Item Likes ────────────────────────────────────────────────────────────
export const getLikedMenuItems = () =>
  get(`/api/consumer/menu-item-likes`);
export const getMenuItemLikeStatus = (menuItemId) =>
  get(`/api/consumer/menu-item-likes/${encodeURIComponent(String(menuItemId))}`);
export const likeMenuItem = (menuItemId) =>
  post(`/api/consumer/menu-item-likes/${encodeURIComponent(String(menuItemId))}`, {});
export const unlikeMenuItem = (menuItemId) =>
  del(`/api/consumer/menu-item-likes/${encodeURIComponent(String(menuItemId))}`);

// ── Private order feedback ────────────────────────────────────────────────
export const getEligibleOrderFeedback = () =>
  get("/api/consumer/order-feedback/eligible");
export const getMyOrderFeedback = () => get("/api/consumer/order-feedback");
export const submitOrderFeedback = (body) =>
  post("/api/consumer/order-feedback", body);
