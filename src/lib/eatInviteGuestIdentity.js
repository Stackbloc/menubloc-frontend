/**
 * Guest identity for Invite to Eat (no Menuply account).
 * Device-scoped guest_key + optional display name in localStorage.
 */

const GUEST_KEY_STORAGE = "menuply_eat_invite_guest_key_v1";
const DISPLAY_NAME_STORAGE = "menuply_eat_invite_guest_display_name_v1";
const TOKEN_ORG_PREFIX = "menuply_eat_invite_org_token_v1:";

function randomGuestKey() {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

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
    /* ignore quota / private mode */
  }
}

/** Stable per-browser guest key (base64url-ish, >= 16 chars). */
export function getOrCreateEatInviteGuestKey() {
  const existing = String(safeGet(GUEST_KEY_STORAGE) || "").trim();
  if (existing.length >= 16) return existing;
  const next = randomGuestKey();
  safeSet(GUEST_KEY_STORAGE, next);
  return next;
}

export function getEatInviteGuestDisplayName() {
  return String(safeGet(DISPLAY_NAME_STORAGE) || "").trim();
}

export function setEatInviteGuestDisplayName(name) {
  const trimmed = String(name || "").trim().slice(0, 80);
  if (!trimmed) return;
  safeSet(DISPLAY_NAME_STORAGE, trimmed);
}

/** Remember that this device organized a given invitation token. */
export function rememberOrganizerInviteToken(token, guestKey) {
  const t = String(token || "").trim();
  if (!t) return;
  safeSet(`${TOKEN_ORG_PREFIX}${t}`, String(guestKey || getOrCreateEatInviteGuestKey()));
}

export function getOrganizerGuestKeyForToken(token) {
  const t = String(token || "").trim();
  if (!t) return null;
  const keyed = String(safeGet(`${TOKEN_ORG_PREFIX}${t}`) || "").trim();
  if (keyed.length >= 16) return keyed;
  return getOrCreateEatInviteGuestKey();
}
