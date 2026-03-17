/**
 * useDietPreferences
 * Persists dietary preference flags across all pages via localStorage.
 * All pages read from this so a filter set on the discovery page carries
 * through to menu browsing and public menu views.
 */

const STORAGE_KEY = "grubbid.diet.prefs";

export const EMPTY_PREFS = {
  vegan: false,
  vegetarian: false,
  gluten_free: false,
  keto: false,
  low_sodium: false,
  dairy_free: false,
  diabetic_friendly: false,
};

export function loadDietPrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PREFS };
    const parsed = JSON.parse(raw);
    // Merge so future keys default to false
    return { ...EMPTY_PREFS, ...parsed };
  } catch {
    return { ...EMPTY_PREFS };
  }
}

export function saveDietPrefs(prefs) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage full or unavailable — silent fail
  }
}

export function clearDietPrefs() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/** Returns true if any dietary filter is active */
export function hasActiveDietPrefs(prefs) {
  return Object.values(prefs).some(Boolean);
}

/**
 * Returns the human-readable labels of active filters.
 */
const PREF_LABELS = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  gluten_free: "Gluten Free",
  keto: "Keto",
  low_sodium: "Low Sodium",
  dairy_free: "Dairy Free",
  diabetic_friendly: "Diabetic Friendly",
};

export function activePrefLabels(prefs) {
  return Object.entries(prefs)
    .filter(([, v]) => v)
    .map(([k]) => PREF_LABELS[k] || k);
}

/**
 * Client-side filter for a single menu item using the data returned
 * by the public menu API. Returns true if the item passes all active filters.
 *
 * Preference → item field used:
 *   vegan        → item.is_vegan
 *   vegetarian   → item.is_vegetarian  (or is_vegan implies vegetarian)
 *   gluten_free  → item.is_gluten_free
 *   dairy_free   → item.is_dairy_free
 *   keto         → item.is_keto (preferred) OR nutrition chip data
 *   low_sodium   → item.is_low_sodium (preferred) OR nutrition chip data
 *   diabetic_friendly → no reliable signal yet; items pass through
 *
 * Items where the required flag is null/undefined are hidden —
 * we can't confirm compliance.
 */
export function itemPassesDietFilter(item, prefs) {
  if (!hasActiveDietPrefs(prefs)) return true;

  const n = item?.chips?.nutrition_chip || {};

  if (prefs.vegan) {
    if (item?.is_vegan !== true) return false;
  }
  if (prefs.vegetarian) {
    // is_vegan implies vegetarian
    if (item?.is_vegetarian !== true && item?.is_vegan !== true) return false;
  }
  if (prefs.gluten_free) {
    if (item?.is_gluten_free !== true) return false;
  }
  if (prefs.dairy_free) {
    if (item?.is_dairy_free !== true) return false;
  }
  if (prefs.keto) {
    // Prefer the DB-computed flag; fall back to nutrition chip if available
    if (item?.is_keto === true) {
      // passes
    } else if (item?.is_keto === false) {
      return false;
    } else {
      // is_keto is null/undefined — try nutrition chip
      const carbs = n.carbs_g ?? null;
      const fiber = n.fiber_g ?? 0;
      const sugar = n.sugar_g ?? null;
      if (carbs === null || sugar === null) return false; // no data → hide
      if (Math.max(0, carbs - fiber) > 18 || sugar > 8) return false;
    }
  }
  if (prefs.low_sodium) {
    // Prefer the DB-computed flag; fall back to nutrition chip if available
    if (item?.is_low_sodium === true) {
      // passes
    } else if (item?.is_low_sodium === false) {
      return false;
    } else {
      const sodium = n.sodium_mg ?? null;
      if (sodium === null) return false; // no data → hide
      if (sodium > 600) return false;
    }
  }
  if (prefs.diabetic_friendly) {
    if (item?.is_diabetic_friendly !== true) return false;
  }

  return true;
}
