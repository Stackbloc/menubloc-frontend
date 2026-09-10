/**
 * Build presentation cards from diner-owned My Highlights + follow rails.
 * My Highlights = diner-pinned photos and videos (person-first). No restaurant filler.
 */

import { restaurantPathFromRow } from "../../../lib/canonicalUrl.js";

const DEFAULT_MEDIA_BASE = "https://menubloc-backend-production.up.railway.app";

/** Profile preview grid size (Instagram-style 3×3). More → See all page. */
export const MY_HIGHLIGHTS_PREVIEW_COUNT = 9;

function mediaUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${DEFAULT_MEDIA_BASE}${value.startsWith("/") ? value : `/${value}`}`;
}

/**
 * My Highlights — diner-owned pinned profile media (photo + video). No pin cap.
 */
export function buildTopHighlights({ profileHighlightMedia = [], profileHighlightPhotos = [] } = {}) {
  const rows = (profileHighlightMedia?.length ? profileHighlightMedia : profileHighlightPhotos) || [];
  return rows
    .map((row) => {
      const url = mediaUrl(row.media_url || row.photo_url || row.image);
      if (!url) return null;
      const isVideo = String(row.media_kind || "").toLowerCase() === "video";
      return {
        key: `profile-media-${row.id}`,
        kind: "profile_media",
        deleteKind: "profile_media",
        media_id: row.id,
        media_kind: isVideo ? "video" : "photo",
        label: String(row.label || "").trim() || "My Highlight",
        sublabel: String(row.sublabel || "").trim() || (isVideo ? "Video you shared" : "Experience you shared"),
        badge: isVideo ? "Video" : "Photo",
        image: isVideo ? null : url,
        videoUrl: isVideo ? url : undefined,
        href: null,
        source: "user",
      };
    })
    .filter(Boolean);
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
