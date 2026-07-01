/**
 * ============================================================
 * Path: menubloc-frontend/src/lib/consumerApi.js
 * Purpose:
 *   Consumer API client. Uses session cookies (credentials:include).
 *   Mirrors the pattern used in operatorApi.js.
 * ============================================================
 */

import { appendLanguageParam, readStoredLanguage, withLanguageHeaders } from "./languageApi.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

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
export const verifySmsCode         = (phone_number, code)  => post("/api/consumer-auth/sms/verify", { phone_number, code });

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
export const getMenuItemLikeStatus = (menuItemId) =>
  get(`/api/consumer/menu-item-likes/${encodeURIComponent(String(menuItemId))}`);
export const likeMenuItem = (menuItemId) =>
  post(`/api/consumer/menu-item-likes/${encodeURIComponent(String(menuItemId))}`, {});
export const unlikeMenuItem = (menuItemId) =>
  del(`/api/consumer/menu-item-likes/${encodeURIComponent(String(menuItemId))}`);
