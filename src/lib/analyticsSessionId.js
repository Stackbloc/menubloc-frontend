const SESSION_KEY = "grubbid.analytics.session_id";
const VISITOR_KEY = "grubbid.analytics.visitor_id";
const STAFF_KEY = "grubbid.analytics.is_staff";

export function getAnalyticsVisitorId() {
  try {
    let id = String(window.localStorage.getItem(VISITOR_KEY) || "");
    if (!id) {
      id = typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `vis-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return getAnalyticsSessionId();
  }
}

export function getAnalyticsSessionId() {
  try {
    let id = String(window.sessionStorage.getItem(SESSION_KEY) || "");
    if (!id) {
      id = typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Persist whether the current browser has an owner/operator session (staff). */
export function setAnalyticsStaffSession(isStaff) {
  try {
    if (isStaff) window.sessionStorage.setItem(STAFF_KEY, "1");
    else window.sessionStorage.removeItem(STAFF_KEY);
  } catch {
    // ignore
  }
}

export function isAnalyticsStaffSession() {
  try {
    return window.sessionStorage.getItem(STAFF_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Attach consumer analytics session_id to search API query params (Platform Intelligence).
 * Staff (owner/operator) searches are marked is_staff=1 so backend analytics exclude them.
 */
export function appendSearchAnalyticsParams(params) {
  if (!params || typeof params.append !== "function") return params;
  if (isAnalyticsStaffSession()) {
    params.set("is_staff", "1");
    // Still attach session_id for ops debugging, but is_staff excludes from consumer analytics.
  }
  const sessionId = getAnalyticsSessionId();
  if (sessionId) params.set("session_id", sessionId);
  return params;
}
