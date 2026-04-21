/**
 * ============================================================
 * File: locationUtils.js
 * Path: menubloc-frontend/src/lib/locationUtils.js
 * Date: 2026-04-21
 * Purpose:
 *   Non-authoritative location utilities only.
 *   Canonical route parsing/serialization now lives under src/lib/location/.
 *   This file remains only for generic input parsing, display normalization,
 *   and reverse geocoding helpers.
 * ============================================================
 */

import { normalizeLocation, LOCATION_MODE_CITY, LOCATION_MODE_GEO } from "./location/locationModel.js";
import { serializeLocationToSearch } from "./location/locationUrl.js";

export const US_STATE_ABBREVS = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
  "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
  "va","wa","wv","wi","wy","dc",
]);

/**
 * Parse a raw user-entered location string into a simple city/state-or-zip shape.
 * This helper is intentionally non-authoritative; route/location authority lives in
 * the canonical location modules under src/lib/location/.
 */
export function parseLocation(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return { zip: "", city: "", state: "", near: "", label: "" };

  if (/^\d{5}(?:-\d{4})?$/.test(raw)) {
    return { zip: raw, city: "", state: "", near: "", label: raw };
  }

  const parts = raw.split(",");
  if (parts.length >= 2) {
    const city = String(parts[0] || "").trim();
    const state = String(parts[1] || "").trim().toUpperCase();
    return { zip: "", city, state, near: "", label: raw };
  }

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

export function formatLocationLabel(city, state) {
  return [city, state].filter(Boolean).join(", ");
}

/**
 * Legacy compatibility wrapper.
 * Produces canonical city-mode or geo-mode params only; never mixes them.
 */
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
  if (explicitLocation.zip) {
    params.set("zip", explicitLocation.zip);
    return params;
  }

  if (explicitLocation.city && explicitLocation.state) {
    const canonical = normalizeLocation({
      mode: LOCATION_MODE_CITY,
      city: explicitLocation.city,
      state: explicitLocation.state,
      source: "manual",
    });
    const locationParams = serializeLocationToSearch(canonical);
    for (const [key, value] of locationParams.entries()) params.set(key, value);
    return params;
  }

  if (autoLocation?.lat != null && autoLocation?.lng != null) {
    const canonical = normalizeLocation({
      mode: LOCATION_MODE_GEO,
      lat: autoLocation.lat,
      lng: autoLocation.lng,
      radius_miles: radiusMiles,
      source: "auto",
    });
    const locationParams = serializeLocationToSearch(canonical);
    for (const [key, value] of locationParams.entries()) params.set(key, value);
  }

  return params;
}

/**
 * Legacy compatibility wrapper.
 * Produces canonical city-mode or geo-mode params only; never mixes them.
 */
export function buildBrowseLocationParams({
  urlCity = "",
  urlState = "",
  coords = null,
  radiusMiles = null,
}) {
  const city = String(urlCity || "").trim();
  const state = String(urlState || "").trim();

  if (city && state) {
    const canonical = normalizeLocation({
      mode: LOCATION_MODE_CITY,
      city,
      state,
      source: "url",
    });
    return Object.fromEntries(serializeLocationToSearch(canonical).entries());
  }

  if (coords?.lat != null && coords?.lng != null) {
    const canonical = normalizeLocation({
      mode: LOCATION_MODE_GEO,
      lat: coords.lat,
      lng: coords.lng,
      radius_miles: radiusMiles,
      source: "auto",
    });
    const entries = Object.fromEntries(serializeLocationToSearch(canonical).entries());
    if (entries.radius_miles != null) {
      entries.radius = Number(entries.radius_miles);
      delete entries.radius_miles;
    }
    return entries;
  }

  return {};
}

/**
 * Reverse geocode lat/lng using the BigDataCloud free API.
 * Returns { label, city, state, confidence }.
 */
export async function reverseGeocode(lat, lng) {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("localityLanguage", "en");

  const res = await fetch(url.toString());
  const json = await res.json().catch(() => ({}));

  const rawState =
    String(json?.principalSubdivisionCode || json?.principalSubdivision || "").trim();
  const state = rawState.includes("-") ? rawState.split("-").pop() : rawState;

  const locality = String(json?.locality || "").trim();
  const cityField = String(json?.city || "").trim();

  const adminAreas = json?.localityInfo?.administrative;
  let adminSpecific = "";
  if (Array.isArray(adminAreas) && adminAreas.length > 0) {
    const sorted = [...adminAreas].sort((a, b) => (b.adminLevel || 0) - (a.adminLevel || 0));
    adminSpecific = String(sorted[0]?.name || "").trim();
  }

  let city;
  let confidence;
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
