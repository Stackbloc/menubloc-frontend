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

export function saveDetectedLocation(storage, location) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return false;
  try {
    storage?.setItem(DETECTED_LOCATION_KEY, JSON.stringify({ ...location, saved_at: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function shouldRequestGeolocation(cachedLocation) {
  return !cachedLocation;
}

export function resolveLocationPreference({ manualLabel = "", detectedLocation = null, fallbackLabel = "" } = {}) {
  if (String(manualLabel).trim()) return { source: "manual", label: String(manualLabel).trim() };
  if (detectedLocation) return { source: "detected", ...detectedLocation };
  return { source: "fallback", label: String(fallbackLabel).trim() };
}
