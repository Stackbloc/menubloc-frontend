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
  low_fat: false,
  low_sodium: false,
  dairy_free: false,
  diabetic_friendly: false,
  glp1_friendly: false,
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
  low_fat: "Low Fat",
  low_sodium: "Low Sodium",
  dairy_free: "Dairy Free",
  diabetic_friendly: "Diabetic Friendly",
  glp1_friendly: "GLP-1 Friendly",
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
 * Source: item.chips.dietary_filters (backend tri-state evaluator).
 *
 * All filters — strict mode:
 *   pass → show | fail/unknown → hide
 *
 * Hard filters (vegan, vegetarian, gluten_free, dairy_free):
 *   Fall back to DB boolean flag when no evaluator result (items without
 *   nutrition estimates may not have been evaluated).
 *
 * Soft filters (keto, low_sodium, diabetic_friendly):
 *   Evaluator result only. No DB flag fallback, no nutrition math fallback.
 *   unknown = not confirmed pass = hidden.
 */
export function itemPassesDietFilter(item, prefs) {
  if (!hasActiveDietPrefs(prefs)) return true;

  const df = item?.chips?.dietary_filters || {};

  // Hard filters — only confirmed pass allowed through; fall back to DB flag
  if (prefs.vegan) {
    const r = df.vegan?.result;
    if (r === "pass") { /* ok */ }
    else if (r === "fail" || r === "unknown") return false;
    else if (item?.is_vegan !== true) return false;
  }
  if (prefs.vegetarian) {
    const r = df.vegetarian?.result;
    if (r === "pass") { /* ok */ }
    else if (r === "fail" || r === "unknown") return false;
    else if (item?.is_vegetarian !== true && item?.is_vegan !== true) return false;
  }
  if (prefs.gluten_free) {
    const r = df.gluten_free?.result;
    if (r === "pass") { /* ok */ }
    else if (r === "fail" || r === "unknown") return false;
    else if (item?.is_gluten_free !== true) return false;
  }
  if (prefs.dairy_free) {
    const r = df.dairy_free?.result;
    if (r === "pass") { /* ok */ }
    else if (r === "fail" || r === "unknown") return false;
    else if (item?.is_dairy_free !== true) return false;
  }

  // Soft filters — evaluator "pass" accepted, "fail" rejected, "unknown" falls back to DB flag.
  // Mirrors hard-filter pattern so browse item counts and menu detail agree.
  if (prefs.keto) {
    const r = df.low_carb?.result;
    if (r === "pass") { /* ok */ }
    else if (r === "fail") return false;
    else if (item?.is_keto !== true) return false;
  }
  if (prefs.low_fat) {
    const r = df.low_fat?.result;
    if (r !== "pass") return false;
  }
  if (prefs.low_sodium) {
    const r = df.low_sodium?.result;
    if (r === "pass") { /* ok */ }
    else if (r === "fail") return false;
    else if (item?.is_low_sodium !== true) return false;
  }
  if (prefs.diabetic_friendly) {
    const r = df.diabetic_friendly?.result;
    if (r === "pass") { /* ok */ }
    else if (r === "fail") return false;
    else if (item?.is_diabetic_friendly !== true) return false;
  }

  return true;
}
