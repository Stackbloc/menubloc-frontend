/**
 * Build canonical dietary query params for discovery/search/browse requests.
 *
 * `keto` is exposed in the UI, but several downstream evaluator-backed paths
 * consume the equivalent `low_carb` filter. Send both so filtering stays
 * consistent across all surfaces.
 */

export function buildDietaryQueryParams(filters = {}) {
  return {
    vegan: filters.vegan ? 1 : "",
    vegetarian: filters.vegetarian ? 1 : "",
    gluten_free: filters.gluten_free ? 1 : "",
    dairy_free: filters.dairy_free ? 1 : "",
    nut_free: filters.nut_free ? 1 : "",
    diabetic_friendly: filters.diabetic_friendly ? 1 : "",
    keto: filters.keto ? 1 : "",
    low_carb: filters.keto || filters.low_carb ? 1 : "",
    low_fat: filters.low_fat ? "true" : "",
    low_sodium: filters.low_sodium ? 1 : "",
    high_protein: filters.high_protein ? 1 : "",
    glp1_friendly: filters.glp1_friendly ? 1 : "",
  };
}

/**
 * Append saved profile diet/allergen params so public menu API runs runtime evaluation.
 * @param {URLSearchParams} params
 * @param {{ applyDietaryPreferences?: boolean, dietPrefs?: object, enabledAllergenKeys?: Set<string> }} options
 */
export function appendSavedMenuPreferenceQueryParams(
  params,
  { applyDietaryPreferences = false, dietPrefs = {}, enabledAllergenKeys = new Set() } = {}
) {
  const dietActive =
    applyDietaryPreferences && Object.values(dietPrefs || {}).some(Boolean);
  const allergenKeys =
    enabledAllergenKeys instanceof Set ? enabledAllergenKeys : new Set(enabledAllergenKeys || []);
  const allergenActive = allergenKeys.size > 0;

  if (!dietActive && !allergenActive) return;

  if (dietActive) {
    for (const [key, value] of Object.entries(buildDietaryQueryParams(dietPrefs))) {
      if (value !== "" && value != null) params.set(key, String(value));
    }
  }

  if (allergenActive) {
    params.set("allergen_keys", [...allergenKeys].join(","));
    params.set("include_allergens", "1");
  }
}
