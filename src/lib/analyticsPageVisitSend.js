import {
  getAnalyticsSessionId,
  isAnalyticsStaffSession,
  appendSearchAnalyticsParams,
  setAnalyticsStaffSession,
} from "./analyticsSessionId.js";
import {
  classifyDeviceType,
  getAnalyticsClientHints,
} from "./analyticsClientHints.js";

const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "https://menubloc-backend-production.up.railway.app")
).replace(/\/$/, "");

export {
  getAnalyticsSessionId,
  appendSearchAnalyticsParams,
  setAnalyticsStaffSession,
  isAnalyticsStaffSession,
} from "./analyticsSessionId.js";
export { getAnalyticsClientHints, classifyBrowser, classifyOs, classifyDeviceType } from "./analyticsClientHints.js";

export function sendPageVisit({
  path,
  restaurant_id = null,
  menu_item_id = null,
  market = null,
  user_id = null,
  metadata = null,
  is_staff = null,
} = {}) {
  if (!path) return;
  if (typeof window === "undefined") return;

  const staff =
    is_staff === true ||
    is_staff === 1 ||
    is_staff === "1" ||
    isAnalyticsStaffSession();

  // Do not pollute consumer analytics with owner/operator browsing.
  if (staff) return;

  const session_id = getAnalyticsSessionId();
  const referrer = document.referrer || null;
  const ua = navigator.userAgent || "";
  const device_type = classifyDeviceType(ua);
  const hints = getAnalyticsClientHints();
  const mergedMetadata = {
    ...(metadata && typeof metadata === "object" ? metadata : {}),
    browser: hints.browser,
    os: hints.os,
    language: hints.language,
    browser_language: hints.browser_language,
  };

  fetch(`${API}/api/analytics/page-visit`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      path,
      session_id,
      user_id,
      referrer,
      device_type,
      restaurant_id,
      menu_item_id,
      market,
      browser: hints.browser,
      os: hints.os,
      language: hints.language,
      browser_language: hints.browser_language,
      metadata: mergedMetadata,
      is_staff: false,
    }),
  }).catch(() => {});
}
