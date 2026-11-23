/**
 * 2026-11-23 (Andre): change the Feed's location in place from ☰ (no trip to Search).
 * The Feed plays from the saved detected location (discoveryLocationPersistence), so a typed city is
 * looked up in our US city table (coords + city/state), saved there, and a window event tells Feed pages to reload.
 */

import { useEffect, useState } from "react";
import { saveDetectedLocation } from "./discoveryLocationPersistence.js";
import { searchUsCities } from "./locationReferenceApi.js";
import { formatLocationLabel, normalizeLocationLabel, parseLocation } from "./locationUtils.js";

export const FEED_LOCATION_EVENT = "menuply:feed-location-changed";
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const RECENT_LOCATIONS_KEY = "grubbid.recent.locations";
const MAX_RECENT = 3;

export function loadRecentLocations(storage) {
  try {
    const list = JSON.parse(storage?.getItem(RECENT_LOCATIONS_KEY) || "[]");
    return Array.isArray(list) ? list.filter((l) => typeof l === "string" && l.trim()) : [];
  } catch {
    return [];
  }
}

export function saveRecentLocation(storage, label) {
  if (!label) return;
  try {
    const rest = loadRecentLocations(storage).filter((l) => l !== label);
    storage?.setItem(RECENT_LOCATIONS_KEY, JSON.stringify([label, ...rest].slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

export function removeRecentLocation(storage, label) {
  try {
    storage?.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(loadRecentLocations(storage).filter((l) => l !== label)));
  } catch {
    // ignore
  }
}

/** A row from our own city table (/public/locations/cities/search) → the saved Feed place. */
export function cityRowToPlace(row) {
  const city = String(row?.city_name || "").trim();
  const state = String(row?.state_code || "").trim().toUpperCase();
  const lat = Number(row?.lat);
  const lng = Number(row?.lng);
  if (!city || !state || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label: formatLocationLabel(city, state), city, state, lat, lng, confidence: "high" };
}

/** Split "Austin, TX" / "austin tx" / "Austin" into the city search's q + state. */
export function cityQuery(raw) {
  const parsed = parseLocation(normalizeLocationLabel(raw));
  if (parsed.zip) return null;
  const q = String(parsed.city || "").trim();
  if (q.length < 2) return null;
  return { q, state: parsed.state.length === 2 ? parsed.state : null };
}

/**
 * Typed text ("Pasadena, CA", "Austin TX", "Chicago") → { label, city, state, lat, lng } or null.
 * 2026-11-23: uses our own US city table (the site's CSP blocks outside geocoders); exact name first.
 */
export async function resolveTypedLocation(raw, { search = searchUsCities } = {}) {
  const query = cityQuery(raw);
  if (!query) return null;
  const rows = await search(query.q, query.state, 10).catch(() => []);
  const want = query.q.toLowerCase();
  const exact = rows.find((r) => String(r?.city_name || "").toLowerCase() === want);
  return cityRowToPlace(exact || rows[0]);
}

/** Save the place the Feed plays from, remember it, and tell open Feed pages. */
export function applyFeedLocation(resolved, { local, session } = {}) {
  const ls = local ?? (typeof window !== "undefined" ? window.localStorage : null);
  const ss = session ?? (typeof window !== "undefined" ? window.sessionStorage : null);
  if (!saveDetectedLocation(ls, resolved)) return false;
  try {
    ss?.setItem(SESSION_LOCATION_KEY, resolved.label);
  } catch {
    // ignore
  }
  saveRecentLocation(ls, resolved.label);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(FEED_LOCATION_EVENT));
  return true;
}

/** Re-render counter for Feed pages that read the saved location. */
export function useFeedLocationVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(FEED_LOCATION_EVENT, bump);
    return () => window.removeEventListener(FEED_LOCATION_EVENT, bump);
  }, []);
  return version;
}
