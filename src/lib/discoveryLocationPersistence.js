export const DETECTED_LOCATION_KEY = "grubbid.discovery.detected_location.v1";

export function readDetectedLocation(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(DETECTED_LOCATION_KEY) || "null");
    if (!Number.isFinite(parsed?.lat) || !Number.isFinite(parsed?.lng)) return null;
    return {
      status: "ready",
      label: String(parsed.label || ""),
      city: String(parsed.city || ""),
      state: String(parsed.state || ""),
      confidence: parsed.confidence || "low",
      lat: Number(parsed.lat),
      lng: Number(parsed.lng),
    };
  } catch {
    return null;
  }
}

// Coordinates-only saves (e.g. "Find closest location") keep the known city when still nearby.
const KEEP_CITY_WITHIN_KM = 25;

function distanceKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function saveDetectedLocation(storage, location) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return false;
  try {
    let next = { ...location };
    if (!String(next.city || "").trim() || !String(next.state || "").trim()) {
      const prev = readDetectedLocation(storage);
      if (prev?.city && prev?.state && distanceKm(prev, next) <= KEEP_CITY_WITHIN_KM) {
        next = { ...next, label: prev.label, city: prev.city, state: prev.state };
      }
    }
    storage?.setItem(DETECTED_LOCATION_KEY, JSON.stringify({ status: "ready", ...next, saved_at: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

/** Re-detect when nothing is cached or the cache never got a city/state (reverse geocode missing). */
export function shouldRequestGeolocation(cachedLocation) {
  return !cachedLocation || !cachedLocation.city || !cachedLocation.state;
}

export function resolveLocationPreference({ manualLabel = "", detectedLocation = null, fallbackLabel = "" } = {}) {
  if (String(manualLabel).trim()) return { source: "manual", label: String(manualLabel).trim() };
  if (detectedLocation) return { source: "detected", ...detectedLocation };
  return { source: "fallback", label: String(fallbackLabel).trim() };
}
