/**
 * Stable diner coordinates for /search (2026-10-23).
 *
 * Two back-to-back searches from the same spot used to return different results:
 * the page fired /search before the browser location arrived (no lat/lng → a
 * city-wide result set), then fired again with coordinates. Each fresh GPS fix
 * also jittered by tens of meters, which re-ranked distance ties.
 *
 * Rules:
 *  - Wait for the location (up to SEARCH_GEO_WAIT_MS) before the first search.
 *  - Reuse the last fix for SEARCH_GEO_TTL_MS so repeat searches send the same point.
 *  - Round to 3 decimals (~100 m) and ignore moves under SEARCH_GEO_MOVE_MILES.
 */

export const SEARCH_GEO_KEY = "menuply.search.last_geo.v1";
export const SEARCH_GEO_TTL_MS = 30 * 60 * 1000;
export const SEARCH_GEO_WAIT_MS = 4000;
export const SEARCH_GEO_MOVE_MILES = 0.15;

export function roundSearchCoord(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1000) / 1000;
}

function distanceMiles(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}

export function readRecentSearchGeo(storage, now = Date.now()) {
  try {
    const parsed = JSON.parse(storage?.getItem(SEARCH_GEO_KEY) || "null");
    if (!Number.isFinite(parsed?.lat) || !Number.isFinite(parsed?.lng)) return null;
    if (!Number.isFinite(parsed?.saved_at) || now - parsed.saved_at > SEARCH_GEO_TTL_MS) return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

export function saveSearchGeo(storage, coords, now = Date.now()) {
  const lat = roundSearchCoord(coords?.lat);
  const lng = roundSearchCoord(coords?.lng);
  if (lat == null || lng == null) return false;
  try {
    storage?.setItem(SEARCH_GEO_KEY, JSON.stringify({ lat, lng, saved_at: now }));
    return true;
  } catch {
    return false;
  }
}

/** Keep the previous point unless the diner actually moved. */
export function nextStableSearchGeo(prev, fix) {
  const lat = roundSearchCoord(fix?.lat);
  const lng = roundSearchCoord(fix?.lng);
  if (lat == null || lng == null) return prev || null;
  const next = { lat, lng };
  if (!Number.isFinite(prev?.lat) || !Number.isFinite(prev?.lng)) return next;
  return distanceMiles(prev, next) < SEARCH_GEO_MOVE_MILES ? prev : next;
}

/**
 * "wait" while an auto-location search is still waiting for the browser location;
 * "go" once it arrives, fails, times out, or the URL already names a place.
 */
export function searchGeoGate({ geoStatus, hasExplicitLocation, hasRouteCoords, waitExpired }) {
  if (hasExplicitLocation || hasRouteCoords) return "go";
  if (geoStatus !== "pending") return "go";
  return waitExpired ? "go" : "wait";
}
