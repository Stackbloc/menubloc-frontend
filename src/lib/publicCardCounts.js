function toFiniteCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) return null;
  return Math.trunc(count);
}

// GUARDRAIL:
// Discovery/browse/search card surfaces are protected UI architecture.
// Shared public card behavior — including counts, filters, badges, allergen
// display, chip rails, grouping, ranking, and visibility rules — must be
// centralized.
// Do not introduce page-specific overrides or duplicate display logic.
// Do not redesign search/browse/discovery hierarchy without explicit user approval.

export function isRestaurantMenuReady(restaurant) {
  if (restaurant?.menu_ready === true) return true;
  if (restaurant?.menu_ready === false) return false;
  return null;
}

export function getMenuAvailabilityLabel(restaurant, t = (key, fallback) => fallback) {
  if (isRestaurantMenuReady(restaurant) !== false) return null;
  return t(
    "discovery.menuPendingClaim",
    "Menu pending — claim this profile to add or verify the menu."
  );
}

export function shouldLinkRestaurantCardToMenu(restaurant) {
  const menuReady = isRestaurantMenuReady(restaurant);
  if (menuReady === false) return false;
  return true;
}

export function getDisplayItemCount({ restaurant, hasActiveFilters = false }) {
  const menuReady = isRestaurantMenuReady(restaurant);
  if (menuReady === false) return null;

  const publicMenuItemCount = toFiniteCount(restaurant?.public_menu_item_count);
  const menuItemCount = toFiniteCount(restaurant?.menu_item_count);
  const matchingItemCount = toFiniteCount(
    restaurant?.matching_item_count ?? restaurant?.filtered_item_count
  );
  const totalItemCount = toFiniteCount(restaurant?.total_item_count);

  if (menuReady === true && !hasActiveFilters && publicMenuItemCount != null) {
    return publicMenuItemCount;
  }

  // GUARDRAIL:
  // Public restaurant/menu cards must display counts from the current filtered
  // result set. Never show unfiltered total counts when diet/allergen/search
  // filters are active.
  if (hasActiveFilters) {
    if (matchingItemCount != null) return matchingItemCount;
    if (menuItemCount != null && totalItemCount != null && menuItemCount !== totalItemCount) {
      return menuItemCount;
    }
    if (menuItemCount != null && totalItemCount == null) return menuItemCount;
    return null;
  }

  return menuItemCount ?? matchingItemCount ?? totalItemCount ?? publicMenuItemCount;
}
