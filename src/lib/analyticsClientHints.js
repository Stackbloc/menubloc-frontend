/**
 * Light client hints for page_visits.metadata (browser / OS / language).
 * Used by analytics sends — keep deterministic and short.
 * Does not import LanguageContext (avoids JSX dependency in analytics path).
 */

const LANGUAGE_STORAGE_KEY = "grubbid_language";
const SUPPORTED_LANGUAGES = ["en", "es", "zh"];

function readUiLanguage() {
  if (typeof window === "undefined") return "en";
  try {
    const next = String(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || "")
      .trim()
      .toLowerCase();
    return SUPPORTED_LANGUAGES.includes(next) ? next : "en";
  } catch {
    return "en";
  }
}

export function classifyBrowser(ua = "") {
  const s = String(ua || "");
  if (/Edg\//i.test(s)) return "Edge";
  if (/OPR\/|Opera/i.test(s)) return "Opera";
  if (/Chrome\//i.test(s) && !/Edg\//i.test(s)) return "Chrome";
  if (/Safari\//i.test(s) && !/Chrome\//i.test(s)) return "Safari";
  if (/Firefox\//i.test(s)) return "Firefox";
  return "Other";
}

export function classifyOs(ua = "") {
  const s = String(ua || "");
  if (/iPhone|iPad|iPod/i.test(s)) return "iOS";
  if (/Android/i.test(s)) return "Android";
  if (/Windows/i.test(s)) return "Windows";
  if (/Mac OS X|Macintosh/i.test(s)) return "macOS";
  if (/Linux/i.test(s)) return "Linux";
  return "Other";
}

export function classifyDeviceType(ua = "") {
  const s = String(ua || "");
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(s)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(s)) return "mobile";
  return "desktop";
}

/** Fields to merge into page_visits.metadata on each visit. */
export function getAnalyticsClientHints() {
  if (typeof navigator === "undefined") {
    return { browser: null, os: null, language: "en", browser_language: null };
  }
  const ua = navigator.userAgent || "";
  let browserLanguage = null;
  try {
    browserLanguage = String(navigator.language || "").slice(0, 16) || null;
  } catch {
    browserLanguage = null;
  }
  return {
    browser: classifyBrowser(ua),
    os: classifyOs(ua),
    language: readUiLanguage(),
    browser_language: browserLanguage,
  };
}
