/**
 * "Use what I typed" in the Post picker: a restaurant or dish that is not on Menuply yet.
 * No Menuply id; the post sends the typed restaurant as place_name.
 */

function cleanTypedName(value, max) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

export function unlistedRestaurantPlace(name) {
  const restaurant_name = cleanTypedName(name, 120);
  return restaurant_name ? { restaurant_id: null, restaurant_name, unlisted: true } : null;
}

export function unlistedDishPlace(name) {
  const item_name = cleanTypedName(name, 160);
  return item_name ? { menu_item_id: null, item_name, food_name: item_name, unlisted: true } : null;
}

/** The typed restaurant name to send as place_name, or null for a Menuply restaurant. */
export function unlistedPlaceName(restaurant) {
  const id = Number(restaurant?.restaurant_id);
  if (!restaurant || (Number.isFinite(id) && id > 0)) return null;
  return cleanTypedName(restaurant.restaurant_name || restaurant.name, 120) || null;
}

/**
 * place_name for a post (Andre 2026-11-12): the diner's typed words (typed_name) are kept even when a
 * Menuply restaurant is linked; otherwise the unlisted name. The server shows the link first.
 */
export function postedPlaceName(restaurant) {
  return cleanTypedName(restaurant?.typed_name, 120) || unlistedPlaceName(restaurant);
}

/**
 * Where an Invite to Eat place not on Menuply is (Andre 2026-11-07): city + state, optional street.
 * Limits match backend mig 0400. Blank → null.
 */
export const PLACE_CITY_MAX = 80;
export const PLACE_STATE_MAX = 40;
export const PLACE_ADDRESS_MAX = 200;

export function cleanPlaceLocation(value) {
  const clean = (v, max) => String(v || "").trim().replace(/\s+/g, " ").slice(0, max) || null;
  return {
    city: clean(value?.city, PLACE_CITY_MAX),
    state: clean(value?.state, PLACE_STATE_MAX),
    address: clean(value?.address, PLACE_ADDRESS_MAX),
  };
}
