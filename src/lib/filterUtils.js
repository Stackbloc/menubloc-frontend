export const FILTER_KEYS = [
  "vegan", "vegetarian", "gluten_free", "dairy_free",
  "diabetic_friendly", "keto", "low_sodium", "deals",
];

export const FILTER_LABELS = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  gluten_free: "Gluten-Free",
  dairy_free: "Dairy-Free",
  diabetic_friendly: "Diabetic-Friendly",
  keto: "Keto",
  low_sodium: "Low-Sodium",
  deals: "Deals",
};

export const EMPTY_FILTERS = Object.fromEntries(FILTER_KEYS.map((k) => [k, false]));

export function parseFiltersFromUrl(params) {
  return {
    vegan: params.get("vegan") === "1",
    vegetarian: params.get("vegetarian") === "1",
    gluten_free: params.get("gluten_free") === "1",
    dairy_free: params.get("dairy_free") === "1",
    diabetic_friendly: params.get("diabetic_friendly") === "1",
    keto: params.get("keto") === "1" || params.get("low_carb") === "1",
    low_sodium: params.get("low_sodium") === "1",
    deals: params.get("deals") === "1" || params.get("deals_only") === "1",
  };
}

export function filtersToUrlParams(filters, baseParams) {
  const next = new URLSearchParams(baseParams ? baseParams.toString() : "");
  const boolKeys = {
    vegan: "vegan",
    vegetarian: "vegetarian",
    gluten_free: "gluten_free",
    dairy_free: "dairy_free",
    diabetic_friendly: "diabetic_friendly",
    keto: "keto",
    low_sodium: "low_sodium",
    deals: "deals",
  };
  for (const [filterKey, paramKey] of Object.entries(boolKeys)) {
    if (filters[filterKey]) next.set(paramKey, "1");
    else next.delete(paramKey);
  }
  next.delete("low_carb");
  next.delete("deals_only");
  return next;
}

export function hasActiveFilters(filters) {
  return FILTER_KEYS.some((k) => filters[k]);
}

export function activeFilterList(filters) {
  return FILTER_KEYS.filter((k) => filters[k]).map((k) => ({
    key: k,
    label: FILTER_LABELS[k],
  }));
}
