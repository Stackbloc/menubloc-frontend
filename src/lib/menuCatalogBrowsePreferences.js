/** Session flag: user has seen the expanded preference banner on first menu view. */
export const MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY =
  "menuply.menuPrefs.detailedBannerSeen";

/** @deprecated legacy sessionStorage opt-out — cleared on read; use in-memory flag */
export const MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY =
  "menuply.yellowBrowser.applyDietaryPreferences";

/**
 * Dietary opt-out for the current SPA visit only (in-memory).
 * Page load / fresh tab always starts with saved prefs ON.
 * User "remove" applies until re-apply or login/profile save reset.
 */
let dietaryPreferencesOptedOut = false;

function clearLegacySessionOptOut() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY);
  } catch {}
}

/**
 * Dietary preferences apply by default when the user has saved prefs.
 */
export function readCatalogApplyDietaryPreferences() {
  clearLegacySessionOptOut();
  return !dietaryPreferencesOptedOut;
}

export function writeCatalogApplyDietaryPreferences(enabled) {
  dietaryPreferencesOptedOut = enabled !== true;
  clearLegacySessionOptOut();
}

export function readMenuPreferenceDetailedBannerSeen() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY) === "1";
}

export function writeMenuPreferenceDetailedBannerSeen() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY, "1");
  } catch {}
}

/** Clear per-session dietary opt-out so saved profile prefs apply on next menu. */
export function clearDietaryPreferencesSessionOptOut() {
  dietaryPreferencesOptedOut = false;
  clearLegacySessionOptOut();
}

export function clearMenuPreferenceBannerSeen() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY);
  } catch {}
}

/** Fresh visit or login — saved prefs apply; show expanded banner on first menu. */
export function resetMenuPreferenceSessionForLogin() {
  clearDietaryPreferencesSessionOptOut();
  clearMenuPreferenceBannerSeen();
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("menuply:menu-prefs-reset"));
    } catch {}
  }
}

/** Test-only reset of in-memory opt-out. */
export function __resetDietaryPreferencesOptOutForTests() {
  dietaryPreferencesOptedOut = false;
}
