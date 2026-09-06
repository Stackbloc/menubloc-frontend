import { restaurantPath } from "./canonicalUrlCore.js";

/** Radio stations on the green CRT (vertical dial strip). Labels are title case — not ALL CAPS. */
export const LIVE_FEED_CHANNELS = [
  { id: "all", label: "All Content" },
  { id: "ate", label: "I'm Eating" },
  { id: "want", label: "Wanna Eat" },
  { id: "plan", label: "Eating Plans" },
  { id: "reviews", label: "Reviews" },
  { id: "cooking", label: "I'm Cooking" },
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
  cooking: "What I'm Cooking",
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

/** Consumer restaurant profile — canonical /restaurants/…, not /r/ QR links. */
export function liveFeedRestaurantProfilePath(item = {}) {
  const slug = String(
    item?.referenced_restaurant?.slug || item?.restaurant_slug || item?.creator?.slug || ""
  ).trim();
  const city = item?.restaurant_city || item?.referenced_restaurant?.city || item?.creator?.city || null;
  const state = item?.restaurant_state || item?.referenced_restaurant?.state || item?.creator?.state || null;
  const id =
    item?.restaurant_id ??
    item?.referenced_restaurant?.id ??
    item?.creator?.id ??
    null;
  return (
    restaurantPath({ slug, city, state }) ||
    (id != null ? `/restaurants/${encodeURIComponent(String(id))}` : null)
  );
}

export function liveFeedCreatorProfilePath(item) {
  if (!item) return null;
  if (isLiveFeedPlatformCreator(item)) return null;
  if (isLiveFeedVenueItem(item)) return venueLiveFeedPath(item.venue);
  if (item?.creator_type === "restaurant" || item?.poster_type === "restaurant") {
    return liveFeedRestaurantProfilePath(item);
  }
  return dinerPeerProfilePath(item?.diner?.id);
}

export function isLiveFeedRestaurantCreator(item) {
  return item?.creator_type === "restaurant" || item?.poster_type === "restaurant";
}

export function isLiveFeedPlatformCreator(item) {
  const kind = String(item?.kind || "")
    .trim()
    .toLowerCase();
  return kind === "managed" || item?.creator_type === "platform" || item?.poster_type === "platform";
}

export function isLiveFeedGuestCreator(item) {
  if (isLiveFeedPlatformCreator(item)) return false;
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
  if (isLiveFeedPlatformCreator(item)) {
    return item?.diner?.display_name || "Platform video";
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
  if (isLiveFeedVenueItem(item) || isLiveFeedGuestCreator(item) || isLiveFeedPlatformCreator(item)) {
    return label;
  }
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
  if (restaurantSlug || item.restaurant_id) {
    const name = liveFeedRestaurantName(item) || "Restaurant";
    const href = liveFeedRestaurantProfilePath(item);
    if (href) {
      return {
        href,
        label: name,
        kind: "restaurant",
      };
    }
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
  const restaurantHref = liveFeedRestaurantProfilePath(item);
  const restaurant =
    restaurantName && restaurantHref
      ? {
          href: restaurantHref,
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
  const posterLabel = liveFeedPosterLabel(item);
  const restaurantLabel =
    links.restaurant?.label ||
    String(item.referenced_restaurant?.name || item.restaurant_name || "").trim() ||
    null;
  const menuItemLabel =
    links.dish?.label ||
    String(item.item_name || "").trim() ||
    null;
  const foodName = String(item.food_name || "").trim();
  // Avoid "Platform video" / "Guest Diner" repeating under the poster name when
  // food_name was left as the same creator label (common for managed uploads).
  const foodNameIsPosterEcho =
    Boolean(foodName) &&
    Boolean(posterLabel) &&
    foodName.toLowerCase() === String(posterLabel).toLowerCase();
  const resolvedMenuItem =
    menuItemLabel ||
    (foodName && foodName !== restaurantLabel && !foodNameIsPosterEcho ? foodName : null);

  let resolvedRestaurant = restaurantLabel;
  let resolvedRestaurantHref = liveFeedRestaurantProfilePath(item);

  if (!resolvedRestaurant && links.venue?.label) {
    resolvedRestaurant = links.venue.label;
    resolvedRestaurantHref = links.venue.href || null;
  }

  return {
    restaurant: resolvedRestaurant
      ? {
          label: resolvedRestaurant,
          href: resolvedRestaurantHref,
        }
      : null,
    menuItem: resolvedMenuItem
      ? {
          label: resolvedMenuItem,
          href: links.dish?.href || item.menu_item_href || null,
        }
      : null,
  };
}
