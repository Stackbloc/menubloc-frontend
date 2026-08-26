/**
 * Live Feed category captions + channel dials (See Who's Eating CRT).
 * Caption labels match dial short names (not legacy hub section titles).
 */

/** Radio stations on the green CRT (vertical dial strip). Labels are title case — not ALL CAPS. */
export const LIVE_FEED_CHANNELS = [
  { id: "all", label: "All Content" },
  { id: "ate", label: "I'm Eating" },
  { id: "want", label: "Wanna Eat" },
  { id: "plan", label: "Eating Plans" },
  { id: "event", label: "Events" },
];

const CHANNEL_LABEL_BY_KIND = Object.fromEntries(
  LIVE_FEED_CHANNELS.filter((ch) => ch.id !== "all").map((ch) => [ch.id, ch.label])
);

/** Full captions in fullscreen reel (hub section titles). */
export const LIVE_FEED_FULL_CATEGORY_LABELS = {
  ate: "What I'm Eating",
  want: "What I Wanna Eat",
  plan: "My Eating Plans",
  event: "Events",
};

export function liveFeedCategoryLabel(kind) {
  const key = String(kind || "")
    .trim()
    .toLowerCase();
  return CHANNEL_LABEL_BY_KIND[key] || CHANNEL_LABEL_BY_KIND.ate;
}

export function liveFeedFullCategoryLabel(kind) {
  const key = String(kind || "")
    .trim()
    .toLowerCase();
  return LIVE_FEED_FULL_CATEGORY_LABELS[key] || LIVE_FEED_FULL_CATEGORY_LABELS.ate;
}

export function dinerPeerProfilePath(dinerId) {
  const id = Number(dinerId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return `/account/connections/${encodeURIComponent(String(id))}`;
}

export function venueLiveFeedPath(venue) {
  const href = String(venue?.href || "").trim();
  if (href) return href;
  const slug = String(venue?.slug || "").trim();
  if (!slug) return null;
  return `/destination-venues/${encodeURIComponent(slug)}`;
}

export function liveFeedPosterLabel(item) {
  if (String(item?.kind || "").toLowerCase() === "event" || item?.poster_type === "venue") {
    return item?.venue?.name || "Venue";
  }
  return item?.diner?.display_name || "diner";
}

export function isLiveFeedVenueItem(item) {
  return (
    String(item?.kind || "").toLowerCase() === "event" || item?.poster_type === "venue"
  );
}

/** Compact CRT: shorten long restaurant names in Restaurant/Dish labels. */
export function abbreviateLiveFeedRestaurantName(name, max = 16) {
  const s = String(name || "").trim();
  if (!s || s.length <= max) return s;
  const first = s.split(/\s+/)[0] || "";
  if (first.length >= 4 && first.length <= max) return first;
  return `${s.slice(0, Math.max(4, max - 1)).trimEnd()}…`;
}

function liveFeedDishHref(item) {
  const menuItemId = item.menu_item_id != null ? Number(item.menu_item_id) : null;
  return (
    item.menu_item_href ||
    (Number.isFinite(menuItemId) && menuItemId > 0 ? `/menu-items/${menuItemId}` : null)
  );
}

function liveFeedDishName(item) {
  return String(item.item_name || item.food_name || "").trim();
}

function liveFeedRestaurantName(item) {
  return String(item.restaurant_name || "").trim();
}

/** Dish → restaurant → venue. Dish label: Restaurant/Dish (tap → menu item). */
export function resolveLiveFeedContentLink(item, { abbreviateRestaurant = false } = {}) {
  if (!item) return null;

  const dishHref = liveFeedDishHref(item);
  const dishName = liveFeedDishName(item);
  if (dishHref && dishName) {
    const restaurantName = liveFeedRestaurantName(item);
    let label = dishName;
    if (restaurantName) {
      const place = abbreviateRestaurant
        ? abbreviateLiveFeedRestaurantName(restaurantName)
        : restaurantName;
      label = `${place}/${dishName}`;
    }
    return { href: dishHref, label, kind: "dish" };
  }

  const restaurantSlug = String(item.restaurant_slug || "").trim();
  if (restaurantSlug) {
    const name = liveFeedRestaurantName(item) || "Restaurant";
    return {
      href: `/r/${encodeURIComponent(restaurantSlug)}`,
      label: name,
      kind: "restaurant",
    };
  }

  if (isLiveFeedVenueItem(item)) {
    const href = venueLiveFeedPath(item.venue);
    const label = String(item.venue?.name || liveFeedPosterLabel(item) || "").trim();
    if (href && label) {
      return { href, label, kind: "venue" };
    }
  }

  return null;
}
