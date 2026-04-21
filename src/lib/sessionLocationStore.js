import { parseLocationFromSearch, serializeLocationToSearch, mergeLocationIntoSearch } from "./location/locationUrl.js";
import { buildLocationLabel } from "./location/locationLabel.js";
import { buildApiLocationParams } from "./location/locationRequest.js";

export const SESSION_LOCATION_STATE_KEY = "grubbid.session.location.v1";
export const LEGACY_LOCATION_KEY = "grubbid.discovery.location";
export const LEGACY_GEO_KEY = "grubbid.discovery.geo";

const LOCATION_PARAM_KEYS = [
  "mode",
  "city",
  "state",
  "lat",
  "lng",
  "radius_miles",
  "radius",
  "zip",
  "near",
  "location_label",
];

function canUseSessionStorage() {
  return typeof window !== "undefined" && !!window.sessionStorage;
}

function emptyState() {
  return { selected: null, manual: null, auto: null };
}

function isValidSnapshot(snapshot) {
  return !!snapshot && buildApiLocationParams(snapshot) !== null;
}

/**
 * Session storage is no longer authoritative for active location.
 * This module now preserves API compatibility only.
 */
export function readLocationSessionState() {
  return emptyState();
}

/**
 * No-op compatibility wrapper.
 * Session storage must not control page-level location authority.
 */
export function writeLocationSessionState() {
  if (canUseSessionStorage()) {
    try {
      window.sessionStorage.removeItem(SESSION_LOCATION_STATE_KEY);
      window.sessionStorage.removeItem(LEGACY_LOCATION_KEY);
      window.sessionStorage.removeItem(LEGACY_GEO_KEY);
    } catch {
      // Ignore storage failures.
    }
  }
  return emptyState();
}

/**
 * No-op compatibility wrapper.
 */
export function setManualSessionLocation() {
  return emptyState();
}

/**
 * No-op compatibility wrapper.
 */
export function clearManualSessionLocation() {
  return emptyState();
}

/**
 * No-op compatibility wrapper.
 */
export function seedAutoSessionLocation() {
  return emptyState();
}

export function snapshotFromUrlParams(params) {
  if (!params) return null;
  const snapshot = parseLocationFromSearch(params);
  return isValidSnapshot(snapshot) ? snapshot : null;
}

export function clearLocationParams(params) {
  const next = new URLSearchParams(params.toString());
  LOCATION_PARAM_KEYS.forEach((key) => next.delete(key));
  return next;
}

export function applyLocationSnapshotToParams(params, snapshot) {
  return mergeLocationIntoSearch(params, snapshot);
}

export function locationParamsMatchSnapshot(params, snapshot) {
  if (!isValidSnapshot(snapshot)) return false;

  const current = clearLocationParams(params);
  const expected = serializeLocationToSearch(snapshot);
  for (const [key, value] of expected.entries()) {
    current.set(key, value);
  }
  return current.toString() === expected.toString();
}

export function snapshotLabel(snapshot) {
  return buildLocationLabel(snapshot);
}
