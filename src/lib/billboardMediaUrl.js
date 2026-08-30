/**
 * Resolve billboard image URLs stored on the API host (`/uploads/...`).
 * Kept separate from api.js so node contract tests do not import React context.
 */

const VITE_ENV = typeof import.meta !== "undefined" ? import.meta.env || {} : {};
const DEFAULT_PROD_API_BASE = "https://menubloc-backend-production.up.railway.app";

const API_BASE = (
  VITE_ENV.VITE_API_BASE_URL ||
  (VITE_ENV.DEV ? "http://localhost:3001" : DEFAULT_PROD_API_BASE)
).replace(/\/$/, "");

function asUrl(postOrUrl) {
  return String(
    (postOrUrl && typeof postOrUrl === "object"
      ? postOrUrl.image_url || postOrUrl.photo_url
      : postOrUrl) || ""
  ).trim();
}

/**
 * @param {string|object|null|undefined} postOrUrl
 * @returns {string}
 */
export function resolveBillboardMediaUrl(postOrUrl) {
  const url = asUrl(postOrUrl);
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}
