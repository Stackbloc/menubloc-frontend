/**
 * Map Place membership restaurants into Yellow Browser browse entries.
 * Cluster-scoped decks use GET /public/clusters/:slug/restaurants (not city /menus/browse).
 */

import { MENU_BROWSER_VENUE_SLUGS } from "./menuBrowserVenueCover.js";

export function isMenuBrowserClusterScope(slug) {
  const key = String(slug || "").trim().toLowerCase();
  return MENU_BROWSER_VENUE_SLUGS.includes(key);
}

export function isClusterRestaurantMenuReady(row) {
  if (!row || typeof row !== "object") return false;
  if (row.menu_ready === true) return true;
  if (row.menu_ready === false) return false;
  const state = String(row.menu_availability_state || "").trim().toLowerCase();
  if (state === "ready" || state === "menu_ready") return true;
  return Boolean(row.has_menu);
}

/**
 * @param {object} row
 * @returns {object|null}
 */
export function mapClusterRestaurantToBrowseEntry(row) {
  if (!row || typeof row !== "object") return null;
  const restaurantId = row.restaurant_id ?? row.id;
  if (restaurantId == null || restaurantId === "") return null;
  return {
    restaurant_id: restaurantId,
    restaurant_name: row.restaurant_name || row.name || "Restaurant",
    slug: row.slug || null,
    city: row.city || null,
    state: row.state || null,
    cuisine: row.cuisine || null,
    category: row.category || null,
    restaurant_type: row.restaurant_type || null,
    menu_ready: isClusterRestaurantMenuReady(row),
    has_menu: row.has_menu ?? null,
    menu_count: row.menu_count ?? null,
    menu_item_count: row.menu_item_count ?? null,
    public_menu_item_count: row.public_menu_item_count ?? null,
    browse_ck_item_count: row.browse_ck_item_count ?? null,
    preview_items: Array.isArray(row.preview_items) ? row.preview_items : [],
    address_line1: row.address_line1 || null,
    menu_availability_state: row.menu_availability_state || null,
    menu_availability_source: row.menu_availability_source || null,
  };
}

/**
 * @param {object[]} rows
 * @returns {object[]}
 */
export function filterClusterRestaurantsForMenuBrowser(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const out = [];
  const seen = new Set();
  for (const row of list) {
    if (!isClusterRestaurantMenuReady(row)) continue;
    const entry = mapClusterRestaurantToBrowseEntry(row);
    if (!entry) continue;
    const key = String(entry.restaurant_id);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}
