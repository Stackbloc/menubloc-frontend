/**
 * Guest Feed video claim token — transfer guest posts to account on signup/login.
 */

import { getOrCreateGuestReporterKey } from "./guestReporterSession.js";

const CLAIM_TOKEN_KEY = "menuply_guest_feed_claim_token_v1";
const CLAIM_GUEST_KEY = "menuply_guest_feed_claim_guest_key_v1";

function safeGet(key) {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeRemove(key) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function storeGuestFeedClaimSession({ claimToken, guestKey } = {}) {
  const token = String(claimToken || "").trim();
  const key = String(guestKey || getOrCreateGuestReporterKey()).trim();
  if (!token || !key) return;
  safeSet(CLAIM_TOKEN_KEY, token);
  safeSet(CLAIM_GUEST_KEY, key);
}

export function readGuestFeedClaimSession() {
  const claimToken = String(safeGet(CLAIM_TOKEN_KEY) || "").trim();
  const guestKey = String(safeGet(CLAIM_GUEST_KEY) || getOrCreateGuestReporterKey()).trim();
  if (!claimToken) return null;
  return { claim_token: claimToken, guest_key: guestKey };
}

export function clearGuestFeedClaimSession() {
  safeRemove(CLAIM_TOKEN_KEY);
  safeRemove(CLAIM_GUEST_KEY);
}

/** Merge into signup/login body so BE maybeClaimFromAuthRequest runs. */
export function appendGuestFeedClaimToAuthBody(body = {}) {
  const session = readGuestFeedClaimSession();
  if (!session) return body;
  return {
    ...body,
    claim_token: session.claim_token,
    guest_key: session.guest_key,
  };
}
