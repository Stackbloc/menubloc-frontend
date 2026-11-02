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
