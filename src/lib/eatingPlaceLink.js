/** Optional restaurant / menu-item / @home tagging for eating logs. */

export const HOMEMADE_PREFIX = "@home";
/** Legacy stored place_label / comment prefixes — still recognized on read. */
export const HOMEMADE_PREFIX_LEGACY = "Homemade";

function matchHomemadePrefix(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  for (const prefix of [HOMEMADE_PREFIX, HOMEMADE_PREFIX_LEGACY]) {
    if (text === prefix || text === `${prefix}:` || text === `${prefix}.`) {
      return { prefix, recipe: "" };
    }
    if (text.startsWith(`${prefix}: `)) {
      return { prefix, recipe: text.slice(prefix.length + 2).trim() };
    }
    if (text.startsWith(`${prefix}. `)) {
      return { prefix, recipe: text.slice(prefix.length + 2).trim() };
    }
    if (text.startsWith(`${prefix} `)) {
      return { prefix, recipe: text.slice(prefix.length).trim() };
    }
  }
  return null;
}

export function splitHomemadeComment(comment) {
  const matched = matchHomemadePrefix(comment);
  if (!matched) {
    const raw = String(comment || "").trim();
    return { homemade: false, recipe: raw };
  }
  return { homemade: true, recipe: matched.recipe };
}

export function joinHomemadeComment(homemade, recipe) {
  const note = String(recipe || "").trim();
  if (homemade && note) return `${HOMEMADE_PREFIX}: ${note}`;
  if (homemade) return HOMEMADE_PREFIX;
  return note;
}

/** Display place_label with current @home: prefix (rewrites legacy Homemade. / @home.). */
export function formatHomemadePlaceLabel(comment) {
  const split = splitHomemadeComment(comment);
  if (!split.homemade) return String(comment || "").trim();
  return joinHomemadeComment(true, split.recipe);
}

export function dishPhotoUrl(dish) {
  const url = String(dish?.item_photo_url || dish?.photo_url || "").trim();
  return url || null;
}

export function eatingFoodName({ text, dish, restaurant, homemade }) {
  const named = String(text || "").trim();
  if (named) return named;
  const dishName = String(dish?.item_name || "").trim();
  if (dishName) return dishName;
  if (homemade) return HOMEMADE_PREFIX;
  const place = String(restaurant?.restaurant_name || "").trim();
  return place || "Food";
}
