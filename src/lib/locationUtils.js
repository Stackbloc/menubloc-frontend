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
