import { readDetectedLocation } from "./discoveryLocationPersistence.js";
import { CLUSTER_DISCOVERY_LOCATION_KEY } from "./clusterLocation.js";

/**
 * City attribution for page-visit analytics when the page itself has no ?city=&state=.
 * Without this, ~90% of owner Geo traffic was "Unattributed" even though the app already
 * knew the diner's location for search. Order: location the diner chose this session,
 * then the cached detected (GPS) city. City/state label only; coordinates are never sent.
 *
 * @returns {{ market: string, source: "manual" | "detected" } | null}
 */
export function resolvePageVisitMarket({ sessionStorage: session, localStorage: local } = {}) {
  try {
    const manual = String(session?.getItem(CLUSTER_DISCOVERY_LOCATION_KEY) || "").trim();
    if (manual) return { market: manual.slice(0, 100), source: "manual" };
  } catch {
    // storage blocked — fall through
  }
  const detected = readDetectedLocation(local);
  if (detected) {
    const label =
      [detected.city, detected.state].filter((part) => String(part || "").trim()).join(", ") ||
      String(detected.label || "").trim();
    if (label) return { market: label.slice(0, 100), source: "detected" };
  }
  return null;
}
