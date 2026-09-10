/**
 * Build presentation cards from diner-owned My Highlights + follow rails.
 * My Highlights = only media the diner pinned (person-first). No restaurant filler.
 */

import { restaurantPathFromRow } from "../../../lib/canonicalUrl.js";

const DEFAULT_MEDIA_BASE = "https://menubloc-backend-production.up.railway.app";
export const MY_HIGHLIGHTS_MAX = 3;

function mediaUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${DEFAULT_MEDIA_BASE}${value.startsWith("/") ? value : `/${value}`}`;
}

/**
 * My Highlights — diner-owned pinned profile photos only (max 3).
 * Stills-only: photos from profileHighlightPhotos; no diary / liked / followed filler.
 */
export function buildTopHighlights({ profileHighlightPhotos = [] } = {}) {
  return (profileHighlightPhotos || [])
    .filter((row) => row?.media_kind === "photo" || !row?.media_kind)
    .map((row) => {
      const image = mediaUrl(row.media_url || row.photo_url || row.image);
      if (!image) return null;
      return {
        key: `profile-media-${row.id}`,
        kind: "profile_media",
        deleteKind: "profile_media",
        media_id: row.id,
        label: String(row.label || "").trim() || "My Highlight",
        sublabel: String(row.sublabel || "").trim() || "Experience you shared",
        badge: "Highlight",
        image,
        href: null,
        source: "user",
      };
    })
    .filter(Boolean)
    .slice(0, MY_HIGHLIGHTS_MAX);
}

/** Horizontal restaurant visit cards from follows. */
export function buildFollowedRestaurantRails(followed = []) {
  return (followed || []).slice(0, 12).map((restaurant) => {
    const preview = (restaurant.billboard_preview || [])[0];
    const image = mediaUrl(preview?.image_url || restaurant.logo_url);
    return {
      key: `visit-${restaurant.restaurant_id}`,
      restaurant_id: restaurant.restaurant_id,
      name: restaurant.restaurant_name,
      place: [restaurant.city, restaurant.state].filter(Boolean).join(", "),
      image,
      href: restaurantPathFromRow(restaurant),
    };
  });
}

/** Wish-list filler from liked dishes when want list is empty. */
export function buildWantSuggestions(liked = [], limit = 8) {
  return (liked || []).slice(0, limit).map((row) => ({
    id: `suggest-${row.menu_item_id}`,
    food_name: row.item_name || "Dish",
    restaurant_name: row.restaurant_name || "",
    menu_item_id: row.menu_item_id,
    photo_url: row.photo_url || row.item_photo_url || null,
  }));
}

export function buildDinerStats({
  connections = [],
  followed = [],
  liked = [],
  eating = [],
  homeDishes = [],
  events = [],
  eventGroups = [],
  socialEvents = [],
} = {}) {
  const eventCount =
    (events?.length || 0) + (eventGroups?.length || 0) + (socialEvents?.length || 0);
  return [
    { id: "connects", label: "Connects", value: connections.length },
    { id: "restaurants", label: "Restaurants", value: followed.length },
    { id: "dishes", label: "Dishes", value: liked.length + eating.length + homeDishes.length },
    { id: "events", label: "Events", value: eventCount },
  ];
}
