/**
 * Network links (/n/:code, Owner Analytics atomic networks, mig 0410). Remembers the link on this
 * device for 7 days so it survives sign-up or sign-in, then tells the server once. Referral only:
 * it never makes anyone a member and creates no connection or invite.
 */

import { attachNetworkLink } from "./consumerApi.js";

const STORAGE_KEY = "menuply.pendingNetworkLink.v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CODE = /^[a-z0-9]{8,16}$/;

export const isNetworkLinkCode = (code) => CODE.test(String(code || ""));

export function savePendingNetworkLink(code) {
  if (!isNetworkLinkCode(code) || typeof localStorage === "undefined") return;
  try {
    const current = loadPendingNetworkLink();
    if (current?.code === code) return; // keep the first visit time
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, opened_at: new Date().toISOString() }));
  } catch {
    // private mode / quota: the link just isn't credited
  }
}

export function loadPendingNetworkLink() {
  if (typeof localStorage === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const age = Date.now() - Date.parse(parsed?.opened_at || "");
    if (!isNetworkLinkCode(parsed?.code) || !(age >= 0 && age < MAX_AGE_MS)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { code: parsed.code, opened_at: parsed.opened_at };
  } catch {
    return null;
  }
}

export function clearPendingNetworkLink() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Sends a saved link once for the signed-in person. Never throws. */
export async function attachPendingNetworkLink() {
  const pending = loadPendingNetworkLink();
  if (!pending) return null;
  try {
    const out = await attachNetworkLink(pending.code, pending.opened_at);
    clearPendingNetworkLink();
    return out;
  } catch (err) {
    if (err?.status === 404) clearPendingNetworkLink(); // link archived or replaced
    return null; // 401 / network: try again after the next sign-in
  }
}
