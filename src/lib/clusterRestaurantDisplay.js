import { isRestaurantMenuReady } from "./publicCardCounts.js";

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

const PRICE_TIER_LABELS = {
  budget: { symbols: "$", label: "Budget" },
  moderate: { symbols: "$$", label: "Moderate" },
  upscale: { symbols: "$$$", label: "Upscale" },
  premium: { symbols: "$$$$", label: "Premium" },
};

export function resolveClusterRestaurantAccent(restaurant = {}) {
  const cuisine = String(restaurant?.cuisine || restaurant?.category || "").toLowerCase();
  for (const [pattern, accent] of Object.entries(CUISINE_ACCENTS)) {
    if (cuisine.includes(pattern)) return accent;
  }
  return DEFAULT_ACCENT;
}

export function formatRestaurantPriceTier(restaurant = {}) {
  const tier = String(restaurant?.price_tier || "").trim().toLowerCase();
  const mapped = PRICE_TIER_LABELS[tier];
  if (mapped) return `${mapped.symbols} · ${mapped.label}`;
  return null;
}

export function formatRestaurantCuisineLabel(restaurant = {}) {
  const cuisine = restaurant?.cuisine || restaurant?.category || null;
  if (cuisine) return String(cuisine).trim();
  const type = String(restaurant?.restaurant_type || "").trim();
  if (!type) return "Restaurant";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

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
    return { text: "Menu on Menuply", tone: "#166534", background: "#dcfce7" };
  }
  if (restaurant?.restaurant_id) {
    return { text: "Profile listed", tone: "#92400e", background: "#fef3c7" };
  }
  return { text: "Coming soon", tone: "#475569", background: "#e2e8f0" };
}
