function asString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function restaurantIdFromRow(row) {
  return asString(row?.restaurant_id ?? row?.restaurant?.id ?? row?.id);
}

/** Unique restaurant venues represented in the current result set. */
export function countUniqueRestaurants(dishRows = [], restaurantOnlyRows = []) {
  const ids = new Set();
  for (const row of [...dishRows, ...restaurantOnlyRows]) {
    const id = restaurantIdFromRow(row);
    if (id) ids.add(id);
  }
  return ids.size;
}

/**
 * Show dish/restaurant mode radios for ambiguous food/category searches only.
 * Hide for brand/restaurant-name searches and when restaurant mode adds no value.
 */
export function shouldShowSearchResultModeSelector({
  directRestaurantName = false,
  suppressMenuItems = false,
  dishCount = 0,
  restaurantCount = 0,
} = {}) {
  if (suppressMenuItems || directRestaurantName) return false;
  if (dishCount <= 0 || restaurantCount <= 0) return false;
  if (restaurantCount <= 1) return false;
  return true;
}
