/**
 * Temporary anonymous reporter session — not a Menuply account.
 * Used only for rate limits / duplicate detection. Never display this id.
 */

const STORAGE_KEY = "menuply_guest_reporter_v1";

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

export function getOrCreateGuestReporterKey() {
  const existing = String(safeGet(STORAGE_KEY) || "").trim();
  if (existing.length >= 16) return existing;
  const next = randomGuestKey();
  safeSet(STORAGE_KEY, next);
  return next;
}

/** Optional GPS — confidence only. Never blocks a report. */
export function readOptionalReporterCoords(timeoutMs = 1800) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({});
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({}), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        clearTimeout(timer);
        resolve({});
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: timeoutMs }
    );
  });
}
