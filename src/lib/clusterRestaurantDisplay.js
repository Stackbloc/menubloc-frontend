import { isRestaurantMenuReady } from "./publicCardCounts.js";

const DEFAULT_MEDIA_BASE = "https://menubloc-backend-production.up.railway.app";
/** Compact cluster-card billboard strip — smaller than My Favs 100px visit cards. */
export const CLUSTER_RESTAURANT_BILLBOARD_HEIGHT_PX = 72;

function mediaUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${DEFAULT_MEDIA_BASE}${value.startsWith("/") ? value : `/${value}`}`;
}

/**
 * Same source as My Favs: active billboard image, then restaurant logo.
 * @param {object} restaurant
 * @returns {string|null}
 */
export function resolveClusterRestaurantBillboardUrl(restaurant = {}) {
  const preview = Array.isArray(restaurant.billboard_preview)
    ? restaurant.billboard_preview[0]
    : null;
  return mediaUrl(
    preview?.image_url || restaurant.billboard_image_url || restaurant.logo_url || null
  );
}

const CUISINE_ACCENTS = {
  american: { border: "#f59e0b", bg: "#fffbeb", emoji: "🍔" },
  burger: { border: "#f59e0b", bg: "#fffbeb", emoji: "🍔" },
  bbq: { border: "#b45309", bg: "#fff7ed", emoji: "🔥" },
  soul: { border: "#b45309", bg: "#fff7ed", emoji: "🍗" },
  southern: { border: "#b45309", bg: "#fff7ed", emoji: "🍗" },
  chicken: { border: "#d97706", bg: "#fff7ed", emoji: "🍗" },
  steak: { border: "#991b1b", bg: "#fef2f2", emoji: "🥩" },
  steakhouse: { border: "#991b1b", bg: "#fef2f2", emoji: "🥩" },
  italian: { border: "#ef4444", bg: "#fef2f2", emoji: "🍕" },
  pizza: { border: "#ef4444", bg: "#fef2f2", emoji: "🍕" },
  mexican: { border: "#f97316", bg: "#fff7ed", emoji: "🌮" },
  asian: { border: "#6366f1", bg: "#eef2ff", emoji: "🥡" },
  chinese: { border: "#6366f1", bg: "#eef2ff", emoji: "🥡" },
  japanese: { border: "#6366f1", bg: "#eef2ff", emoji: "🍱" },
  sushi: { border: "#0891b2", bg: "#ecfeff", emoji: "🍣" },
  thai: { border: "#7c3aed", bg: "#f5f3ff", emoji: "🌶️" },
  seafood: { border: "#0284c7", bg: "#eff6ff", emoji: "🦞" },
  mediterranean: { border: "#0d9488", bg: "#f0fdfa", emoji: "🫒" },
  vegan: { border: "#22c55e", bg: "#f0fdf4", emoji: "🥗" },
  salad: { border: "#22c55e", bg: "#f0fdf4", emoji: "🥗" },
  coffee: { border: "#78716c", bg: "#fafaf9", emoji: "☕" },
  cafe: { border: "#78716c", bg: "#fafaf9", emoji: "☕" },
  cocktail: { border: "#7c3aed", bg: "#f5f3ff", emoji: "🍸" },
  bar: { border: "#7c3aed", bg: "#f5f3ff", emoji: "🍸" },
};

const DEFAULT_ACCENT = { border: "#94a3b8", bg: "#f8fafc", emoji: "🍽️" };

export function resolveClusterRestaurantAccent(restaurant = {}) {
  const cuisine = String(restaurant?.cuisine || restaurant?.category || "").toLowerCase();
  for (const [pattern, accent] of Object.entries(CUISINE_ACCENTS)) {
    if (cuisine.includes(pattern)) return accent;
  }
  return DEFAULT_ACCENT;
}

/**
 * Street line for a cluster card: drop trailing ", Los Angeles, CA 90007" — every card in a
 * cluster shares the city, and repeating it wraps the address onto extra lines.
 */
export function formatClusterCardStreetAddress(restaurant = {}) {
  const raw = String(restaurant?.address_line1 || "").trim();
  if (!raw) return null;
  const city = String(restaurant?.city || "").trim().toLowerCase();
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  while (parts.length > 1) {
    const last = parts[parts.length - 1].toLowerCase();
    const isCity = city && last === city;
    const isStateOrZip = /^([a-z]{2})?\s*(\d{5}(-\d{4})?)?$/i.test(last) || /^(usa|united states)$/i.test(last);
    if (!isCity && !isStateOrZip) break;
    parts.pop();
  }
  return parts.join(", ");
}

export function formatRestaurantCuisineLabel(restaurant = {}) {
  const cuisine = restaurant?.cuisine || restaurant?.category || null;
  if (cuisine) return String(cuisine).trim();
  if (restaurant?.cuisine_display) return String(restaurant.cuisine_display).trim();
  // No cuisine on file: say what kind of place it is ("Cafe", "Coffee Shop").
  return RESTAURANT_TYPE_LABELS[String(restaurant?.restaurant_type || "").trim().toLowerCase()] || null;
}

const RESTAURANT_TYPE_LABELS = {
  cafe: "Cafe",
  coffee_shop: "Coffee Shop",
  bakery: "Bakery",
  bar: "Bar",
  bar_and_grill: "Bar & Grill",
  food_truck: "Food Truck",
};

export function formatRestaurantMenuCount(restaurant = {}) {
  const count = Number(
    restaurant?.public_menu_item_count ??
      restaurant?.menu_item_count ??
      restaurant?.matching_item_count ??
      0
  );
  if (!Number.isFinite(count) || count <= 0) return null;
  return `${count.toLocaleString()} menu item${count === 1 ? "" : "s"}`;
}

export function formatRestaurantLocationLabel(restaurant = {}) {
  const city = restaurant?.city || null;
  const state = restaurant?.state || null;
  if (city && state) return `${city}, ${state}`;
  return restaurant?.address_line1 || null;
}

export function resolveClusterRestaurantStatus(restaurant = {}) {
  const menuReady = isRestaurantMenuReady(restaurant);
  if (menuReady === true || restaurant?.menu_availability_state === "menu_available") {
    return { text: "MENU AVAILABLE", tone: "#166534", background: "#dcfce7" };
  }
  if (restaurant?.restaurant_id) {
    return { text: "PROFILE LISTED", tone: "#92400e", background: "#fef3c7" };
  }
  return { text: "Menu not yet available", tone: "#475569", background: "#e2e8f0" };
}
