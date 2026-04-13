/**
 * ============================================================
 * Path: menubloc-frontend/src/lib/consumerApi.js
 * Purpose:
 *   Consumer API client. Uses session cookies (credentials:include).
 *   Mirrors the pattern used in operatorApi.js.
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

const get  = (path)        => req(path);
const post = (path, body)  => req(path, { method: "POST",   body: JSON.stringify(body) });
const put  = (path, body)  => req(path, { method: "PUT",    body: JSON.stringify(body) });
const del  = (path)        => req(path, { method: "DELETE" });

// ── Auth ──────────────────────────────────────────────────────────────────
export const getConsumerSession    = ()                    => get("/api/consumer-auth/me");
export const signupConsumer        = (body)                => post("/api/consumer-auth/signup", body);
export const loginConsumer         = (email, password)     => post("/api/consumer-auth/login", { email, password });
export const loginConsumerWithGoogle = (credential)        => post("/api/consumer-auth/google", { credential });
export const loginConsumerWithApple  = (body)              => post("/api/consumer-auth/apple", body);
export const logoutConsumer        = ()                    => post("/api/consumer-auth/logout", {});
export const forgotPassword        = (email)               => post("/api/consumer-auth/forgot-password", { email });
export const validateResetToken    = (token)               => get(`/api/consumer-auth/reset-password?token=${encodeURIComponent(token)}`);
export const resetPassword         = (token, password)     => post("/api/consumer-auth/reset-password", { token, password });
export const sendSmsCode           = (phone_number)        => post("/api/auth/send-code", { phone_number });
export const verifySmsCode         = (phone_number, code)  => post("/api/auth/verify-code", { phone_number, code });

// ── Profile ───────────────────────────────────────────────────────────────
export const getConsumerProfile    = ()     => get("/api/consumer/profile");
export const updateConsumerProfile = (body) => put("/api/consumer/profile", body);

// ── Preferences ───────────────────────────────────────────────────────────
export const getPreferences        = ()     => get("/api/consumer/profile/preferences");
export const updatePreferences     = (body) => put("/api/consumer/profile/preferences", body);

// ── Saved Locations ───────────────────────────────────────────────────────
export const getLocations          = ()         => get("/api/consumer/profile/locations");
export const addLocation           = (body)     => post("/api/consumer/profile/locations", body);
export const updateLocation        = (id, body) => put(`/api/consumer/profile/locations/${id}`, body);
export const deleteLocation        = (id)       => del(`/api/consumer/profile/locations/${id}`);
