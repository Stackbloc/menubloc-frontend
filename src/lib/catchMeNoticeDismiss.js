/**
 * Viewer-local dismiss for Catch Me Who's Eating notices.
 * Hiding a notice keeps it hidden for the rest of that Catch Me visit
 * (keyed by catch_me id + end date). Does not call the server.
 */

const STORAGE_PREFIX = "menuply:catchMeNoticeHidden:";

function storageKey(catchMeId) {
  const id = Number(catchMeId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return `${STORAGE_PREFIX}${id}`;
}

export function isCatchMeNoticeHidden(catchMeId, endDate = null) {
  if (typeof window === "undefined" || !window.localStorage) return false;
  const key = storageKey(catchMeId);
  if (!key) return false;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return false;
    const end = String(endDate || "").slice(0, 10);
    // Stored value is end_date when known; any truthy hide still counts.
    if (end && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw !== end) {
      // Different visit on same id (unlikely) — treat as not hidden.
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function hideCatchMeNotice(catchMeId, endDate = null) {
  if (typeof window === "undefined" || !window.localStorage) return false;
  const key = storageKey(catchMeId);
  if (!key) return false;
  try {
    const end = String(endDate || "").slice(0, 10);
    window.localStorage.setItem(
      key,
      /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : "1"
    );
    return true;
  } catch {
    return false;
  }
}
