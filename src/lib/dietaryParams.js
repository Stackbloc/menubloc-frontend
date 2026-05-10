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
    diabetic_friendly: filters.diabetic_friendly ? 1 : "",
    keto: filters.keto ? 1 : "",
    low_carb: filters.keto || filters.low_carb ? 1 : "",
    low_fat: filters.low_fat ? "true" : "",
    low_sodium: filters.low_sodium ? 1 : "",
    high_protein: filters.high_protein ? 1 : "",
    glp1_friendly: filters.glp1_friendly ? 1 : "",
  };
}
