/**
 * Legal-safe copy helpers for public cluster destination pages.
 * Mirrors backend clusterLegalCopy.js so share metadata stays consistent client-side.
 */

const DEFAULT_DISCLAIMER =
  "Menuply is an independent menu discovery platform and is not affiliated with, endorsed by, or sponsored by any venue, property owner, event organizer, restaurant, or brand shown on this page unless expressly stated.";

function asText(value) {
  return value == null ? "" : String(value).trim();
}

function pickAreaName(cluster = {}) {
  return asText(cluster.legal_display_name) || asText(cluster.name) || "this area";
}

export function buildClusterShareTitle(cluster = {}) {
  if (cluster.share_title) return cluster.share_title;
  return `${pickAreaName(cluster)} Area Restaurants | Menuply`;
}

export function buildClusterShareDescription(cluster = {}) {
  if (cluster.share_description) return cluster.share_description;
  const area = pickAreaName(cluster);
  return `Browse menu information for restaurants around ${area}. Menuply is an independent menu discovery platform.`;
}

export function getClusterDisclaimer(cluster = {}) {
  return asText(cluster.disclaimer) || DEFAULT_DISCLAIMER;
}

export function getClusterPageHeading(cluster = {}) {
  return asText(cluster.page_heading) || `${pickAreaName(cluster)} area dining options`;
}

export function getClusterOverviewDescription(cluster = {}) {
  return asText(cluster.overview_description) || "";
}

export { DEFAULT_DISCLAIMER };
