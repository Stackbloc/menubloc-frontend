import { getAnalyticsSessionId } from "./analyticsSessionId.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export { getAnalyticsSessionId, appendSearchAnalyticsParams } from "./analyticsSessionId.js";

export function sendPageVisit({ path, restaurant_id = null, menu_item_id = null, market = null, user_id = null } = {}) {
  if (!path) return;
  if (typeof window === "undefined") return;

  const session_id = getAnalyticsSessionId();
  const referrer = document.referrer || null;
  const device_type = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop";

  fetch(`${API}/api/analytics/page-visit`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ path, session_id, user_id, referrer, device_type, restaurant_id, menu_item_id, market }),
  }).catch(() => {});
}
