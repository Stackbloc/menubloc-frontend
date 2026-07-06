/** Session flag: dietary prefs disabled for this browse tab (allergens always apply from profile). */
export const MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY =
  "menuply.yellowBrowser.applyDietaryPreferences";

/** Session flag: user has seen the expanded preference banner on first menu view. */
export const MENU_PREFERENCE_DETAILED_BANNER_SEEN_KEY =
  "menuply.menuPrefs.detailedBannerSeen";

/**
 * Dietary preferences apply by default when the user has saved prefs.
 * Session stores explicit opt-out only (`"0"`).
 */
export function readCatalogApplyDietaryPreferences() {
  if (typeof window === "undefined") return true;
  const stored = window.sessionStorage.getItem(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY);
  if (stored === "0") return false;
  return true;
}

export function writeCatalogApplyDietaryPreferences(enabled) {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.sessionStorage.removeItem(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY);
    } else {
      window.sessionStorage.setItem(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY, "0");
    }
  } catch {
    // sessionStorage unavailable — in-memory state still works for this view.
  }
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
