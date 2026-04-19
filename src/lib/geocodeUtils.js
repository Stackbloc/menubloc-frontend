const CACHE_KEY_PREFIX = "grubbid.geocode.";
const TIMEOUT_MS = 5000;

function cacheKey(label) {
  return CACHE_KEY_PREFIX + label.trim().toLowerCase().replace(/\s+/g, " ");
}

function readCache(label) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(cacheKey(label));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lng)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeCache(label, coords) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(cacheKey(label), JSON.stringify({ lat: coords.lat, lng: coords.lng }));
  } catch {}
}

export async function forwardGeocode(label) {
  if (!label) return null;

  const cached = readCache(label);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", label);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "us");

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "Grubbid/1.0", "Accept-Language": "en-US,en;q=0.9" },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn("[forwardGeocode] HTTP %d for: %s", res.status, label);
      return null;
    }

    const json = await res.json();
    if (!Array.isArray(json) || !json[0]) {
      console.warn("[forwardGeocode] no results for: %s", label);
      return null;
    }

    const lat = parseFloat(json[0].lat);
    const lng = parseFloat(json[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.warn("[forwardGeocode] invalid coords in response for: %s", label);
      return null;
    }

    const coords = { lat, lng };
    writeCache(label, coords);
    return coords;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      console.warn("[forwardGeocode] timeout (%dms) for: %s", TIMEOUT_MS, label);
    } else {
      console.warn("[forwardGeocode] failed for: %s — %s", label, err.message);
    }
    return null;
  }
}
