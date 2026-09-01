/**
 * UX cache only — backend is authoritative for guest publication consent.
 */

const STORAGE_KEY = "menuply_guest_feed_legal_consent_v1";

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

export function markGuestPublicationConsentAccepted(termsVersion, privacyVersion) {
  safeSet(
    STORAGE_KEY,
    JSON.stringify({
      terms_version: String(termsVersion || ""),
      privacy_version: String(privacyVersion || ""),
      accepted_at: Date.now(),
    })
  );
}

export function hasGuestPublicationConsentCached(termsVersion, privacyVersion) {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    return (
      String(parsed?.terms_version || "") === String(termsVersion || "") &&
      String(parsed?.privacy_version || "") === String(privacyVersion || "")
    );
  } catch {
    return false;
  }
}
