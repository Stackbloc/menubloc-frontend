/**
 * ============================================================
 * File: locationUtils.js
 * Path: menubloc-frontend/src/lib/locationUtils.js
 * Date: 2026-04-03
 * Purpose:
 *   Shared location helpers used across Discovery, Browse, and
 *   Search pages. Centralises reverse geocoding and label
 *   formatting so the same precision rules apply everywhere.
 *
 *   Key fix: reverseGeocode() now prefers json.locality over
 *   json.city. BigDataCloud's json.city can return the metro
 *   area name (e.g. "Los Angeles") for suburbs like Pasadena,
 *   while json.locality reliably returns the precise incorporated
 *   city or neighbourhood name.
 * ============================================================
 */

export const US_STATE_ABBREVS = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
  "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
  "va","wa","wv","wi","wy","dc",
]);

/**
 * Parse a raw location string (user input or stored label) into structured fields.
 * Returns { zip, city, state, near, label }.
 */
export function parseLocation(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return { zip: "", city: "", state: "", near: "", label: "" };
  if (/^\d{5}(?:-\d{4})?$/.test(raw)) {
    return { zip: raw, city: "", state: "", near: "", label: raw };
  }

  // "City, ST" format
  const parts = raw.split(",");
  if (parts.length >= 2) {
    const city = String(parts[0] || "").trim();
    const state = String(parts[1] || "").trim().toUpperCase();
    return { zip: "", city, state, near: "", label: raw };
  }

  // "City ST" format — trailing 2-letter state abbreviation
  const tokens = raw.split(/\s+/);
  const last = tokens[tokens.length - 1].toLowerCase();
  if (tokens.length >= 2 && US_STATE_ABBREVS.has(last)) {
    const city = tokens.slice(0, -1).join(" ");
    return { zip: "", city, state: last.toUpperCase(), near: "", label: raw };
  }

  return { zip: "", city: raw, state: "", near: "", label: raw };
}

export function normalizeLocationLabel(rawValue) {
  const trimmed = String(rawValue || "").trim();
  if (!trimmed) return "";

  const parsed = parseLocation(trimmed);
  if (parsed.zip) return parsed.zip;

  const city = parsed.city.replace(/\b\w/g, (c) => c.toUpperCase());
  const parts = trimmed.split(",");
  const rawState = parts.length >= 2
    ? parts[1].trim()
    : (() => {
        const tokens = trimmed.split(/\s+/);
        const last = tokens[tokens.length - 1] || "";
        return US_STATE_ABBREVS.has(last.toLowerCase()) ? last : "";
      })();
  const state = rawState.toUpperCase();

  return state ? `${city}, ${state}` : city;
}

export function buildSearchLocationParams({
  query = "",
  explicitLocationValue = "",
  autoLocation = null,
  radiusMiles = null,
}) {
  const params = new URLSearchParams();
  const q = String(query || "").trim();
  if (q) params.set("q", q);

  const explicitLocation = parseLocation(explicitLocationValue);
  if (explicitLocation.zip) params.set("zip", explicitLocation.zip);
  if (explicitLocation.city) params.set("city", explicitLocation.city);
  if (explicitLocation.state) params.set("state", explicitLocation.state);
  if (explicitLocation.near) params.set("near", explicitLocation.near);
  if (explicitLocation.label) params.set("location_label", explicitLocation.label);

  if (!explicitLocation.label && autoLocation?.lat != null && autoLocation?.lng != null) {
    params.set("lat", String(autoLocation.lat));
    params.set("lng", String(autoLocation.lng));
    if (radiusMiles != null) params.set("radius_miles", String(radiusMiles));
    if (autoLocation.city) params.set("city", autoLocation.city);
    if (autoLocation.state) params.set("state", autoLocation.state);
    if (autoLocation.label) params.set("location_label", autoLocation.label);
  }

  return params;
}

export function buildBrowseLocationParams({
  urlCity = "",
  urlState = "",
  coords = null,
  radiusMiles = null,
}) {
  const params = {};
  const city = String(urlCity || "").trim();
  const state = String(urlState || "").trim();
  const hasCoords = coords?.lat != null && coords?.lng != null;

  if (city) {
    params.city = city;
    if (state) params.state = state;
    if (hasCoords) {
      params.lat = coords.lat;
      params.lng = coords.lng;
      if (radiusMiles != null) params.radius = radiusMiles;
    }
    return params;
  }

  if (hasCoords) {
    params.lat = coords.lat;
    params.lng = coords.lng;
    if (radiusMiles != null) params.radius = radiusMiles;
  }

  return params;
}

/**
 * Format city + state abbreviation into a display label.
 * formatLocationLabel("Pasadena", "CA") → "Pasadena, CA"
 */
export function formatLocationLabel(city, state) {
  return [city, state].filter(Boolean).join(", ");
}

/**
 * Reverse geocode lat/lng using the BigDataCloud free API.
 * Returns { label, city, state, confidence }.
 *
 * confidence: "high" | "medium" | "low"
 *
 * Field priority for the precise city name:
 *   1. json.locality     — most precise (neighbourhood or exact city)
 *   2. json.city         — sometimes county/metro-level for large metros
 *   3. Most-specific entry from localityInfo.administrative array
 *
 * Why locality first:
 *   BigDataCloud's json.city returns "Los Angeles" for incorporated
 *   cities like Pasadena that sit within the LA metro area. json.locality
 *   consistently returns the precise city name ("Pasadena").
 */
export async function reverseGeocode(lat, lng) {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("localityLanguage", "en");

  const res = await fetch(url.toString());
  const json = await res.json().catch(() => ({}));

  // State: principalSubdivisionCode → "US-CA" → strip prefix → "CA"
  const rawState =
    String(json?.principalSubdivisionCode || json?.principalSubdivision || "").trim();
  const state = rawState.includes("-") ? rawState.split("-").pop() : rawState;

  // Precise city: prefer locality (neighbourhood/city) over city (often metro)
  const locality = String(json?.locality || "").trim();
  const cityField = String(json?.city || "").trim();

  // Most-specific admin area as last resort
  // localityInfo.administrative entries have an adminLevel field;
  // higher adminLevel = more specific (country=2, state=4, county=6, city=8)
  const adminAreas = json?.localityInfo?.administrative;
  let adminSpecific = "";
  if (Array.isArray(adminAreas) && adminAreas.length > 0) {
    const sorted = [...adminAreas].sort((a, b) => (b.adminLevel || 0) - (a.adminLevel || 0));
    adminSpecific = String(sorted[0]?.name || "").trim();
  }

  let city, confidence;
  if (locality) {
    city = locality;
    confidence = "high";
  } else if (cityField) {
    city = cityField;
    confidence = "medium";
  } else if (adminSpecific) {
    city = adminSpecific;
    confidence = "low";
  } else {
    city = "";
    confidence = "low";
  }

  const label = [city, state].filter(Boolean).join(", ");
  return { label, city, state, confidence };
}
