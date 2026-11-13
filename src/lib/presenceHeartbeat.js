/**
 * Live presence (Diner Intelligence Stage 2, plan 39): POST /api/presence/heartbeat.
 * - One beat when the page is shown, then every 60 s while the tab is visible. Hidden tabs don't beat.
 * - Online = a beat in the last 2 minutes (server). A gap over 5 minutes starts a new session key;
 *   the server also answers 409 session_expired, and the next beat uses a new key.
 * - Closing the tab sends a "gone" beat. The signed-in diner comes from the cookie, never the body.
 * - Same privacy gate as engagement tracking (off for staff, GPC, Do Not Track). Never throws.
 */

import { getAnalyticsVisitorId } from "./analyticsSessionId.js";
import { getCurrentEngagementClusterId, isEngagementTrackingAllowed } from "./engagementTracking.js";

const ENV = import.meta.env || {};
const API = (
  ENV.VITE_API_BASE_URL ||
  (ENV.DEV ? "http://localhost:3001" : "https://menubloc-backend-production.up.railway.app")
).replace(/\/$/, "");

export const BEAT_EVERY_MS = 60 * 1000;
export const SESSION_GAP_MS = 5 * 60 * 1000;
const STORE_KEY = "menuply.presence.session.v1";

let timer = null;
let started = false;
let memory = null; // fallback when sessionStorage is blocked

function randomKey() {
  try {
    if (typeof crypto?.randomUUID === "function") return `w_${crypto.randomUUID()}`;
  } catch {
    // fall through
  }
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function readSession() {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return memory;
  }
}

function writeSession(s) {
  memory = s;
  try {
    if (s) window.sessionStorage.setItem(STORE_KEY, JSON.stringify(s));
    else window.sessionStorage.removeItem(STORE_KEY);
  } catch {
    // memory copy is enough
  }
}

/** This tab's session key; a new one after a 5-minute gap. */
export function presenceSessionKey(now = Date.now()) {
  const s = readSession();
  if (s?.key && now - Number(s.last || 0) < SESSION_GAP_MS) return s.key;
  const key = randomKey();
  writeSession({ key, last: now });
  return key;
}

function payload(state) {
  return {
    session_key: presenceSessionKey(),
    visitor_key: getAnalyticsVisitorId(),
    platform: "web",
    state,
    cluster_id: getCurrentEngagementClusterId(),
  };
}

export async function sendPresenceBeat(state = "active") {
  try {
    if (!isEngagementTrackingAllowed()) return null;
    const body = payload(state);
    const res = await fetch(`${API}/api/presence/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify(body),
    });
    if (state === "gone" || res.status === 409) writeSession(null); // next beat starts a new session
    else if (res.ok) writeSession({ key: body.session_key, last: Date.now() });
    return res.status;
  } catch {
    return null;
  }
}

function visible() {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

function schedule() {
  if (timer) clearInterval(timer);
  timer = null;
  if (!visible()) return;
  timer = setInterval(() => {
    if (visible()) sendPresenceBeat("active");
  }, BEAT_EVERY_MS);
}

function onVisibility() {
  if (visible()) sendPresenceBeat("active");
  schedule();
}

function onPageHide() {
  sendPresenceBeat("gone");
}

/** Start once per page load. Returns a stop function. */
export function startPresenceHeartbeat() {
  if (started || typeof window === "undefined") return () => {};
  started = true;
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  if (visible()) sendPresenceBeat("active");
  schedule();
  return stopPresenceHeartbeat;
}

export function stopPresenceHeartbeat() {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
  if (typeof window === "undefined") return;
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("pagehide", onPageHide);
}

/** Test hook. */
export function resetPresenceForTests() {
  stopPresenceHeartbeat();
  memory = null;
  writeSession(null);
}
