import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchClusterMemberIds } from "../lib/clusterApi.js";
import { readDetectedLocation } from "../lib/discoveryLocationPersistence.js";
import { clusterNavHref } from "../lib/clusterNavigation.js";
import { useMarketClusters } from "./useMarketClusters.js";

/** Same session key the home page uses for the location the viewer picked. */
const SESSION_LOCATION_KEY = "grubbid.discovery.location";

/**
 * The location "Explore clusters" lists clusters for: the viewer's chosen location, else the
 * location already detected on this device. Never asks for location itself.
 */
export function readExploreClustersLocationLabel() {
  if (typeof window === "undefined") return "";
  try {
    const chosen = String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
    if (chosen) return chosen;
  } catch {
    // sessionStorage blocked — fall through to the detected location
  }
  try {
    const detected = readDetectedLocation(window.localStorage);
    if (detected?.label) return detected.label;
    if (detected?.city && detected?.state) return `${detected.city}, ${detected.state}`;
  } catch {
    // no detected location
  }
  return "";
}

/** "USC" → "USC Cluster"; names that already say Cluster stay as they are. */
export function clusterBadgeLabel(name) {
  const clean = String(name || "").trim();
  if (!clean) return "";
  return /\bcluster$/i.test(clean) ? clean : `${clean} Cluster`;
}

const memberCache = new Map();

function loadMembers(slugs) {
  const key = [...slugs].sort().join(",");
  if (!memberCache.has(key)) {
    memberCache.set(
      key,
      fetchClusterMemberIds(slugs)
        .then((data) => (Array.isArray(data?.clusters) ? data.clusters : []))
        .catch(() => {
          memberCache.delete(key);
          return [];
        })
    );
  }
  return memberCache.get(key);
}

/**
 * Feed clip → cluster badge (Andre, 2026-10-20). A clip shows a cluster only when its
 * restaurant is a member of a cluster the viewer's Explore clusters offers (their market).
 * Exact restaurant match: a chain clip from another store is not tagged with every cluster
 * that has one of the chain's stores.
 * @returns {(restaurantId: unknown) => { slug: string, name: string, label: string, href: string } | null}
 */
export default function useFeedClipClusters() {
  const [locationLabel] = useState(readExploreClustersLocationLabel);
  const { clusters } = useMarketClusters(locationLabel);
  const [members, setMembers] = useState([]);

  const slugs = useMemo(() => clusters.map((c) => c.slug).filter(Boolean), [clusters]);
  const slugKey = slugs.join(",");

  useEffect(() => {
    if (slugs.length === 0) {
      setMembers([]);
      return undefined;
    }
    let alive = true;
    loadMembers(slugs).then((rows) => {
      if (alive) setMembers(rows);
    });
    return () => {
      alive = false;
    };
    // slugKey captures slugs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugKey]);

  const byRestaurant = useMemo(() => {
    const map = new Map();
    const memberBySlug = new Map(members.map((row) => [row.slug, row]));
    // Explore clusters order decides which cluster a restaurant in two of them shows.
    for (const cluster of clusters) {
      const row = memberBySlug.get(cluster.slug);
      if (!row) continue;
      const href = clusterNavHref(cluster);
      if (!href) continue;
      const badge = { slug: cluster.slug, name: cluster.name, label: clusterBadgeLabel(cluster.name), href };
      for (const id of row.restaurant_ids || []) {
        if (!map.has(Number(id))) map.set(Number(id), badge);
      }
    }
    return map;
  }, [clusters, members]);

  return useCallback((restaurantId) => byRestaurant.get(Number(restaurantId)) || null, [byRestaurant]);
}
