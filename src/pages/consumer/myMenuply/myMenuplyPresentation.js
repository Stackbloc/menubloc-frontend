/**
 * Build presentation cards from user diary + restaurant follow/like data.
 * Restaurant-backed cards are labeled curated — never fake user posts.
 */

import { restaurantPathFromRow } from "../../../lib/canonicalUrl.js";

const DEFAULT_MEDIA_BASE = "https://menubloc-backend-production.up.railway.app";

function mediaUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${DEFAULT_MEDIA_BASE}${value.startsWith("/") ? value : `/${value}`}`;
}

function eatingCard(row) {
  const label = row.food_name || row.item_name || "Food";
  const image = mediaUrl(row.photo_url || row.item_photo_url || row.video_url);
  if (!image && !row.video_url) return null;
  return {
    key: `diary-${row.entry_id || row.id}`,
    kind: "diary",
    label,
    sublabel: row.restaurant_name || row.place_label || "",
    badge: "Your meal",
    image,
    href: row.menu_item_id ? `/menu-items/${encodeURIComponent(String(row.menu_item_id))}` : null,
    source: "user",
  };
}

function likedCard(row) {
  return {
    key: `like-${row.menu_item_id}`,
    kind: "like",
    label: row.item_name || "Dish",
    sublabel: row.restaurant_name || "",
    badge: "Saved dish",
    image: null,
    href: row.menu_item_id ? `/menu-items/${encodeURIComponent(String(row.menu_item_id))}` : null,
    source: "restaurant",
  };
}

function followHighlight(restaurant, preview, index) {
  const image = mediaUrl(preview?.image_url || restaurant.logo_url);
  return {
    key: `follow-${restaurant.restaurant_id}-${index}`,
    kind: "follow",
    label: preview?.headline_override || preview?.title || restaurant.restaurant_name,
    sublabel: [restaurant.city, restaurant.state].filter(Boolean).join(", ") || restaurant.restaurant_name,
    badge: "From places you follow",
    image,
    href: restaurantPathFromRow(restaurant),
    source: "restaurant",
  };
}

/** Top highlight grid: user meals first, then restaurant-backed filler. */
export function buildTopHighlights({ eating = [], liked = [], followed = [] }) {
  const fromDiary = (eating || [])
    .map(eatingCard)
    .filter(Boolean)
    .slice(0, 3);

  if (fromDiary.length >= 3) return fromDiary.slice(0, 3);

  const cards = [...fromDiary];
  const likedRows = (liked || []).slice(0, 3 - cards.length);
  for (const row of likedRows) {
    cards.push(likedCard(row));
    if (cards.length >= 3) break;
  }

  for (const restaurant of followed || []) {
    if (cards.length >= 3) break;
    const previews = restaurant.billboard_preview || [];
    if (previews.length) {
      previews.slice(0, 1).forEach((preview, idx) => {
        if (cards.length < 3) cards.push(followHighlight(restaurant, preview, idx));
      });
      continue;
    }
    if (restaurant.logo_url) {
      cards.push(followHighlight(restaurant, null, 0));
    }
  }

  return cards.slice(0, 3);
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
    key: `want-suggest-${row.menu_item_id}`,
    food_name: row.item_name,
    restaurant_name: row.restaurant_name,
    menu_item_id: row.menu_item_id,
    photo_url: null,
  }));
}

export function buildDinerStats({
  connections = [],
  followed = [],
  liked = [],
  eating = [],
  events = [],
  eventGroups = [],
  socialEvents = [],
}) {
  const eventCount =
    (events?.length || 0) + (eventGroups?.length || 0) + (socialEvents?.length || 0);
  const dishCount = Math.max((liked?.length || 0), (eating?.length || 0));
  return [
    { id: "connects", label: "Connects", value: connections.length },
    { id: "restaurants", label: "Restaurants", value: followed.length },
    { id: "dishes", label: "Dishes", value: dishCount },
    { id: "events", label: "Events", value: eventCount },
  ];
}
