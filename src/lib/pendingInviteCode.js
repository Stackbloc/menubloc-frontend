/**
 * Invite friends link codes (?r=code, mig 0415, Andre 2026-11-10). A diner's "Invite friends" share
 * carries their opaque code. Opening the link remembers it on this device for 7 days so it survives
 * sign-up or sign-in, then the server is told once. Attribution for Owner analytics only: it creates
 * no connection, request, follow or notification, and nobody sees anything different.
 */

import { creditInviteCode, getMyInviteCode, recordInviteCodeOpen } from "./consumerApi.js";
import { getAnalyticsVisitorId } from "./analyticsSessionId.js";
import { INVITE_CODE_PARAM, isInviteCode, withInviteCode } from "./inviteCodeLink.js";

export { INVITE_CODE_PARAM, isInviteCode, withInviteCode };

const STORAGE_KEY = "menuply.pendingInviteCode.v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function loadPendingInviteCode() {
  if (typeof localStorage === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const age = Date.now() - Date.parse(parsed?.opened_at || "");
    if (!isInviteCode(parsed?.code) || !(age >= 0 && age < MAX_AGE_MS)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { code: parsed.code, opened_at: parsed.opened_at };
  } catch {
    return null;
  }
}

export function clearPendingInviteCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Remember the first invite link opened on this device and count the open. Never throws. */
export function savePendingInviteCode(code) {
  if (!isInviteCode(code) || typeof localStorage === "undefined") return false;
  try {
    const current = loadPendingInviteCode();
    if (!current) localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, opened_at: new Date().toISOString() }));
  } catch {
    return false; // private mode / quota: the link just isn't credited
  }
  recordInviteCodeOpen(code, getAnalyticsVisitorId()).catch(() => {});
  return true;
}

/** Called once on app load: picks ?r=code off any URL. */
export function captureInviteCodeFromUrl(search = typeof window !== "undefined" ? window.location.search : "") {
  try {
    const code = new URLSearchParams(search).get(INVITE_CODE_PARAM);
    return isInviteCode(code) ? savePendingInviteCode(code) : false;
  } catch {
    return false;
  }
}

/** Sends a saved code once for the signed-in person. Never throws. */
export async function creditPendingInviteCode() {
  const pending = loadPendingInviteCode();
  if (!pending) return null;
  try {
    const out = await creditInviteCode(pending.code, pending.opened_at);
    clearPendingInviteCode();
    return out;
  } catch (err) {
    if (err?.status === 404) clearPendingInviteCode();
    return null; // 401 / network: try again after the next sign-in
  }
}

let myCode;
/** My own code, fetched once per page load; null when signed out or before mig 0415. */
export async function loadMyInviteCode() {
  if (myCode !== undefined) return myCode;
  try {
    const out = await getMyInviteCode();
    myCode = isInviteCode(out?.code) ? out.code : null;
  } catch {
    return null; // signed out / offline: don't cache, try again later
  }
  return myCode;
}
