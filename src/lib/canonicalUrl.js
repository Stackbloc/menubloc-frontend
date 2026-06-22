// Single source of truth for building canonical restaurant and menu URLs.
// All components must use these functions — no manual string concatenation.
//
// Canonical format: /restaurants/{state-slug}/{city-slug}/{restaurant-slug}
// Menu format:      /restaurants/{state-slug}/{city-slug}/{restaurant-slug}/menu
//
// Fallback (when city or state is absent): /restaurants/{slug} or /public/restaurants/{id}/menu
// This preserves working links on rows that predate the canonical URL migration.

import { toStateSlug, toCitySlug } from "./slugs.js";

// Normalizes a 2-letter or full-name state to a slug.
// "CA" → "california", "California" → "california"
function normalizeState(rawState) {
  if (!rawState) return "";
  const s = String(rawState).trim();
  // If it's a 2-letter code delegate to toStateSlug.
  if (s.length === 2) return toStateSlug(s.toUpperCase());
  // Otherwise assume it's already a full state name — slug it directly.
  return toCitySlug(s);
}

// Returns the 3-segment canonical path for a restaurant profile, or
// the legacy 1-segment fallback when location data is incomplete.
// Input shape: { slug, city, state }
export function restaurantPath({ slug, city, state } = {}) {
  const stateSlug = normalizeState(state);
  const citySlug = toCitySlug(city);
  const restaurantSlug = slug ? String(slug) : "";

  if (stateSlug && citySlug && restaurantSlug) {
    return `/restaurants/${stateSlug}/${citySlug}/${restaurantSlug}`;
  }
  // Fallback: legacy 1-segment slug path
  if (restaurantSlug) return `/restaurants/${encodeURIComponent(restaurantSlug)}`;
  return null;
}

// Returns the canonical menu path for a restaurant.
// Input shape: { slug, city, state } — same as restaurantPath.
// Falls back to /public/restaurants/{id}/menu when city/state absent and id provided.
export function restaurantMenuPath({ slug, city, state, id } = {}) {
  const base = restaurantPath({ slug, city, state });
  if (base) return `${base}/menu`;
  if (id) return `/public/restaurants/${encodeURIComponent(String(id))}/menu`;
  return null;
}

// Convenience: given a restaurant object with any of the common field-name shapes,
// extract the relevant fields and return the canonical profile path.
export function restaurantPathFromRow(row) {
  if (!row) return null;
  const slug =
    row.slug ||
    row.restaurant_slug ||
    row.restaurantSlug ||
    null;
  const city =
    row.city ||
    row.restaurant_city ||
    null;
  const state =
    row.state ||
    row.restaurant_state ||
    null;
  const id =
    row.id ||
    row.restaurant_id ||
    row.restaurantId ||
    null;
  return restaurantPath({ slug, city, state }) || (id ? `/public/restaurants/${encodeURIComponent(String(id))}` : null);
}

// Returns the canonical path for a menu item within its restaurant context.
// Falls back to /menu-items/{itemId} when restaurant location data is absent.
export function menuItemPath({ restaurantSlug, city, state, itemId } = {}) {
  const base = restaurantPath({ slug: restaurantSlug, city, state });
  if (base && itemId) return `${base}/menu-items/${encodeURIComponent(String(itemId))}`;
  if (itemId) return `/menu-items/${encodeURIComponent(String(itemId))}`;
  return null;
}

// Convenience: given a restaurant object, return the canonical menu path.
export function restaurantMenuPathFromRow(row) {
  if (!row) return null;
  const slug =
    row.slug ||
    row.restaurant_slug ||
    row.restaurantSlug ||
    null;
  const city =
    row.city ||
    row.restaurant_city ||
    null;
  const state =
    row.state ||
    row.restaurant_state ||
    null;
  const id =
    row.id ||
    row.restaurant_id ||
    row.restaurantId ||
    null;
  return restaurantMenuPath({ slug, city, state, id });
}
