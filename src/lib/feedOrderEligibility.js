/**
 * Feed Menu Browser Order icon — who may order from this restaurant (Andre, 2026-10-12).
 *
 * The viewer's market is their location preference when set, otherwise their detected
 * location. Ordering is only offered for restaurants in that market; franchises / MLEs are
 * already swapped to the local store by the menu API (franchise_market_resolution), so a local
 * branch counts as in-market. Delivery limits stay in each restaurant's delivery settings.
 *
 *   in_market        → show the icon (green when online ordering is available, else faded)
 *   out_of_market    → no icon at all (e.g. an LA restaurant's video playing in Dothan)
 *   unknown_location → faded icon; tap says "We cannot detect your location"
 */

import { parseLocation } from "./locationUtils.js";
import { activeMarketsShareBrowseScope } from "./marketGate.js";

export const FEED_ORDER_MARKET_RADIUS_MILES = 30;
export const FEED_ORDER_UNKNOWN_LOCATION_MESSAGE = "We cannot detect your location";

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

function sameMarket(a, b) {
  const cityA = clean(a?.city);
  const stateA = clean(a?.state);
  const cityB = clean(b?.city);
  const stateB = clean(b?.state);
  if (!cityA || !stateA || !cityB || !stateB) return false;
  if (cityA === cityB && stateA === stateB) return true;
  return activeMarketsShareBrowseScope(
    { city: cityA, state: stateA.toUpperCase() },
    { city: cityB, state: stateB.toUpperCase() }
  );
}

/**
 * Viewer location for the Feed Menu Browser: preference first, then detected location.
 * Coordinates are only used when they describe the same place as the preference.
 * @returns {{ source: "preference"|"detected", city: string, state: string, lat: number|null, lng: number|null } | null}
 */
export function resolveFeedViewerLocation({ preferenceLabel = "", detected = null } = {}) {
  const detectedCity = String(detected?.city || "").trim();
  const detectedState = String(detected?.state || "").trim().toUpperCase().slice(0, 2);
  const hasCoords = Number.isFinite(detected?.lat) && Number.isFinite(detected?.lng);

  const pref = String(preferenceLabel || "").trim();
  if (pref) {
    const parsed = parseLocation(pref);
    const city = String(parsed?.city || "").trim();
    const state = String(parsed?.state || "").trim().toUpperCase().slice(0, 2);
    if (city) {
      const matchesDetected =
        hasCoords && sameMarket({ city, state }, { city: detectedCity, state: detectedState });
      return {
        source: "preference",
        city,
        state,
        lat: matchesDetected ? Number(detected.lat) : null,
        lng: matchesDetected ? Number(detected.lng) : null,
      };
    }
  }

  if (hasCoords || detectedCity) {
    return {
      source: "detected",
      city: detectedCity,
      state: detectedState,
      lat: hasCoords ? Number(detected.lat) : null,
      lng: hasCoords ? Number(detected.lng) : null,
    };
  }
  return null;
}

/**
 * @param {{ viewer: ReturnType<typeof resolveFeedViewerLocation>, restaurant: { city?: string, state?: string }, distanceMiles?: number|null }} input
 * @returns {"in_market" | "out_of_market" | "unknown_location"}
 */
export function resolveFeedOrderMarketState({ viewer = null, restaurant = null, distanceMiles = null } = {}) {
  if (!viewer) return "unknown_location";
  const viewerHasCoords = Number.isFinite(viewer.lat) && Number.isFinite(viewer.lng);
  if (viewerHasCoords && Number.isFinite(distanceMiles)) {
    return distanceMiles <= FEED_ORDER_MARKET_RADIUS_MILES ? "in_market" : "out_of_market";
  }
  return sameMarket(viewer, restaurant) ? "in_market" : "out_of_market";
}
