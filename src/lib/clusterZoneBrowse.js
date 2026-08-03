/**
 * Shared zone (terminal / section / area) helpers for airport and stadium clusters.
 * Zone values come from placeholder menu item `area` (and equivalent directory sections).
 */

export function resolveClusterType(cluster) {
  return String(cluster?.type || cluster?.cluster_type || "").trim().toLowerCase();
}

/** Singular noun for zone filter chips / aria labels. */
export function getClusterZoneNoun(cluster) {
  const type = resolveClusterType(cluster);
  if (type === "airport") return "Terminal";
  if (type === "stadium") return "Section";
  return "Area";
}

/** Restaurants directory heading for placeholder section lists. */
export function getClusterDiningByZoneHeading(cluster) {
  const type = resolveClusterType(cluster);
  if (type === "airport") return "Dining by terminal";
  if (type === "stadium") return "Dining by section";
  return "Dining by area";
}

export function getItemZoneArea(item) {
  const area = String(item?.area || "").trim();
  return area || null;
}

/** Distinct non-empty areas from loaded category items, stable alpha order. */
export function collectClusterZones(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const seen = new Set();
  for (const item of items) {
    const area = getItemZoneArea(item);
    if (area) seen.add(area);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function filterItemsByZone(items, zone) {
  if (!Array.isArray(items)) return [];
  if (!zone) return items;
  return items.filter((item) => getItemZoneArea(item) === zone);
}

/**
 * Filter by zone (optional), then sort by consumer display price.
 * @param {object[]} items
 * @param {{ zone?: string|null, priceSort?: "default"|"asc"|"desc", getPriceCents: (item: object) => number|null }} options
 */
export function applyClusterZoneAndPriceSort(items, { zone = null, priceSort = "default", getPriceCents }) {
  const filtered = filterItemsByZone(items, zone);
  if (!Array.isArray(filtered) || filtered.length === 0) return filtered;
  if (priceSort !== "asc" && priceSort !== "desc") return filtered;
  if (typeof getPriceCents !== "function") return filtered;

  const decorated = filtered.map((item, index) => ({
    item,
    index,
    cents: getPriceCents(item),
  }));
  decorated.sort((a, b) => {
    const aMissing = a.cents == null;
    const bMissing = b.cents == null;
    if (aMissing && bMissing) return a.index - b.index;
    if (aMissing) return 1;
    if (bMissing) return -1;
    const diff = priceSort === "asc" ? a.cents - b.cents : b.cents - a.cents;
    return diff !== 0 ? diff : a.index - b.index;
  });
  return decorated.map((row) => row.item);
}
