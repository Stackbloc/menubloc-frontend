/**
 * Remembers whose Diner QR a new diner scanned before signing up, so onboarding can ask
 * "Confirm <name>'s connection request?" (Andre 2026-11-07). Kept on this device only and
 * dropped after 7 days. Nothing is sent until the diner taps Confirm.
 */

import { extractDinerQrToken } from "./dinerQrShare.js";

const STORAGE_KEY = "menuply.pendingQrConnect.v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Token from a `/connect/d/:token` path (or a bare token); "" when it isn't one. */
export function dinerQrTokenFromConnectPath(path) {
  const raw = String(path || "").trim();
  const tail = raw.startsWith("/connect/d/") ? raw.slice("/connect/d/".length) : raw;
  return extractDinerQrToken(decodeURIComponent(tail.split(/[?#]/)[0] || "")) || "";
}

export function savePendingQrConnect(tokenOrPath) {
  const token = dinerQrTokenFromConnectPath(tokenOrPath);
  if (!token || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, saved_at: Date.now() }));
  } catch {
    // private mode / quota — onboarding just won't ask
  }
}

export function loadPendingQrConnect() {
  if (typeof localStorage === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const token = dinerQrTokenFromConnectPath(parsed?.token);
    if (!token || !(Date.now() - Number(parsed?.saved_at || 0) < MAX_AGE_MS)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { token };
  } catch {
    return null;
  }
}

/** Clears the pending invite; with a token, only when it is that one. */
export function clearPendingQrConnect(tokenOrPath) {
  if (typeof localStorage === "undefined") return;
  try {
    if (tokenOrPath) {
      const current = loadPendingQrConnect();
      if (current && current.token !== dinerQrTokenFromConnectPath(tokenOrPath)) return;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
