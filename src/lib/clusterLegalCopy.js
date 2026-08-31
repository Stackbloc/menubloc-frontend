/**
 * Legal-safe copy helpers for public cluster destination pages.
 * Mirrors backend clusterLegalCopy.js so share metadata stays consistent client-side.
 * Document title/description prefer clusterSeoContent when the slug is configured.
 */

import { getClusterSeoContent, resolveClusterDocumentMeta } from "./clusterSeoContent.js";

const DEFAULT_DISCLAIMER =
  "Menuply is an independent menu discovery platform and is not affiliated with, endorsed by, or sponsored by any venue, university, property owner, restaurant, or organization shown unless expressly stated.";

function asText(value) {
  return value == null ? "" : String(value).trim();
}

function pickAreaName(cluster = {}) {
  return asText(cluster.legal_display_name) || asText(cluster.name) || "this area";
}

export function buildClusterShareTitle(cluster = {}) {
  const seoTitle = resolveClusterDocumentMeta(cluster).title;
  if (seoTitle) return seoTitle;
  if (cluster.share_title) return cluster.share_title;
  return `${pickAreaName(cluster)} | Menuply`;
}

export function buildClusterShareDescription(cluster = {}) {
  const seoDescription = resolveClusterDocumentMeta(cluster).description;
  if (seoDescription) return seoDescription;
  if (cluster.share_description) return cluster.share_description;
  const area = pickAreaName(cluster);
  return `Explore what you can eat at ${area}. Menuply is an independent menu discovery platform.`;
}

export function getClusterDisclaimer(cluster = {}) {
  return asText(cluster.disclaimer) || DEFAULT_DISCLAIMER;
}

export function getClusterPageHeading(cluster = {}) {
  const seo = getClusterSeoContent(cluster?.slug);
  if (seo?.displayName) return `${seo.displayName} area dining options`;
  return asText(cluster.page_heading) || `${pickAreaName(cluster)} area dining options`;
}

export function getClusterProductTitle(cluster = {}) {
  const seo = getClusterSeoContent(cluster?.slug);
  const area = seo?.displayName || asText(cluster.area_name) || pickAreaName(cluster);
  if (!area || area === "this area") return "Cluster";
  return `${area} Cluster`;
}

export function getClusterOverviewDescription(cluster = {}) {
  return asText(cluster.overview_description) || "";
}

export { DEFAULT_DISCLAIMER };
