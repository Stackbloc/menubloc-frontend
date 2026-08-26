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

export function liveFeedCategoryLabel(kind) {
  const key = String(kind || "")
    .trim()
    .toLowerCase();
  return CHANNEL_LABEL_BY_KIND[key] || CHANNEL_LABEL_BY_KIND.ate;
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

/** Dish → restaurant → venue; null when nothing linkable. */
export function resolveLiveFeedContentLink(item) {
  if (!item) return null;

  const menuItemId = item.menu_item_id != null ? Number(item.menu_item_id) : null;
  const dishHref =
    item.menu_item_href ||
    (Number.isFinite(menuItemId) && menuItemId > 0 ? `/menu-items/${menuItemId}` : null);
  const dishName = String(item.item_name || item.food_name || "").trim();
  if (dishHref && dishName) {
    return { href: dishHref, label: dishName, kind: "dish" };
  }

  const restaurantSlug = String(item.restaurant_slug || "").trim();
  if (restaurantSlug) {
    const name = String(item.restaurant_name || "").trim() || "Restaurant";
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
