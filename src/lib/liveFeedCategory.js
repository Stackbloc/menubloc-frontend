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
  { id: "reviews", label: "Reviews" },
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
  reviews: "Reviews",
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

export function liveFeedCreatorProfilePath(item) {
  if (!item) return null;
  if (isLiveFeedVenueItem(item)) return venueLiveFeedPath(item.venue);
  if (item?.creator_type === "restaurant" || item?.poster_type === "restaurant") {
    const href = String(item?.creator?.href || "").trim();
    if (href) return href;
    const slug = String(item?.creator?.slug || "").trim();
    if (slug) return `/r/${encodeURIComponent(slug)}`;
    return null;
  }
  return dinerPeerProfilePath(item?.diner?.id);
}

export function isLiveFeedRestaurantCreator(item) {
  return item?.creator_type === "restaurant" || item?.poster_type === "restaurant";
}

export function isLiveFeedGuestCreator(item) {
  return (
    item?.creator_type === "guest" ||
    (!isLiveFeedVenueItem(item) &&
      !isLiveFeedRestaurantCreator(item) &&
      item?.diner?.id == null &&
      String(item?.diner?.display_name || "").trim() === "Guest Diner")
  );
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
  if (isLiveFeedRestaurantCreator(item)) {
    return item?.creator?.name || item?.restaurant_name || "Restaurant";
  }
  if (isLiveFeedGuestCreator(item)) {
    return "Guest Diner";
  }
  return item?.diner?.display_name || "diner";
}

export function liveFeedPosterDisplayName(item) {
  const label = liveFeedPosterLabel(item);
  if (isLiveFeedVenueItem(item) || isLiveFeedGuestCreator(item)) return label;
  return `@${label}`;
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

/**
 * Dual caption bridge: dish → menu-item page, restaurant → restaurant page (existing routes only).
 * Prefer this for Feed / fullscreen caption chips.
 */
export function resolveLiveFeedCaptionLinks(item, { abbreviateRestaurant = false } = {}) {
  if (!item) return { dish: null, restaurant: null, venue: null };

  const dishHref = liveFeedDishHref(item);
  const dishName = liveFeedDishName(item);
  const dish =
    dishHref && dishName
      ? { href: dishHref, label: dishName, kind: "dish" }
      : null;

  const restaurantSlug = String(
    item.referenced_restaurant?.slug || item.restaurant_slug || ""
  ).trim();
  const restaurantName = String(
    item.referenced_restaurant?.name || item.restaurant_name || ""
  ).trim();
  const restaurant =
    restaurantSlug && restaurantName
      ? {
          href: item.referenced_restaurant?.href || `/r/${encodeURIComponent(restaurantSlug)}`,
          label: abbreviateRestaurant
            ? abbreviateLiveFeedRestaurantName(restaurantName)
            : restaurantName,
          kind: "restaurant",
        }
      : null;

  let venue = null;
  if (isLiveFeedVenueItem(item)) {
    const href = venueLiveFeedPath(item.venue);
    const label = String(item.venue?.name || liveFeedPosterLabel(item) || "").trim();
    if (href && label) venue = { href, label, kind: "venue" };
  }

  return { dish, restaurant, venue };
}

/** Restaurant + menu item labels for Feed video caption (links when routes exist). */
export function resolveFeedPlaceCaption(item) {
  if (!item) return { restaurant: null, menuItem: null };

  const links = resolveLiveFeedCaptionLinks(item);
  const restaurantLabel =
    links.restaurant?.label ||
    String(item.referenced_restaurant?.name || item.restaurant_name || "").trim() ||
    null;
  const menuItemLabel =
    links.dish?.label ||
    String(item.item_name || "").trim() ||
    null;

  return {
    restaurant: restaurantLabel
      ? {
          label: restaurantLabel,
          href:
            links.restaurant?.href ||
            item.referenced_restaurant?.href ||
            (item.restaurant_slug
              ? `/r/${encodeURIComponent(String(item.restaurant_slug).trim())}`
              : null),
        }
      : null,
    menuItem: menuItemLabel
      ? {
          label: menuItemLabel,
          href: links.dish?.href || item.menu_item_href || null,
        }
      : null,
  };
}
