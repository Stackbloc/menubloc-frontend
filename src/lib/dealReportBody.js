/**
 * Plan 78 (2026-11-28): the POST /api/consumer/deal-reports body from the web Post sheet. Pure (no
 * imports) so node:test can check it. Listed restaurant/dish = ids; not on Menuply = typed names.
 */
export function dealReportBody({ clipId, place, food, description }) {
  const restaurantId = place?.restaurant_id ? Number(place.restaurant_id) : null;
  const dishId = food?.kind === "dish" ? Number(food.dish?.menu_item_id) || null : null;
  const typedPlace = String(place?.typed_name || place?.restaurant_name || place?.name || "").trim();
  const dishName = String(food?.label || "").trim();
  const body = { clip_id: Number(clipId) };
  if (restaurantId) body.restaurant_id = restaurantId;
  else if (typedPlace) body.place_name = typedPlace.slice(0, 120);
  if (restaurantId && dishId) body.menu_item_id = dishId;
  else if (dishName) body.dish_name = dishName.slice(0, 160);
  const note = String(description || "").trim();
  if (note) body.description = note.slice(0, 500);
  return body;
}
