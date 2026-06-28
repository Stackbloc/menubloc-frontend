import { dedupeDiscoveryMenus } from "./discoveryFeedGuardrails.js";

const SECTION_MAX = 4;

function menuKey(menu) {
  return menu?.menu_id ?? menu?.restaurant_id ?? null;
}

function pickUnique(menus, used, max = SECTION_MAX) {
  const picked = [];
  for (const menu of menus) {
    const key = menuKey(menu);
    if (!key || used.has(key)) continue;
    used.add(key);
    picked.push(menu);
    if (picked.length >= max) break;
  }
  return picked;
}

/**
 * Slice a location-scoped browse feed into curated sections.
 * Every section includes a human-readable reason for visibility.
 */
export function buildHomeDiscoverySections(menus, { hasGeo = false } = {}) {
  const deduped = dedupeDiscoveryMenus(menus);
  if (!deduped.length) return [];

  const used = new Set();
  const sections = [];

  const popular = pickUnique(
    [...deduped].sort((a, b) => Number(b.menu_item_count || 0) - Number(a.menu_item_count || 0)),
    used
  );
  if (popular.length) {
    sections.push({
      id: "popular",
      title: "Popular Menus",
      reason: "Restaurants with the most menu items near you",
      menus: popular,
    });
  }

  if (hasGeo) {
    const nearby = pickUnique(
      [...deduped]
        .filter((m) => Number.isFinite(Number(m.distance_miles)))
        .sort((a, b) => Number(a.distance_miles) - Number(b.distance_miles)),
      used
    );
    if (nearby.length) {
      sections.push({
        id: "nearby",
        title: "Nearby Picks",
        reason: "Closest restaurants with published menus",
        menus: nearby,
      });
    }
  }

  const diverse = pickUnique(
    [...deduped].sort((a, b) => {
      const cuisineCmp = String(a.cuisine || "").localeCompare(String(b.cuisine || ""));
      if (cuisineCmp !== 0) return cuisineCmp;
      return String(a.restaurant_name || "").localeCompare(String(b.restaurant_name || ""));
    }),
    used
  );
  if (diverse.length) {
    sections.push({
      id: "discover",
      title: "Discover More",
      reason: "Variety across cuisines in your area",
      menus: diverse,
    });
  }

  const remainder = pickUnique(deduped, used, SECTION_MAX);
  if (remainder.length) {
    sections.push({
      id: "more",
      title: "More to Explore",
      reason: "Additional menus worth a look",
      menus: remainder,
    });
  }

  return sections;
}
