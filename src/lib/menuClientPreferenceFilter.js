/**
 * Client-side saved preference application for public menus.
 * Uses persisted item metadata only — no free-text inference at render time.
 */

import {
  activePrefLabels,
  hasActiveDietPrefs,
  itemPassesDietFilter,
} from "../hooks/useDietPreferences.js";


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

const PERSISTED_ALLERGEN_CHIP_SOURCES = new Set([
  "chain_official",
  "reference_dataset",
  "Menuply inference",
  "Grubbid inference",
]);

const MENU_TEXT_ALLERGEN_KEYWORDS = {
  peanuts: ["peanut", "peanuts", "pb&j", "groundnut"],
  tree_nuts: ["almond", "walnut", "pecan", "cashew", "pistachio", "hazelnut", "macadamia", "tree nut"],
  dairy: ["cheese", "milk", "cream", "butter", "yogurt", "whey", "lactose", "alfredo", "queso"],
  gluten: ["wheat", "gluten", "bread", "flour", "breadcrumb", "crouton", "pasta", "noodle", "tortilla"],
  shellfish: ["shrimp", "crab", "lobster", "crawfish", "clam", "mussel", "oyster", "scallop"],
  soy: ["soy", "tofu", "edamame", "miso", "tempeh"],
  eggs: ["egg", "eggs", "omelet", "omelette", "mayo", "mayonnaise", "meringue"],
  fish: ["fish", "salmon", "tuna", "cod", "anchovy", "anchovies", "tilapia", "trout"],
  sesame: ["sesame", "tahini"],
  wheat: ["wheat", "flour", "bread", "breadcrumb", "crouton"],
};

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
    high_protein: enabledDietKeys.has("high_protein"),
    keto: enabledDietKeys.has("keto") || enabledDietKeys.has("low_carb"),
    low_carb: enabledDietKeys.has("low_carb"),
    low_fat: enabledDietKeys.has("low_fat"),
    low_sodium: enabledDietKeys.has("low_sodium"),
    nut_free: enabledDietKeys.has("nut_free"),
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
  high_protein: false,
  keto: false,
  low_carb: false,
  low_fat: false,
  low_sodium: false,
  nut_free: false,
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

const MENU_TEXT_MEAT_KEYWORDS = [
  "beef",
  "pork",
  "bacon",
  "ham",
  "sausage",
  "chicken",
  "turkey",
  "steak",
  "fish",
  "shrimp",
  "salmon",
  "tuna",
  "crab",
  "lobster",
  "pepperoni",
  "salami",
  "chorizo",
  "prosciutto",
  "meatball",
  "brisket",
  "ribs",
  "lamb",
  "duck",
  "anchovy",
];

const MENU_TEXT_VEG_OVERRIDE_PHRASES = [
  "veggie burger",
  "vegetable burger",
  "vegan burger",
  "plant based",
  "plant-based",
  "meatless",
  "veggie sausage",
  "impossible",
  "beyond burger",
];

function normalizeMenuText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function menuTextHasKeyword(text, keyword) {
  const escaped = keyword.replace(/[-\s]+/g, "[-\\s]?");
  const re = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
  return re.test(text);
}

/**
 * Belt-and-suspenders when API chips are missing: obvious meat in item title/description.
 */
export function itemHasObviousMenuTextDietConflict(item, prefs) {
  if (!hasActiveDietPrefs(prefs)) return false;
  if (!prefs.vegan && !prefs.vegetarian) return false;

  const text = normalizeMenuText(
    [item?.name, item?.item_name, item?.description, item?.item_description].filter(Boolean).join(" ")
  );
  if (!text) return false;

  if (MENU_TEXT_VEG_OVERRIDE_PHRASES.some((phrase) => text.includes(phrase))) {
    return false;
  }

  return MENU_TEXT_MEAT_KEYWORDS.some((keyword) => menuTextHasKeyword(text, keyword));
}

function itemHasObviousMenuTextDietPass(item, prefs) {
  if (!prefs.vegan && !prefs.vegetarian) return false;
  const text = normalizeMenuText(
    [item?.name, item?.item_name, item?.description, item?.item_description].filter(Boolean).join(" ")
  );
  if (!text) return false;
  if (/\b(vegan|vegetarian)\b/i.test(text)) return true;
  return MENU_TEXT_VEG_OVERRIDE_PHRASES.some((phrase) => text.includes(phrase));
}

/**
 * Strict diet filter — uses backend tri-state chips when present, otherwise DB flags
 * and menu-text meat detection. Unknown/unconfirmed items are hidden for hard filters.
 */
export function itemPassesPersistedDietFilter(item, prefs) {
  if (!hasActiveDietPrefs(prefs)) return true;
  if (itemHasObviousMenuTextDietConflict(item, prefs)) return false;
  if (itemHasObviousMenuTextDietPass(item, prefs)) return true;
  if (!itemPassesDietFilter(item, prefs)) return false;
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
  if (chip) {
    const useChipAllergens =
      !chip.source || PERSISTED_ALLERGEN_CHIP_SOURCES.has(chip.source);
    if (useChipAllergens) {
      for (const list of [chip.allergens, chip.contains_allergens]) {
        if (!Array.isArray(list)) continue;
        for (const entry of list) addToken(entry);
      }
    }
  }

  return evidence;
}

function collectMenuTextAllergenEvidence(item) {
  const evidence = new Set();
  const text = normalizeMenuText(
    [item?.name, item?.item_name, item?.description, item?.item_description].filter(Boolean).join(" ")
  );
  if (!text) return evidence;

  for (const [key, keywords] of Object.entries(MENU_TEXT_ALLERGEN_KEYWORDS)) {
    if (keywords.some((keyword) => menuTextHasKeyword(text, keyword))) {
      evidence.add(normalizeAllergenToken(key));
      for (const alias of ALLERGEN_PROFILE_TO_EVIDENCE[key] || []) {
        evidence.add(normalizeAllergenToken(alias));
      }
    }
  }
  return evidence;
}

/**
 * Allergen: hide when persisted or inferred metadata shows a conflict.
 */
export function itemConflictsAllergenPreferences(item, enabledAllergenKeys) {
  if (!enabledAllergenKeys || enabledAllergenKeys.size === 0) return false;

  const evidence = new Set([
    ...collectPersistedAllergenEvidence(item),
    ...collectMenuTextAllergenEvidence(item),
  ]);
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
