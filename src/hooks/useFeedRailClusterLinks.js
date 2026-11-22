/**
 * Created 2026-11-22: the Feed clip rail's Wall + Clusters circles (web follows app dd4b302/d36bd97,
 * Andre 2026-11-21). They show only where the diner's city (chosen, else detected location) has
 * them. California (the test market) or no known city: USC and the USC Wall, like the Clusters
 * rule (clusterLocation.js, 2026-11-20). Elsewhere: the city's first Cluster in nav order, and the
 * first of its Clusters with a Wall (VITE_CLUSTER_WALL_SLUGS, default usc). Dothan, AL has neither,
 * so neither circle shows. Never asks for location itself.
 */
import { useMemo, useState } from "react";
import { useMarketClusters } from "./useMarketClusters.js";
import { clusterNavHref } from "../lib/clusterNavigation.js";
import { isClusterWallSlug } from "../lib/clusterWallStyles.js";
import {
  marketDisplayLabel,
  marketOutsideClustersHome,
  resolveClusterMarketFromStoredLocation,
} from "../lib/clusterLocation.js";
import { FEED_CLUSTERS_TAB_PATH } from "../lib/feedShellLinks.js";

export const FEED_HOME_CLUSTER_SLUG = "usc";

/** The full Wall page for a cluster slug (App.jsx /clusters/walls/:wallSlug). */
export function clusterWallHref(slug) {
  const clean = String(slug || "").trim().toLowerCase();
  return clean ? `/clusters/walls/${encodeURIComponent(clean)}` : null;
}

/** California / no city: USC + the USC Wall (when USC has a Wall). */
export function homeFeedRailClusterLinks() {
  return {
    clustersHref: FEED_CLUSTERS_TAB_PATH,
    wallHref: isClusterWallSlug(FEED_HOME_CLUSTER_SLUG) ? clusterWallHref(FEED_HOME_CLUSTER_SLUG) : null,
  };
}

/** Outside California: the city's Clusters (already in nav order) → first Cluster + first with a Wall. */
export function pickFeedRailClusterLinks(clusters) {
  const list = Array.isArray(clusters) ? clusters : [];
  const first = list.find((c) => clusterNavHref(c));
  const wall = list.find((c) => isClusterWallSlug(c?.slug));
  return {
    clustersHref: first ? clusterNavHref(first) : null,
    wallHref: wall ? clusterWallHref(wall.slug) : null,
  };
}

/** @returns {{ clustersHref: string|null, wallHref: string|null }} */
export default function useFeedRailClusterLinks() {
  const [market] = useState(resolveClusterMarketFromStoredLocation);
  const outside = marketOutsideClustersHome(market);
  // Only fetch outside California; at home the links are fixed. "Austin, TX" form (2-letter state).
  const { clusters } = useMarketClusters(outside ? marketDisplayLabel(market) : "");
  return useMemo(
    () => (outside ? pickFeedRailClusterLinks(clusters) : homeFeedRailClusterLinks()),
    [outside, clusters]
  );
}
