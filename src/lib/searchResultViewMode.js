function asString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function restaurantIdFromRow(row) {
  return asString(row?.restaurant_id ?? row?.restaurant?.id ?? row?.id);
}

function pickField(row, keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && asString(value) !== "") return value;
  }
  return null;
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

/** One row per restaurant for restaurant-mode search results (no dish cards). */
export function buildRestaurantBrowseRows(dishRows = [], restaurantOnlyRows = [], restaurantMetaMap = null) {
  const seen = new Set();
  const out = [];
  const metaMap = restaurantMetaMap instanceof Map ? restaurantMetaMap : new Map();

  for (const row of [...restaurantOnlyRows, ...dishRows]) {
    const id = restaurantIdFromRow(row);
    const fallbackKey = asString(
      pickField(row, ["restaurant_name", "name"]) ||
      pickField(row?.restaurant, ["restaurant_name", "name"])
    );
    const key = id || fallbackKey;
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const meta = id ? metaMap.get(id) : null;
    out.push(meta ? { ...row, ...meta, restaurant_id: id || row?.restaurant_id } : row);
  }

  return out;
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
