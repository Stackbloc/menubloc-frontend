function normalizeParamValue(value) {
  return String(value || "").trim();
}

export function buildRestaurantFilterQueryParams(filters = {}) {
  const cuisine = normalizeParamValue(filters.cuisine);
  const category = normalizeParamValue(filters.category);

  return {
    cuisine: cuisine || "",
    category: category || "",
  };
}
