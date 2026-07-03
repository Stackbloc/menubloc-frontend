import { STATE_NAMES, toCitySlug, toStateSlug } from "./slugs.js";

export const CANONICAL_ORIGIN = "https://menuply.com";

function normalizeState(rawState) {
  if (!rawState) return "";
  const state = String(rawState).trim();
  return state.length === 2 ? toStateSlug(state.toUpperCase()) : toCitySlug(state);
}

export function restaurantPath({ slug, city, state } = {}) {
  const stateSlug = normalizeState(state);
  const citySlug = toCitySlug(city);
  const restaurantSlug = slug ? String(slug) : "";
  if (stateSlug && citySlug && restaurantSlug) {
    return `/restaurants/${stateSlug}/${citySlug}/${restaurantSlug}`;
  }
  return restaurantSlug ? `/restaurants/${encodeURIComponent(restaurantSlug)}` : null;
}

export function restaurantMenuPath({ slug, city, state, id } = {}) {
  const base = restaurantPath({ slug, city, state });
  if (base) return `${base}/menu`;
  return id ? `/public/restaurants/${encodeURIComponent(String(id))}/menu` : null;
}

export function cityPath({ city, state } = {}) {
  const citySlug = toCitySlug(city);
  const rawState = String(state || "").trim();
  const stateCode = rawState.length === 2
    ? rawState.toLowerCase()
    : (Object.entries(STATE_NAMES).find(([, slug]) => slug === toCitySlug(rawState))?.[0] || "").toLowerCase();
  if (!citySlug || stateCode.length !== 2) return null;
  return `/restaurants/${citySlug}-${stateCode}`;
}

export function absoluteCanonicalUrl(path) {
  return path ? `${CANONICAL_ORIGIN}${path}` : null;
}
