// Single source of truth for building canonical restaurant and menu URLs.
// All components must use these functions — no manual string concatenation.
//
// Canonical format: /restaurants/{state-slug}/{city-slug}/{restaurant-slug}
// Menu format:      /restaurants/{state-slug}/{city-slug}/{restaurant-slug}/menu
//
// Fallback (when city or state is absent): /restaurants/{slug} or /public/restaurants/{id}/menu
// This preserves working links on rows that predate the canonical URL migration.

export {
  absoluteCanonicalUrl,
  CANONICAL_ORIGIN,
  cityPath,
  restaurantMenuPath,
  restaurantPath,
} from "./canonicalUrlCore.js";
import { restaurantMenuPath, restaurantPath } from "./canonicalUrlCore.js";

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

/**
 * Operator console → public profile path (Claim / Public Profile page).
 * Prefer canonical /restaurants/{state}/{city}/{slug}; fall back to /restaurants/{slug|id}.
 * Never use legacy /restaurant-profile/:id (restaurant setup form).
 */
export function operatorPublicProfilePath(row) {
  if (!row) return null;
  const slug =
    row.slug ||
    row.restaurant_slug ||
    row.restaurantSlug ||
    null;
  const city = row.city || row.restaurant_city || null;
  const state = row.state || row.restaurant_state || null;
  const id = row.id || row.restaurant_id || row.restaurantId || null;
  const canonical = restaurantPath({ slug, city, state });
  if (canonical) return canonical;
  const key = slug || id;
  return key ? `/restaurants/${encodeURIComponent(String(key))}` : null;
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
