/**
 * Public menu verification API (backend mounted at /menu-verification, not under /api).
 */

const VITE_ENV = import.meta.env || {};

const API_BASE = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : "")
).replace(/\/$/, "");

async function parseJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

/**
 * @param {string} token
 * @returns {Promise<{ ok: boolean, status: number, data: object|null }>}
 */
export async function getMenuVerificationSession(token) {
  const url = `${API_BASE}/menu-verification/${encodeURIComponent(String(token || ""))}`;
  const res = await fetch(url, { credentials: "include" });
  const data = await parseJson(res);
  return { ok: res.ok, status: res.status, data };
}

/**
 * @param {string} token
 * @param {{ answers: Array<{ question_id: number, skipped?: boolean, answer?: unknown }>, answered_by?: string }} body
 * @returns {Promise<{ ok: boolean, status: number, data: object|null }>}
 */
export async function postMenuVerificationAnswers(token, body) {
  const url = `${API_BASE}/menu-verification/${encodeURIComponent(String(token || ""))}/answers`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await parseJson(res);
  return { ok: res.ok, status: res.status, data };
}
