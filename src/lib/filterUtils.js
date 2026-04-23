export const FILTER_KEYS = [
  "vegan", "vegetarian", "gluten_free", "dairy_free",
  "diabetic_friendly", "keto", "low_sodium", "deals",
  "energy", "immunity", "vitamin_c",
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
  energy: "Energy",
  immunity: "Immunity",
  vitamin_c: "High Vitamin C",
};

export const EMPTY_FILTERS = Object.fromEntries(FILTER_KEYS.map((k) => [k, false]));

export function parseFiltersFromUrl(params) {
  const goal = String(params.get("goal") || "").trim().toLowerCase();
  return {
    vegan: params.get("vegan") === "1",
    vegetarian: params.get("vegetarian") === "1",
    gluten_free: params.get("gluten_free") === "1",
    dairy_free: params.get("dairy_free") === "1",
    diabetic_friendly: params.get("diabetic_friendly") === "1",
    keto: params.get("keto") === "1" || params.get("low_carb") === "1",
    low_sodium: params.get("low_sodium") === "1",
    deals: params.get("deals") === "1" || params.get("deals_only") === "1",
    energy: goal === "energy",
    immunity: goal === "immunity",
    vitamin_c: goal === "vitamin_c",
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
  if (filters.energy && !filters.immunity && !filters.vitamin_c) next.set("goal", "energy");
  else if (filters.immunity && !filters.energy && !filters.vitamin_c) next.set("goal", "immunity");
  else if (filters.vitamin_c && !filters.energy && !filters.immunity) next.set("goal", "vitamin_c");
  else next.delete("goal");
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
