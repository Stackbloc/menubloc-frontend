const SESSION_KEY = "grubbid.analytics.session_id";

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

/** Attach consumer analytics session_id to search API query params (Platform Intelligence). */
export function appendSearchAnalyticsParams(params) {
  if (!params || typeof params.append !== "function") return params;
  const sessionId = getAnalyticsSessionId();
  if (sessionId) params.set("session_id", sessionId);
  return params;
}
