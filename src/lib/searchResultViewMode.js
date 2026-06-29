function asString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

function getRowDistanceMiles(row) {
  const n = asNumber(pickField(row, ["distance_miles", "restaurant_distance_miles"]));
  return n === null || n > 3000 ? null : n;
}

function getRowLatLng(row) {
  const lat = asNumber(
    pickField(row, ["lat", "restaurant_lat", "latitude"]) ??
      pickField(row?.restaurant, ["lat", "latitude"])
  );
  const lng = asNumber(
    pickField(row, ["lng", "restaurant_lng", "longitude"]) ??
      pickField(row?.restaurant, ["lng", "longitude"])
  );
  if (lat === null || lng === null || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.7613;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Distance from row fields or computed from user geo + restaurant lat/lng. */
export function resolveRestaurantBrowseDistanceMiles(row, userGeo = null) {
  const fromRow = getRowDistanceMiles(row);
  if (fromRow !== null) return fromRow;

  if (!userGeo || userGeo.lat == null || userGeo.lng == null) return null;
  const coords = getRowLatLng(row);
  if (!coords) return null;

  const miles = haversineMiles(userGeo.lat, userGeo.lng, coords.lat, coords.lng);
  return miles > 3000 ? null : miles;
}

function isCloserBrowseRow(nextRow, currentRow, userGeo = null) {
  const nextDistance = resolveRestaurantBrowseDistanceMiles(nextRow, userGeo);
  const currentDistance = resolveRestaurantBrowseDistanceMiles(currentRow, userGeo);

  if (nextDistance !== null && currentDistance !== null && nextDistance !== currentDistance) {
    return nextDistance < currentDistance;
  }
  if (nextDistance !== null && currentDistance === null) return true;
  return false;
}

function compareBrowseDistance(a, b, userGeo = null) {
  const da = resolveRestaurantBrowseDistanceMiles(a, userGeo);
  const db = resolveRestaurantBrowseDistanceMiles(b, userGeo);
  if (da !== null && db !== null && da !== db) return da - db;
  if (da !== null && db === null) return -1;
  if (da === null && db !== null) return 1;

  const nameA = asString(pickField(a, ["restaurant_name", "name"])).toLowerCase();
  const nameB = asString(pickField(b, ["restaurant_name", "name"])).toLowerCase();
  return nameA.localeCompare(nameB);
}

function finalizeRestaurantBrowseRow(row, meta, restaurantId, userGeo = null) {
  const merged = meta
    ? { ...row, ...meta, restaurant_id: restaurantId || row?.restaurant_id }
    : { ...row };

  const distances = [
    resolveRestaurantBrowseDistanceMiles(row, userGeo),
    meta ? resolveRestaurantBrowseDistanceMiles(meta, userGeo) : null,
  ].filter((value) => value !== null);

  if (distances.length) {
    const best = Math.min(...distances);
    merged.distance_miles = best;
    merged.restaurant_distance_miles = best;
  }

  return merged;
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
export function buildRestaurantBrowseRows(
  dishRows = [],
  restaurantOnlyRows = [],
  restaurantMetaMap = null,
  userGeo = null
) {
  const byKey = new Map();
  const metaMap = restaurantMetaMap instanceof Map ? restaurantMetaMap : new Map();

  for (const row of [...restaurantOnlyRows, ...dishRows]) {
    const id = restaurantIdFromRow(row);
    const fallbackKey = asString(
      pickField(row, ["restaurant_name", "name"]) ||
      pickField(row?.restaurant, ["restaurant_name", "name"])
    );
    const key = id || fallbackKey;
    if (!key) continue;

    const existing = byKey.get(key);
    if (!existing || isCloserBrowseRow(row, existing, userGeo)) {
      byKey.set(key, row);
    }
  }

  const out = [];
  for (const row of byKey.values()) {
    const id = restaurantIdFromRow(row);
    const meta = id ? metaMap.get(id) : null;
    out.push(finalizeRestaurantBrowseRow(row, meta, id, userGeo));
  }

  out.sort((a, b) => compareBrowseDistance(a, b, userGeo));
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
