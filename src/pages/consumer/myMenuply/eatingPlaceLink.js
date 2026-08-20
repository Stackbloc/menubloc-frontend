/** Optional restaurant / menu-item / homemade tagging for eating logs. */

export const HOMEMADE_PREFIX = "Homemade";

export function splitHomemadeComment(comment) {
  const raw = String(comment || "").trim();
  if (!raw) return { homemade: false, recipe: "" };
  if (raw === HOMEMADE_PREFIX) return { homemade: true, recipe: "" };
  if (raw.startsWith(`${HOMEMADE_PREFIX}. `)) {
    return { homemade: true, recipe: raw.slice(HOMEMADE_PREFIX.length + 2).trim() };
  }
  if (raw.startsWith(`${HOMEMADE_PREFIX} `)) {
    return { homemade: true, recipe: raw.slice(HOMEMADE_PREFIX.length).trim() };
  }
  return { homemade: false, recipe: raw };
}

export function joinHomemadeComment(homemade, recipe) {
  const note = String(recipe || "").trim();
  if (homemade && note) return `${HOMEMADE_PREFIX}. ${note}`;
  if (homemade) return HOMEMADE_PREFIX;
  return note;
}

export function eatingFoodName({ text, dish, restaurant, homemade }) {
  const named = String(text || "").trim();
  if (named) return named;
  const dishName = String(dish?.item_name || "").trim();
  if (dishName) return dishName;
  if (homemade) return "Homemade";
  const place = String(restaurant?.restaurant_name || "").trim();
  return place || "Food";
}
