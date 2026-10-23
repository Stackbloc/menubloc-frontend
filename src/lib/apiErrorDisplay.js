/**
 * API error display helper (error codes Phase 1, 2026-10-23).
 *
 * Turns a failed response or a thrown fetch error into
 * `message (CODE · ref xxxxxxxx)` with a copy-friendly ref.
 * Server codes come from the backend registry (docs/errors/ERROR_CODES.md in
 * menubloc-backend); CLIENT_* and GATEWAY_* codes are produced here.
 * Browsers cannot tell a CORS block from a dropped connection, so there is
 * deliberately no CORS-specific code.
 */

export const CLIENT_ERROR_CODES = Object.freeze({
  CLIENT_FETCH_FAILED: "CLIENT_FETCH_FAILED",
  CLIENT_OFFLINE: "CLIENT_OFFLINE",
  CLIENT_TIMEOUT: "CLIENT_TIMEOUT",
  CLIENT_REQUEST_ABORTED: "CLIENT_REQUEST_ABORTED",
  CLIENT_UNPARSEABLE_RESPONSE: "CLIENT_UNPARSEABLE_RESPONSE",
  CLIENT_UNCODED_ERROR: "CLIENT_UNCODED_ERROR",
  CLIENT_API_BASE_URL_MISSING: "CLIENT_API_BASE_URL_MISSING",
});

const GATEWAY_CODES = Object.freeze({
  502: "GATEWAY_BAD_GATEWAY",
  503: "GATEWAY_UNAVAILABLE",
  504: "GATEWAY_TIMEOUT",
});

const CLIENT_MESSAGES = Object.freeze({
  CLIENT_FETCH_FAILED: "Could not reach Menuply. Check your connection and try again.",
  CLIENT_OFFLINE: "You appear to be offline. Reconnect and try again.",
  CLIENT_TIMEOUT: "The request timed out. Try again on a stronger connection.",
  CLIENT_REQUEST_ABORTED: "The request was cancelled. Stay on this page and try again.",
  CLIENT_UNPARSEABLE_RESPONSE: "Menuply sent a response the app could not read. Reload and try again.",
  CLIENT_UNCODED_ERROR: "Something went wrong. Try again.",
  CLIENT_API_BASE_URL_MISSING: "This version of the site is misconfigured (no API address). Please report it.",
  GATEWAY_BAD_GATEWAY: "Menuply is temporarily unreachable. Try again in a minute.",
  GATEWAY_UNAVAILABLE: "Menuply is restarting. Try again in a minute.",
  GATEWAY_TIMEOUT: "Menuply took too long to respond. Try again.",
});

// Chrome, Safari, Firefox wording for a fetch() that never got a response.
const FETCH_FAILED_RE = /failed to fetch|load failed|networkerror when attempting to fetch resource|network request failed/i;
const LOCAL_API_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i;

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function isLocalPage() {
  if (typeof window === "undefined" || !window.location) return true;
  return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(window.location.hostname || "");
}

/**
 * Classify a thrown fetch error (no HTTP response). `apiBaseUrl` lets the
 * helper detect a production build that is calling a localhost API.
 */
export function classifyClientError(err, { apiBaseUrl, isProductionBuild } = {}) {
  const name = String(err?.name || "");
  const message = String(err?.message || "");
  if (name === "TimeoutError" || err?.timedOut === true) return CLIENT_ERROR_CODES.CLIENT_TIMEOUT;
  if (name === "AbortError") return CLIENT_ERROR_CODES.CLIENT_REQUEST_ABORTED;
  if (name === "SyntaxError" && /json/i.test(message)) return CLIENT_ERROR_CODES.CLIENT_UNPARSEABLE_RESPONSE;
  if (FETCH_FAILED_RE.test(message)) {
    const prodBuild = isProductionBuild ?? Boolean(import.meta.env?.PROD);
    if (prodBuild && apiBaseUrl && LOCAL_API_RE.test(String(apiBaseUrl)) && !isLocalPage()) {
      return CLIENT_ERROR_CODES.CLIENT_API_BASE_URL_MISSING;
    }
    if (isOffline()) return CLIENT_ERROR_CODES.CLIENT_OFFLINE;
    return CLIENT_ERROR_CODES.CLIENT_FETCH_FAILED;
  }
  if (isOffline()) return CLIENT_ERROR_CODES.CLIENT_OFFLINE;
  return CLIENT_ERROR_CODES.CLIENT_UNCODED_ERROR;
}

function readRequestId(source) {
  const value = source?.request_id ?? source?.requestId ?? source?.payload?.request_id;
  return value ? String(value) : "";
}

/**
 * Build an Error from a non-OK fetch Response. Never throws.
 * The returned error has `status`, `code`, `requestId` and `payload`.
 */
export async function apiErrorFromResponse(res, { fallbackMessage } = {}) {
  const status = Number(res?.status) || 0;
  const headerId = typeof res?.headers?.get === "function" ? res.headers.get("x-request-id") || "" : "";
  let text = "";
  try {
    text = typeof res?.text === "function" ? await res.text() : "";
  } catch {
    text = "";
  }
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  let code;
  let message;
  if (payload && typeof payload === "object" && (payload.ok === false || payload.error)) {
    code = payload.code ? String(payload.code) : CLIENT_ERROR_CODES.CLIENT_UNCODED_ERROR;
    message = typeof payload.error === "string" && payload.error ? payload.error : payload.message;
  } else if (GATEWAY_CODES[status]) {
    code = GATEWAY_CODES[status];
  } else if (text && !payload) {
    code = CLIENT_ERROR_CODES.CLIENT_UNPARSEABLE_RESPONSE;
  } else {
    code = CLIENT_ERROR_CODES.CLIENT_UNCODED_ERROR;
  }

  const error = new Error(message || CLIENT_MESSAGES[code] || fallbackMessage || `Request failed (${status})`);
  error.status = status;
  error.code = code;
  error.requestId = readRequestId(payload) || headerId;
  error.payload = payload || {};
  return error;
}

/** Short, copy-friendly form of a request id (first 8 characters). */
export function shortRef(requestId) {
  return String(requestId || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 8);
}

/**
 * Describe any error for display: `{ message, code, requestId, ref, text }`.
 * `text` is `message (CODE · ref xxxxxxxx)`; the ref part is omitted when unknown.
 */
export function describeApiError(err, { fallbackMessage, apiBaseUrl, isProductionBuild } = {}) {
  const hasResponse = Number(err?.status) > 0;
  const payloadCode = err?.payload?.code;
  const code = String(
    payloadCode ||
    (hasResponse ? err?.code : "") ||
    classifyClientError(err, { apiBaseUrl, isProductionBuild })
  );
  const requestId = readRequestId(err) || readRequestId(err?.payload);
  const rawMessage = String(err?.message || "");
  const message = !hasResponse && CLIENT_MESSAGES[code]
    ? CLIENT_MESSAGES[code]
    : rawMessage || CLIENT_MESSAGES[code] || fallbackMessage || CLIENT_MESSAGES.CLIENT_UNCODED_ERROR;
  const ref = shortRef(requestId);
  const suffix = ref ? `${code} · ref ${ref}` : code;
  return { message, code, requestId, ref, text: `${message} (${suffix})` };
}

export function formatApiErrorForDisplay(err, options) {
  return describeApiError(err, options).text;
}

/**
 * Reference line for errors that came from the server with a code or request id
 * (e.g. "API_CODE · ref 1a2b3c4d"). Returns "" for render errors and other
 * client-only errors so existing copy stays unchanged.
 */
export function serverErrorReference(err) {
  const code = err?.payload?.code || (Number(err?.status) > 0 ? err?.code : "");
  const ref = shortRef(readRequestId(err) || readRequestId(err?.payload));
  if (!code && !ref) return "";
  if (code && ref) return `${code} · ref ${ref}`;
  return code ? String(code) : `ref ${ref}`;
}
