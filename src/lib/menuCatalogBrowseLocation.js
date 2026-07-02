import { parseLocation, buildBrowseLocationParams } from "./locationUtils.js";
import {
  appliedLocationMatchesGeoCityState,
} from "./discoveryFeedGuardrails.js";
import {
  activeMarketsShareBrowseScope,
  resolveDiscoveryMarketLocation,
} from "./marketGate.js";

export const MENU_CATALOG_SESSION_LOCATION_KEY = "grubbid.discovery.location";
export const MENU_CATALOG_LOCAL_RADIUS_MILES = 8;

export function readMenuCatalogAppliedLocation() {
  if (typeof window === "undefined") return "";
  return String(window.sessionStorage.getItem(MENU_CATALOG_SESSION_LOCATION_KEY) || "").trim();
}

export function resolveMenuCatalogGeoBrowse({
  appliedLocation = "",
  autoLocation = null,
} = {}) {
  const geoMarketLocation = resolveDiscoveryMarketLocation({
    autoLocation,
    useAutoGeo: autoLocation?.status === "ready",
  });

  const appliedMarketLocation = appliedLocation
    ? resolveDiscoveryMarketLocation({ explicitLabel: appliedLocation })
    : null;

  const shouldUseGeoBrowse =
    autoLocation?.status === "ready" &&
    autoLocation.lat != null &&
    autoLocation.lng != null &&
    geoMarketLocation &&
    (!appliedLocation ||
      appliedLocationMatchesGeoCityState(appliedLocation, autoLocation) ||
      (appliedMarketLocation && activeMarketsShareBrowseScope(geoMarketLocation, appliedMarketLocation)));

  return { shouldUseGeoBrowse, geoMarketLocation, appliedMarketLocation };
}

/**
 * Build browse API params. Returns null while location is still resolving,
 * so callers never hit /menus/browse with an unscoped "all markets" query.
 */
export function buildMenuCatalogBrowseParams({
  urlCity = "",
  urlState = "",
  appliedLocation = "",
  autoLocation = null,
  loadMoreOffset = 0,
  section = "",
} = {}) {
  const { shouldUseGeoBrowse } = resolveMenuCatalogGeoBrowse({ appliedLocation, autoLocation });

  if (urlCity) {
    return {
      ...buildBrowseLocationParams({
        urlCity,
        urlState,
        coords:
          autoLocation?.lat != null && autoLocation?.lng != null
            ? { lat: autoLocation.lat, lng: autoLocation.lng }
            : null,
        radiusMiles: null,
      }),
      limit: 24,
      offset: loadMoreOffset,
      browse_section: section,
    };
  }

  if (appliedLocation) {
    const loc = parseLocation(appliedLocation);
    if (loc.zip && !loc.city && !loc.state) return null;
    if (loc.city) {
      return {
        ...buildBrowseLocationParams({
          urlCity: loc.city,
          urlState: loc.state || "",
          coords:
            autoLocation?.lat != null && autoLocation?.lng != null
              ? { lat: autoLocation.lat, lng: autoLocation.lng }
              : null,
          radiusMiles: null,
        }),
        limit: 24,
        offset: loadMoreOffset,
        browse_section: section,
      };
    }
  }

  if (autoLocation?.status === "locating") return null;

  // Prefer reverse-geocoded city/state over tight geo-radius browse so franchise
  // locations with CK menus (e.g. Taco Bell) appear in category tabs.
  if (autoLocation?.city) {
    return {
      ...buildBrowseLocationParams({
        urlCity: autoLocation.city,
        urlState: autoLocation.state || "",
        coords:
          autoLocation.lat != null && autoLocation.lng != null
            ? { lat: autoLocation.lat, lng: autoLocation.lng }
            : null,
        radiusMiles: null,
      }),
      limit: 24,
      offset: loadMoreOffset,
      browse_section: section,
    };
  }

  if (shouldUseGeoBrowse) {
    return {
      lat: autoLocation.lat,
      lng: autoLocation.lng,
      radius: MENU_CATALOG_LOCAL_RADIUS_MILES,
      limit: 24,
      offset: loadMoreOffset,
      browse_section: section,
    };
  }

  return null;
}

export function menuCatalogLocationLabel({
  urlCity = "",
  urlState = "",
  appliedLocation = "",
  autoLocation = null,
} = {}) {
  if (urlCity) return [urlCity, urlState].filter(Boolean).join(", ");
  if (appliedLocation) return appliedLocation;
  return autoLocation?.label || "";
}
