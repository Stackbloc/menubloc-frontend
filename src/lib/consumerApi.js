/**
 * ============================================================
 * Path: menubloc-frontend/src/lib/consumerApi.js
 * Purpose:
 *   Consumer API client. Uses session cookies (credentials:include).
 *   Mirrors the pattern used in operatorApi.js.
 * ============================================================
 */

import { appendLanguageParam, readStoredLanguage, withLanguageHeaders } from "./languageApi.js";
import { appendGuestFeedClaimToAuthBody } from "./guestFeedClaimSession.js";
import {
  formatBytes,
  MAX_UPLOAD_VIDEO_BYTES,
} from "./consumerCameraCapture.js";
import { notifyFeedMenuFollowsChanged } from "./feedMenuLibrary.js";

const VITE_ENV = import.meta.env || {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";
const API = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

const UPLOAD_TIMEOUT_MS = 90_000;

function isLikelyVideoUpload(file) {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  return type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/.test(name);
}

function mapDinerMediaUploadNetworkError(err, file) {
  const name = String(err?.name || "");
  const msg = String(err?.message || "");
  if (name === "AbortError" || /aborted|timeout/i.test(msg)) {
    return new Error(
      isLikelyVideoUpload(file)
        ? "Video upload timed out. Try a shorter clip (under 15 seconds)."
        : "Upload timed out. Check your connection and try again."
    );
  }
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return new Error(
      isLikelyVideoUpload(file)
        ? "Video upload failed (connection dropped). Try a shorter clip (under 15 seconds)."
        : "Upload failed — check your connection and try again."
    );
  }
  return err instanceof Error ? err : new Error(msg || "Upload failed");
}

async function postDinerMediaMultipart(path, file) {
  if (!file) throw new Error("No file selected");
  if (isLikelyVideoUpload(file) && Number(file.size || 0) > MAX_UPLOAD_VIDEO_BYTES) {
    throw new Error(
      `Video is too large (${formatBytes(file.size)}). Record under 15 seconds and try again.`
    );
  }

  const language = readStoredLanguage();
  const form = new FormData();
  form.append("photo", file);
  const localizedPath = appendLanguageParam(path, language);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${API}${localizedPath}`, {
      method: "POST",
      credentials: "include",
      headers: withLanguageHeaders({}, language),
      body: form,
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(json.error || `Upload failed (${res.status})`);
      error.status = res.status;
      error.payload = json;
      throw error;
    }
    return json;
  } catch (err) {
    throw mapDinerMediaUploadNetworkError(err, file);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function req(path, opts = {}) {
  const { language: langOpt, headers: hdrs, ...fetchOpts } = opts;
  const language = langOpt || readStoredLanguage();
  const localizedPath = appendLanguageParam(path, language);
  const res = await fetch(`${API}${localizedPath}`, {
    credentials: "include",
    ...fetchOpts,
    headers: withLanguageHeaders(
      { "Content-Type": "application/json", ...(hdrs || {}) },
      language,
    ),
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

const get  = (path, opts = {}) => req(path, opts);
const post = (path, body)  => req(path, { method: "POST",   body: JSON.stringify(body) });
const put  = (path, body)  => req(path, { method: "PUT",    body: JSON.stringify(body) });
const patch = (path, body) => req(path, { method: "PATCH",  body: JSON.stringify(body) });
const del  = (path)        => req(path, { method: "DELETE" });

// ── Auth ──────────────────────────────────────────────────────────────────
export const getConsumerSession    = ()                    => get("/api/consumer-auth/me");
export const signupConsumer        = (body)                => post("/api/consumer-auth/signup", appendGuestFeedClaimToAuthBody(body));
export const loginConsumer         = (email, password)     => post("/api/consumer-auth/login", appendGuestFeedClaimToAuthBody({ email, password }));
export const loginConsumerWithGoogle = (credential, consent = {}) => post("/api/consumer-auth/google", { credential, ...consent });
export const loginConsumerWithApple  = (body)              => post("/api/consumer-auth/apple", body);
export const logoutConsumer        = ()                    => post("/api/consumer-auth/logout", {});
export const forgotPassword        = (email)               => post("/api/consumer-auth/forgot-password", { email });
export const validateResetToken    = (token)               => get(`/api/consumer-auth/reset-password?token=${encodeURIComponent(token)}`);
export const resetPassword         = (token, password)     => post("/api/consumer-auth/reset-password", { token, password });
export const changePassword        = (currentPassword, newPassword) => post("/api/consumer-auth/change-password", { current_password: currentPassword, new_password: newPassword });
export const sendSmsCode           = (phone_number, phone_verification_token = null) =>
  post("/api/consumer-auth/sms/send", {
    phone_number,
    ...(phone_verification_token ? { phone_verification_token } : {}),
  });
export const verifySmsCode         = (phone_number, code, verification_sid = null, phone_verification_token = null)  =>
  post("/api/consumer-auth/sms/verify", appendGuestFeedClaimToAuthBody({
    phone_number,
    code,
    verification_sid,
    ...(phone_verification_token ? { phone_verification_token } : {}),
  }));
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
export const listConnections = (status = null, peerId = null) => {
  const q = new URLSearchParams();
  if (status) q.set("status", String(status));
  if (peerId) q.set("peer_id", String(peerId));
  const qs = q.toString();
  return get(qs ? `/api/consumer/connections?${qs}` : "/api/consumer/connections");
};
export const requestConnection = (body) => post("/api/consumer/connections", body);
export const acceptConnection = (id) =>
  post(`/api/consumer/connections/${encodeURIComponent(String(id))}/accept`, {});
export const declineConnection = (id) =>
  post(`/api/consumer/connections/${encodeURIComponent(String(id))}/decline`, {});
export const removeConnection = (id) =>
  del(`/api/consumer/connections/${encodeURIComponent(String(id))}`);

/** Discoverable diner profile (Find Diners / incoming Connect review). */
export const getDiscoverableDiner = (userId) =>
  get(`/api/consumer/diners/${encodeURIComponent(String(userId))}`);
export const blockDiner = (userId) =>
  post(`/api/consumer/diners/${encodeURIComponent(String(userId))}/block`, {});
export const unblockDiner = (userId) =>
  del(`/api/consumer/diners/${encodeURIComponent(String(userId))}/block`);
export const reportDinerAbuse = (userId, body) =>
  post(`/api/consumer/diners/${encodeURIComponent(String(userId))}/report`, body || {});
export const listDinerAbuseReasons = () => get("/api/consumer/diners/abuse-reasons");

export const listConnectionsEating = (limit = 30, peerId = null) => {
  const q = new URLSearchParams({ limit: String(limit) });
  if (peerId) q.set("peer_id", String(peerId));
  return get(`/api/consumer/connections/eating?${q}`);
};

/** Market See Who's Eating video reel (CK menu_item_id on items). */
/**
 * Hide a diner clip from the Public Feed (market discoverability).
 * ate/want/plan: market_discoverable=false (keeps diary / want / plan rows).
 */
export async function hidePublicFeedItem(item) {
  const kind = String(item?.kind || "")
    .trim()
    .toLowerCase();
  const sourceId = item?.source_id != null ? Number(item.source_id) : null;
  if (!Number.isFinite(sourceId) || sourceId <= 0) {
    const err = new Error("Invalid Public Feed item");
    err.code = "invalid_feed_item";
    throw err;
  }
  if (kind === "ate") {
    return updateWhatIAteToday(sourceId, { market_discoverable: false });
  }
  if (kind === "want") {
    return updateWantToEat(sourceId, { market_discoverable: false });
  }
  if (kind === "plan") {
    return updateWhatWeDoingSession(sourceId, { market_discoverable: false });
  }
  if (kind === "cooking") {
    const { setHomemadeDishMarketDiscoverable } = await import("./homemadeDishApi.js");
    return setHomemadeDishMarketDiscoverable(sourceId, false);
  }
  const err = new Error("This clip cannot be removed from Public Feed here");
  err.code = "feed_hide_unsupported";
  throw err;
}

export const listSeeWhosEating = ({ city, state, limit = 20, cursor, kind, channel } = {}) => {
  const q = new URLSearchParams();
  if (city) q.set("city", String(city));
  if (state) q.set("state", String(state));
  if (limit) q.set("limit", String(limit));
  if (cursor) q.set("cursor", String(cursor));
  const feedKind = kind || channel;
  if (feedKind && String(feedKind) !== "all") q.set("kind", String(feedKind));
  const qs = q.toString();
  return get(`/api/consumer/see-whos-eating${qs ? `?${qs}` : ""}`);
};

/** Post–Wanna Eat / Nearby discovery return (value-extraction). */
export const fetchWantDiscovery = ({
  foodName,
  foodInterestKey,
  limit = 12,
} = {}) => {
  const q = new URLSearchParams();
  if (foodName) q.set("food_name", String(foodName));
  if (foodInterestKey) q.set("food_interest_key", String(foodInterestKey));
  if (limit) q.set("limit", String(limit));
  const qs = q.toString();
  return get(`/api/consumer/want-to-eat/discovery${qs ? `?${qs}` : ""}`);
};

/** Phase 5 — connects’ food signals (informational; not matching). */
export const listSocialFoodInfo = ({ limit = 12 } = {}) => {
  const q = new URLSearchParams();
  if (limit) q.set("limit", String(limit));
  const qs = q.toString();
  return get(`/api/consumer/connections/social-food-info${qs ? `?${qs}` : ""}`);
};

/** Phase 7 — Meal Intel from diner food intent (not public Deals). */
export const listMealIntel = ({ limit = 8 } = {}) => {
  const q = new URLSearchParams();
  if (limit) q.set("limit", String(limit));
  const qs = q.toString();
  return get(`/api/consumer/meal-intel${qs ? `?${qs}` : ""}`);
};
export const listConnectionsPlanning = (limit = 30, peerId = null) => {
  const q = new URLSearchParams({ limit: String(limit) });
  if (peerId) q.set("peer_id", String(peerId));
  return get(`/api/consumer/connections/planning?${q}`);
};
export const listConnectionsEvents = (limit = 20, peerId = null) => {
  const q = new URLSearchParams({ limit: String(limit) });
  if (peerId) q.set("peer_id", String(peerId));
  return get(`/api/consumer/connections/events?${q}`);
};

export const fetchRestaurantConnectionSocialProof = (restaurantId) =>
  get(
    `/api/consumer/connections/social-proof/restaurant/${encodeURIComponent(String(restaurantId))}`
  );

export const fetchMenuItemConnectionSocialProof = (menuItemId) =>
  get(
    `/api/consumer/connections/social-proof/menu-item/${encodeURIComponent(String(menuItemId))}`
  );

// ── Personal Diner QR (Phase 1) ───────────────────────────────────────────
export const getMyDinerQr = () => get("/api/consumer/diner-qr");
export const updateDinerQrPrivacy = (body) => put("/api/consumer/diner-qr/privacy", body);
export const connectViaDinerQr = (token) =>
  post(`/api/consumer/diner-qr/${encodeURIComponent(String(token))}/connect`, {});
export const fetchPublicDinerQr = (token) =>
  get(`/api/public/diner-qr/${encodeURIComponent(String(token))}`);

/** Resolve scan landing for /d/:token (personal or Meet Me Here). Hits API host directly. */
export async function resolveDinerQrScan(token) {
  const language = readStoredLanguage();
  const path = `/d/${encodeURIComponent(String(token))}?format=json`;
  const localizedPath = appendLanguageParam(path, language);
  const res = await fetch(`${API}${localizedPath}`, {
    credentials: "omit",
    headers: withLanguageHeaders({ Accept: "application/json" }, language),
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

/** Phase 7 Meet Me Here — creates eat invitation + temporary contextual QR */
export const createMeetMeHere = (body) => post("/api/consumer/meet-me-here", body);

// ── What We Doing? (group planning) ───────────────────────────────────────
export const listWhatWeDoingSessions = () => get("/api/consumer/what-we-doing");
export const deleteWhatWeDoingSession = (tokenOrId) =>
  del(`/api/consumer/what-we-doing/${encodeURIComponent(String(tokenOrId))}`);
export const createWhatWeDoingSession = (body) => post("/api/consumer/what-we-doing", body);
export const updateWhatWeDoingSession = (tokenOrId, body) =>
  patch(`/api/consumer/what-we-doing/${encodeURIComponent(String(tokenOrId))}`, body);
export const getWhatWeDoingSession = (tokenOrId) =>
  get(`/api/consumer/what-we-doing/${encodeURIComponent(String(tokenOrId))}`);
export const addWhatWeDoingParticipants = (tokenOrId, body) =>
  post(`/api/consumer/what-we-doing/${encodeURIComponent(String(tokenOrId))}/participants`, body);
export const joinWhatWeDoingSession = (tokenOrId) =>
  post(`/api/consumer/what-we-doing/${encodeURIComponent(String(tokenOrId))}/join`, {});
export const listPendingEatInvitePeople = () =>
  get("/api/consumer/eat-invitations/pending-people");
export const addWhatWeDoingSuggestion = (tokenOrId, body) =>
  post(`/api/consumer/what-we-doing/${encodeURIComponent(String(tokenOrId))}/suggestions`, body);
export const voteWhatWeDoing = (tokenOrId, suggestion_id) =>
  post(`/api/consumer/what-we-doing/${encodeURIComponent(String(tokenOrId))}/votes`, {
    suggestion_id,
  });
export const closeWhatWeDoingVoting = (tokenOrId) =>
  post(`/api/consumer/what-we-doing/${encodeURIComponent(String(tokenOrId))}/close-voting`, {});
export const makeWhatWeDoingPlan = (tokenOrId, body = {}) =>
  post(`/api/consumer/what-we-doing/${encodeURIComponent(String(tokenOrId))}/make-plan`, body);
export const searchWhatWeDoingRestaurants = (q) =>
  get(`/api/consumer/what-we-doing/search/restaurants?q=${encodeURIComponent(String(q || ""))}`);
export const searchWhatWeDoingVenues = (q) =>
  get(`/api/consumer/what-we-doing/search/venues?q=${encodeURIComponent(String(q || ""))}`);
export const searchWhatWeDoingEvents = (q) =>
  get(`/api/consumer/what-we-doing/search/events?q=${encodeURIComponent(String(q || ""))}`);
export const listConsumerNotifications = () => get("/api/consumer/notifications");
export const markConsumerNotificationRead = (id) =>
  post(`/api/consumer/notifications/${encodeURIComponent(String(id))}/read`, {});

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

export async function uploadConsumerProfileMedia(file) {
  const language = readStoredLanguage();
  const form = new FormData();
  form.append("media", file);
  const localizedPath = appendLanguageParam("/api/consumer/profile/media", language);
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

export const listConsumerProfileMedia = () => get("/api/consumer/profile/media");
export const listPeerProfileMedia = (userId) =>
  get(`/api/consumer/profile/users/${encodeURIComponent(String(userId))}/media`);
export const deleteConsumerProfileMedia = (id) =>
  del(`/api/consumer/profile/media/${encodeURIComponent(String(id))}`);

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
export const listDinerDiningCrews = (dinerId) =>
  get(`/api/consumer/dining-crews/for-diner/${encodeURIComponent(String(dinerId))}`);
export const discoverPublicDiningCrews = ({ q = "", limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return get(`/api/consumer/dining-crews/discover${qs ? `?${qs}` : ""}`);
};
export const deleteDiningCrew = (crewId) =>
  del(`/api/consumer/dining-crews/${encodeURIComponent(String(crewId))}`);

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

/** Common Knowledge cuisine vocabulary for Want-to-Eat cuisine picker. */
export async function listMetaCuisines() {
  return req("/api/meta/cuisines?source=vocabulary");
}

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

export async function uploadFoodActivityPhoto(file) {
  const language = readStoredLanguage();
  const form = new FormData();
  form.append("photo", file);
  const localizedPath = appendLanguageParam("/api/consumer/food-activity/photo", language);
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
export const deleteMyFoodActivity = (id) =>
  del(`/api/consumer/food-activity/${encodeURIComponent(String(id))}`);

export const activateJoinMe = (body) => post("/api/consumer/join-me", body);
export const endJoinMe = (token) =>
  post(`/api/consumer/join-me/${encodeURIComponent(String(token))}/end`, {});

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
export const updatePrimaryLocation = (body) => put("/api/consumer/profile/primary-location", body);
export const searchDiners = (query, cityId = null) => {
  const q = new URLSearchParams();
  if (query) q.set("q", String(query));
  if (cityId) q.set("city_id", String(cityId));
  return get(`/api/consumer/diners/search?${q}`);
};
export const getFollowedRestaurants = ()    => get("/api/consumer/followed-restaurants");

// ── Preferences ───────────────────────────────────────────────────────────
export const getPreferences        = ()     => get("/api/consumer/profile/preferences");
export const updatePreferences     = (body) => put("/api/consumer/profile/preferences", body);
export const getNotificationPreferences = () =>
  get("/api/consumer/notification-preferences");
export const updateNotificationPreferences = (body) =>
  put("/api/consumer/notification-preferences", body);

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
export const followRestaurant = async (restaurantId) => {
  const result = await post(`/api/restaurants/${encodeURIComponent(String(restaurantId))}/follow`, {});
  notifyFeedMenuFollowsChanged();
  return result;
};
export const unfollowRestaurant = async (restaurantId) => {
  const result = await del(`/api/restaurants/${encodeURIComponent(String(restaurantId))}/follow`);
  notifyFeedMenuFollowsChanged();
  return result;
};

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
export const getOrderFeedbackMenuCandidates = (orderId, q = "", { signal } = {}) => {
  const params = new URLSearchParams({ order_id: String(orderId) });
  const query = String(q || "").trim();
  if (query) params.set("q", query);
  return get(
    `/api/consumer/order-feedback/menu-candidates?${params.toString()}`,
    signal ? { signal } : undefined
  );
};
export const submitOrderFeedback = (body) =>
  post("/api/consumer/order-feedback", body);

// ── Venue Event Groups + RSVP (Phase 5) ───────────────────────────────────
export const listMyVenueEvents = () => get("/api/consumer/my/events");
export const listMyVenueEventGroups = () => get("/api/consumer/my/event-groups");

/** Diner-created social events (My Menuply My Events — not venue_events). */
export const listDinerSocialEvents = () => get("/api/consumer/social-events");
export const getDinerSocialEvent = (eventId) =>
  get(`/api/consumer/social-events/${encodeURIComponent(String(eventId))}`);
export const createDinerSocialEvent = (body) => post("/api/consumer/social-events", body);
export const deleteDinerSocialEvent = (eventId) =>
  del(`/api/consumer/social-events/${encodeURIComponent(String(eventId))}`);
export const ensureDinerSocialEventShareLink = (eventId) =>
  post(`/api/consumer/social-events/${encodeURIComponent(String(eventId))}/share-link`, {});
export const fetchPublicSocialEventJoin = (token, { guestKey } = {}) => {
  const params = new URLSearchParams();
  if (guestKey) params.set("guest_key", guestKey);
  const qs = params.toString();
  return get(`/public/social-events/join/${encodeURIComponent(String(token))}${qs ? `?${qs}` : ""}`);
};
export const respondToSocialEventJoin = (token, body) =>
  post(`/public/social-events/join/${encodeURIComponent(String(token))}/respond`, body);

export const setVenueEventRsvp = (eventIdOrSlug, status) =>
  post(`/api/consumer/events/${encodeURIComponent(String(eventIdOrSlug))}/rsvp`, { status });
export const createVenueEventGroup = (eventIdOrSlug, body) =>
  post(`/api/consumer/events/${encodeURIComponent(String(eventIdOrSlug))}/groups`, body);
export const getVenueEventGroup = (groupIdOrSlug) =>
  get(`/api/consumer/event-groups/${encodeURIComponent(String(groupIdOrSlug))}`);
export const joinVenueEventGroup = (groupIdOrSlug) =>
  post(`/api/consumer/event-groups/${encodeURIComponent(String(groupIdOrSlug))}/join`, {});
export const leaveVenueEventGroup = (groupIdOrSlug) =>
  post(`/api/consumer/event-groups/${encodeURIComponent(String(groupIdOrSlug))}/leave`, {});
export const inviteToVenueEventGroup = (groupIdOrSlug, body = {}) =>
  post(
    `/api/consumer/event-groups/${encodeURIComponent(String(groupIdOrSlug))}/invitations`,
    body
  );
export const getVenueEventGroupInvitation = (token) =>
  get(`/api/consumer/event-groups/invitations/${encodeURIComponent(String(token))}`);
export const acceptVenueEventGroupInvitation = (token) =>
  post(`/api/consumer/event-groups/invitations/${encodeURIComponent(String(token))}/accept`, {});

function localDateYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const listWhatIAteToday = (eatenOn = localDateYmd()) =>
  get(`/api/consumer/what-i-ate-today?eaten_on=${encodeURIComponent(eatenOn)}`);
export const listWhatIAteTodayCalendar = (from, to) =>
  get(
    `/api/consumer/what-i-ate-today/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
export const listPeerWhatIAteToday = (userId, eatenOn = localDateYmd()) =>
  get(
    `/api/consumer/what-i-ate-today/users/${encodeURIComponent(String(userId))}?eaten_on=${encodeURIComponent(eatenOn)}`
  );
export const listPeerWhatIAteTodayCalendar = (userId, from, to) =>
  get(
    `/api/consumer/what-i-ate-today/users/${encodeURIComponent(String(userId))}/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
export const setWhatIAteTodayVisibility = (visible) =>
  put("/api/consumer/what-i-ate-today/visibility", { visible: Boolean(visible) });
export const suggestWhatIAteTodayMenuItems = (q, { signal } = {}) =>
  get(
    `/api/consumer/what-i-ate-today/suggestions?q=${encodeURIComponent(String(q || ""))}`,
    signal ? { signal } : undefined
  );
export const createWhatIAteToday = (body) => post("/api/consumer/what-i-ate-today", body);
export const updateWhatIAteToday = (id, body) =>
  patch(`/api/consumer/what-i-ate-today/${encodeURIComponent(String(id))}`, body);
export const deleteWhatIAteToday = (id) =>
  del(`/api/consumer/what-i-ate-today/${encodeURIComponent(String(id))}`);

export const listWantToEat = () => get("/api/consumer/want-to-eat");
export const listPeerWantToEat = (userId) =>
  get(`/api/consumer/want-to-eat/users/${encodeURIComponent(String(userId))}`);
export const createWantToEat = (body) => post("/api/consumer/want-to-eat", body);
export const updateWantToEat = (id, body) =>
  patch(`/api/consumer/want-to-eat/${encodeURIComponent(String(id))}`, body);
export const deleteWantToEat = (id) =>
  del(`/api/consumer/want-to-eat/${encodeURIComponent(String(id))}`);

/** My Month in Food scoreboard (calendar month YYYY-MM). */
export const getMonthInFood = (ym) =>
  get(`/api/consumer/month-in-food${ym ? `?ym=${encodeURIComponent(String(ym))}` : ""}`);
export const getPeerMonthInFood = (peerId, ym) =>
  get(
    `/api/consumer/connections/${encodeURIComponent(String(peerId))}/month-in-food${
      ym ? `?ym=${encodeURIComponent(String(ym))}` : ""
    }`
  );

export async function uploadWantToEatPhoto(file) {
  return postDinerMediaMultipart("/api/consumer/want-to-eat/photo", file);
}

export async function uploadWhatIAteTodayPhoto(file) {
  return postDinerMediaMultipart("/api/consumer/what-i-ate-today/photo", file);
}

export async function uploadEatingPlanMedia(file) {
  return postDinerMediaMultipart("/api/consumer/what-we-doing/photo", file);
}

/** Restaurant dining intent — explicit I want to go (not Food I Want to Eat). */
export const fetchRestaurantDiningIntent = (restaurantId) =>
  get(`/api/public/restaurants/${encodeURIComponent(String(restaurantId))}/dining-intent`);

export const fetchMyRestaurantDiningIntent = (restaurantId) =>
  get(
    `/api/consumer/dining-intent/mine?restaurant_id=${encodeURIComponent(String(restaurantId))}`
  );

/** Owner hub — all active Wanna Go restaurant intents (union UI with Wanna Eat). */
export const listMyDiningIntents = () => get("/api/consumer/dining-intent/mine");

export const createRestaurantDiningIntent = (body) => post("/api/consumer/dining-intent", body);

export const removeRestaurantDiningIntent = (intentId) =>
  del(`/api/consumer/dining-intent/${encodeURIComponent(String(intentId))}`);

export { localDateYmd as whatIAteTodayLocalDate };

// ── @home — Homemade Dish photos ─────────────────────────────────────────
// Public listing for a user's @home profile section.
export const getHomeDishesForUser = (userId) =>
  get(`/api/consumer/homemade-dishes/users/${encodeURIComponent(String(userId))}`);

// Upload a photo to a homemade dish entry (returns photo_url).
export async function uploadHomeDishPhoto(file) {
  const language = readStoredLanguage();
  const form = new FormData();
  form.append("photo", file);
  const localizedPath = appendLanguageParam("/api/consumer/homemade-dishes/photo", language);
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
  return json; // { ok, photo_url }
}

// Create a homemade dish entry (used for @home photo posts).
export const createHomeDish = (body) => post("/api/consumer/homemade-dishes", body);

// Soft-delete own homemade dish (ownership enforced server-side).
export const deleteHomeDish = (dishId) =>
  del(`/api/consumer/homemade-dishes/${encodeURIComponent(String(dishId))}`);

// ── Profile Media / Flash Video ───────────────────────────────────────────
// Public Flash Videos for any diner (no connection required).
export const getPublicFlashVideos = (userId) =>
  get(`/api/consumer/profile/users/${encodeURIComponent(String(userId))}/flash-videos`);

// Upload a Flash Video (or any profile media).
// Pass media_subtype="flash_video" for Flash Videos.
export async function uploadProfileMedia(file, { media_subtype = null } = {}) {
  const language = readStoredLanguage();
  const form = new FormData();
  form.append("media", file);
  if (media_subtype) form.append("media_subtype", media_subtype);
  const localizedPath = appendLanguageParam("/api/consumer/profile/media", language);
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
  return json; // { ok, item }
}

// Delete a profile media item (owner only).
export const deleteProfileMedia = (mediaId) =>
  del(`/api/consumer/profile/media/${encodeURIComponent(String(mediaId))}`);
