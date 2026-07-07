/**
 * Client-side saved preference application for public menus.
 * Uses persisted item metadata only — no free-text inference at render time.
 */

import { activePrefLabels, hasActiveDietPrefs } from "../hooks/useDietPreferences.js";


const ALLERGEN_KEY_LABELS = {
  peanuts: "Peanuts",
  tree_nuts: "Tree nuts",
  dairy: "Dairy",
  gluten: "Gluten",
  shellfish: "Shellfish",
  soy: "Soy",
  eggs: "Eggs",
  fish: "Fish",
  sesame: "Sesame",
  wheat: "Wheat",
};

function formatTokenLabel(value) {
  return String(value || "")
    .trim()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const ALLERGEN_PROFILE_TO_EVIDENCE = {
  peanuts: ["peanuts"],
  tree_nuts: ["tree nuts", "tree_nuts"],
  dairy: ["dairy"],
  gluten: ["wheat", "gluten"],
  shellfish: ["shellfish"],
  soy: ["soy"],
  eggs: ["eggs", "egg"],
  fish: ["fish"],
  sesame: ["sesame"],
  wheat: ["wheat"],
};

const PERSISTED_ALLERGEN_CHIP_SOURCES = new Set(["chain_official", "reference_dataset"]);

function asStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

function isDisplayableMenuItem(item) {
  return asStr(item?.name).trim().length > 0;
}

function normalizeAllergenToken(value) {
  return asStr(value).toLowerCase().replace(/_/g, " ").trim();
}

export function buildEnabledDietKeys(dietaryPreferences, isAuthenticated) {
  if (!isAuthenticated || !Array.isArray(dietaryPreferences)) return new Set();
  return new Set(
    dietaryPreferences.filter((p) => p.is_enabled).map((p) => p.preference_key)
  );
}

export function buildDietPrefsFromProfile(dietaryPreferences, isAuthenticated) {
  const enabledDietKeys = buildEnabledDietKeys(dietaryPreferences, isAuthenticated);
  return {
    dairy_free: enabledDietKeys.has("dairy_free"),
    diabetic_friendly: enabledDietKeys.has("diabetic_friendly"),
    gluten_free: enabledDietKeys.has("gluten_free"),
    keto: enabledDietKeys.has("keto") || enabledDietKeys.has("low_carb"),
    low_fat: enabledDietKeys.has("low_fat"),
    low_sodium: enabledDietKeys.has("low_sodium"),
    vegan: enabledDietKeys.has("vegan"),
    vegetarian: enabledDietKeys.has("vegetarian"),
  };
}

export function buildEnabledAllergenKeys(allergenPreferences, isAuthenticated) {
  if (!isAuthenticated || !Array.isArray(allergenPreferences)) return new Set();
  return new Set(
    allergenPreferences.filter((p) => p.is_enabled).map((p) => p.allergen_key)
  );
}

export function hasSavedMenuPreferences(dietPrefs, enabledAllergenKeys) {
  return hasActiveDietPrefs(dietPrefs) || (enabledAllergenKeys && enabledAllergenKeys.size > 0);
}

export function buildDietPreferenceLabels(dietPrefs) {
  if (!hasActiveDietPrefs(dietPrefs)) return [];
  return activePrefLabels(dietPrefs);
}

export function buildAllergenPreferenceLabels(enabledAllergenKeys) {
  if (!enabledAllergenKeys || enabledAllergenKeys.size === 0) return [];
  return [...enabledAllergenKeys].map((key) => ALLERGEN_KEY_LABELS[key] || formatTokenLabel(key));
}

export function buildCombinedPreferenceLabelList(dietPrefs, enabledAllergenKeys) {
  return [
    ...buildDietPreferenceLabels(dietPrefs),
    ...buildAllergenPreferenceLabels(enabledAllergenKeys),
  ];
}

/** @deprecated diet-only menu filtering — allergens are not applied on menus */
export const EMPTY_DIET_PREFS = Object.freeze({
  dairy_free: false,
  diabetic_friendly: false,
  gluten_free: false,
  keto: false,
  low_fat: false,
  low_sodium: false,
  vegan: false,
  vegetarian: false,
});

export function normalizeMenuDisplaySections(sections) {
  return (Array.isArray(sections) ? sections : [])
    .map((sec) => {
      const title = asStr(sec?.title || "Menu").trim() || "Menu";
      const items = (Array.isArray(sec?.items) ? sec.items : []).filter(isDisplayableMenuItem);
      return { ...sec, title, items };
    })
    .filter((sec) => sec.items.length > 0);
}

export function countMenuDisplayItems(sections) {
  return normalizeMenuDisplaySections(sections).reduce(
    (count, sec) => count + (Array.isArray(sec?.items) ? sec.items.length : 0),
    0
  );
}

/**
 * Dietary prefs apply when applyDietaryPreferences is true (session opt-out available).
 * Allergen exclusions always apply when enabledAllergenKeys is non-empty.
 */
export function getMenuDisplaySectionsWithPreferences(
  sections,
  { applyDietaryPreferences = false, dietPrefs, enabledAllergenKeys = new Set() }
) {
  const normalized = normalizeMenuDisplaySections(sections);
  const allergenKeys =
    enabledAllergenKeys instanceof Set ? enabledAllergenKeys : new Set(enabledAllergenKeys || []);
  const dietActive = applyDietaryPreferences && hasActiveDietPrefs(dietPrefs);
  const allergenActive = allergenKeys.size > 0;

  if (!dietActive && !allergenActive) return normalized;

  return getClientPreferenceDisplaySections(
    normalized,
    dietActive ? dietPrefs : EMPTY_DIET_PREFS,
    allergenKeys
  );
}

/**
 * Diet: hide only when persisted flag is explicitly false.
 * Missing metadata → keep item visible (no guesswork).
 */
export function itemPassesPersistedDietFilter(item, prefs) {
  if (!hasActiveDietPrefs(prefs)) return true;

  if (prefs.vegan && item?.is_vegan === false) return false;
  if (prefs.vegetarian) {
    if (item?.is_vegetarian === false && item?.is_vegan !== true) return false;
  }
  if (prefs.gluten_free && item?.is_gluten_free === false) return false;
  if (prefs.dairy_free && item?.is_dairy_free === false) return false;
  if (prefs.keto && item?.is_keto === false) return false;
  if (prefs.low_sodium && item?.is_low_sodium === false) return false;
  if (prefs.diabetic_friendly && item?.is_diabetic_friendly === false) return false;
  if (prefs.low_fat && item?.is_low_fat === false) return false;

  return true;
}

function collectPersistedAllergenEvidence(item) {
  const evidence = new Set();

  const addToken = (value) => {
    const token = normalizeAllergenToken(value);
    if (token) evidence.add(token);
  };

  for (const list of [item?.allergens, item?.contains_allergens]) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) addToken(entry);
  }

  const chip = item?.chips?.nutrition_chip;
  if (chip && PERSISTED_ALLERGEN_CHIP_SOURCES.has(chip.source)) {
    for (const list of [chip.allergens, chip.contains_allergens]) {
      if (!Array.isArray(list)) continue;
      for (const entry of list) addToken(entry);
    }
  }

  return evidence;
}

/**
 * Allergen: hide only when persisted metadata shows a conflict.
 * Missing allergen metadata → keep item visible (conservative).
 */
export function itemConflictsAllergenPreferences(item, enabledAllergenKeys) {
  if (!enabledAllergenKeys || enabledAllergenKeys.size === 0) return false;

  const evidence = collectPersistedAllergenEvidence(item);
  if (evidence.size === 0) return false;

  for (const key of enabledAllergenKeys) {
    const matches = ALLERGEN_PROFILE_TO_EVIDENCE[key] || [normalizeAllergenToken(key)];
    if (matches.some((m) => evidence.has(normalizeAllergenToken(m)))) return true;
  }
  return false;
}

export function getClientPreferenceDisplaySections(sections, dietPrefs, enabledAllergenKeys) {
  return (Array.isArray(sections) ? sections : [])
    .map((sec) => {
      const title = asStr(sec?.title || "Menu").trim() || "Menu";
      const rawItems = Array.isArray(sec?.items) ? sec.items : [];
      const items = rawItems.filter((it) => {
        if (!isDisplayableMenuItem(it)) return false;
        if (!itemPassesPersistedDietFilter(it, dietPrefs)) return false;
        if (itemConflictsAllergenPreferences(it, enabledAllergenKeys)) return false;
        return true;
      });
      return { ...sec, title, items };
    })
    .filter((sec) => sec.items.length > 0);
}
