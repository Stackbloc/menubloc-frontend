/** Session flag: dietary/allergen prefs applied across Yellow Browser menu swipes. */
export const MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY =
  "menuply.yellowBrowser.applyDietaryPreferences";

export function readCatalogApplyDietaryPreferences() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY) === "1";
}

export function writeCatalogApplyDietaryPreferences(enabled) {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.sessionStorage.setItem(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY, "1");
    } else {
      window.sessionStorage.removeItem(MENU_CATALOG_APPLY_DIETARY_PREFERENCES_KEY);
    }
  } catch {
    // sessionStorage unavailable — in-memory state still works for this view.
  }
}
