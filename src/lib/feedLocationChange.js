/**
 * 2026-11-23 (Andre): change the Feed's location in place from ☰ (no trip to Search).
 * The Feed plays from the saved detected location (discoveryLocationPersistence), so a typed place is
 * geocoded to coords + city/state, saved there, and a window event tells Feed pages to reload.
 */

import { useEffect, useState } from "react";
import { saveDetectedLocation } from "./discoveryLocationPersistence.js";
import { forwardGeocode } from "./geocodeUtils.js";
import { formatLocationLabel, normalizeLocationLabel, parseLocation, reverseGeocode } from "./locationUtils.js";

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

/**
 * Typed text ("Pasadena, CA", "Austin TX", "90007", "Chicago") → { label, city, state, lat, lng } or null.
 * City + state typed: keep them as typed. Zip or city alone: take city/state from a reverse lookup.
 */
export async function resolveTypedLocation(raw, { geocode = forwardGeocode, reverse = reverseGeocode } = {}) {
  const label = normalizeLocationLabel(raw);
  if (!label) return null;
  const coords = await geocode(label).catch(() => null);
  if (!Number.isFinite(coords?.lat) || !Number.isFinite(coords?.lng)) return null;
  const parsed = parseLocation(label);
  let city = parsed.city;
  let state = parsed.state.length === 2 ? parsed.state : "";
  if (!city || !state) {
    const rev = await reverse(coords.lat, coords.lng).catch(() => null);
    city = city || String(rev?.city || "").trim();
    state = state || String(rev?.state || "").trim().toUpperCase();
  }
  if (!city || !state) return null;
  return { label: formatLocationLabel(city, state), city, state, lat: coords.lat, lng: coords.lng, confidence: "high" };
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
