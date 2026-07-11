/**
 * Path: menubloc-frontend/src/lib/clusterCityPresentation.js
 * Purpose: Cluster City grouping + starter presentation helpers (no count-driven UX).
 * Modified: 2026-07-11
 */

import {
  clusterDestinationCategoryLabel,
  isClusterGrowing,
} from "./clusterUrl.js";

export function clusterLifecycleLabel(cluster) {
  if (isClusterGrowing(cluster)) {
    return {
      statusLabel: "Starter",
      statusTitle: "Community contributions welcome",
    };
  }
  return {
    statusLabel: null,
    statusTitle: null,
  };
}

export function groupClustersForCitySections(clusters = []) {
  const live = [];
  const starter = [];
  for (const cluster of clusters) {
    if (isClusterGrowing(cluster)) starter.push(cluster);
    else live.push(cluster);
  }
  return { live, starter };
}

export function groupClustersByDestinationType(clusters = []) {
  const map = new Map();
  for (const cluster of clusters) {
    const type = String(cluster?.type || "other").toLowerCase();
    if (!map.has(type)) map.set(type, []);
    map.get(type).push(cluster);
  }
  return Array.from(map.entries())
    .map(([type, items]) => ({
      type,
      label: clusterDestinationCategoryLabel(type),
      clusters: items,
    }))
    .filter((section) => section.clusters.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function renderStarterChecklist(checklist = []) {
  if (!Array.isArray(checklist) || checklist.length === 0) return [];
  return checklist;
}
