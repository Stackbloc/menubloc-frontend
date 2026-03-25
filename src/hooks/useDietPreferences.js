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

  // Soft filters — strict: only evaluator "pass" is shown; unknown = hidden
  if (prefs.keto) {
    if (df.low_carb?.result !== "pass") return false; // keto maps to low_carb evaluator
  }
  if (prefs.low_sodium) {
    if (df.low_sodium?.result !== "pass") return false;
  }
  if (prefs.diabetic_friendly) {
    if (df.diabetic_friendly?.result !== "pass") return false;
  }

  return true;
}
