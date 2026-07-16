/**
 * ============================================================
 * File: searchCardSimilar.js
 * Path: menubloc-frontend/src/lib/searchCardSimilar.js
 * Date: 2026-07-15
 * Purpose:
 *   Search-card Show Similar helpers — cache, pagination, empty copy,
 *   match-strength grouping (precision over quantity). Explanations stay
 *   internal / debug-only; no public technical codes.
 * ============================================================
 */

export const SEARCH_CARD_NO_SIMILAR_TEXT =
  "No closely similar menu items were found.";
export const SIMILAR_INITIAL_LIMIT = 8;
export const SIMILAR_PAGE_SIZE = 8;

/** Module-level cache: keyed by menu item + geo + filters. Survives tab close/reopen. */
export const searchCardSimilarCache = new Map();

export function getCachedSimilarState(cacheKey) {
  if (!cacheKey || !searchCardSimilarCache.has(cacheKey)) return null;
  return searchCardSimilarCache.get(cacheKey);
}

export function cacheSimilarState(cacheKey, state) {
  if (!cacheKey || !state) return;
  searchCardSimilarCache.set(cacheKey, state);
}

import { canonicalSimilarItemKey } from "./similarCanonicalDedupe.js";

export { canonicalSimilarItemKey };

export function mergeSimilarItems(existingItems, incomingItems, getItemId) {
  const seenIds = new Set();
  const seenCanonical = new Set();
  const merged = [];

  const tryAdd = (item) => {
    const itemId = getItemId(item);
    const canonicalKey = canonicalSimilarItemKey(item);
    if (itemId && seenIds.has(itemId)) return;
    if (canonicalKey && seenCanonical.has(canonicalKey)) return;
    if (itemId) seenIds.add(itemId);
    if (canonicalKey) seenCanonical.add(canonicalKey);
    merged.push(item);
  };

  for (const item of existingItems || []) tryAdd(item);
  for (const item of incomingItems || []) tryAdd(item);
  return merged;
}

export function buildSimilarStateFromResponse(json, { appendItems = [] } = {}) {
  const batch = Array.isArray(json?.similar) ? json.similar : [];
  const resolveId = (row) => row?.menu_item_id || row?.menuItemId || row?.id || null;
  const items = mergeSimilarItems(appendItems, batch, resolveId);
  return {
    status: "ready",
    items,
    meta: json?.meta || null,
    pagination: json?.pagination || {
      limit: SIMILAR_INITIAL_LIMIT,
      offset: 0,
      returned_count: items.length,
      total_count: items.length,
      has_more: false,
    },
  };
}

/** More button is shown only when the backend reports additional pages. */
export function shouldShowSimilarMoreButton(pagination) {
  return pagination?.has_more === true;
}

export function getSimilarMoreButtonLabel({ loadingMore = false, pageSize = SIMILAR_PAGE_SIZE } = {}) {
  if (loadingMore) return "Loading…";
  return `Show ${pageSize} more`;
}

export function isShowSimilarChipVisible(menuItemId) {
  return Boolean(menuItemId);
}

export function resolveSimilarEmptyStateMessage() {
  return SEARCH_CARD_NO_SIMILAR_TEXT;
}

/**
 * Resolve consumer-safe match strength for ordering.
 * exact → nearly identical; close → same form / soft; related → weaker band.
 */
export function resolveSimilarMatchStrength(item) {
  const raw = String(item?.match_strength || "").toLowerCase();
  if (raw === "exact" || raw === "close" || raw === "related") return raw;
  const tier = Number(item?.compatibility_tier);
  if (tier === 0) return "exact";
  if (tier === 1) return "close";
  if (Number.isFinite(tier) && tier > 1) return "related";
  // Prefer stronger band when unknown so we don't invent "related" ahead of exact.
  return "exact";
}

const MATCH_STRENGTH_ORDER = { exact: 0, close: 1, related: 2 };

export function sortSimilarItemsByMatchStrength(items) {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) => {
    const sa = MATCH_STRENGTH_ORDER[resolveSimilarMatchStrength(a)] ?? 0;
    const sb = MATCH_STRENGTH_ORDER[resolveSimilarMatchStrength(b)] ?? 0;
    if (sa !== sb) return sa - sb;
    const da = a?.distance_miles;
    const db = b?.distance_miles;
    if (da != null && db != null && da !== db) return da - db;
    if (da == null && db != null) return 1;
    if (da != null && db == null) return -1;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
}

const BAND_LABELS = {
  exact: "Closest matches",
  close: "Same style",
  related: "Related variations",
};

/**
 * Group Similar rows by match strength first (never put weaker matches above
 * stronger), then by restaurant within each band.
 */
export function groupSimilarResultsByMatchStrength(items, getItemId) {
  const resolveId =
    getItemId || ((row) => row?.menu_item_id || row?.menuItemId || row?.id || null);
  const ordered = sortSimilarItemsByMatchStrength(
    mergeSimilarItems([], items, resolveId)
  );

  const bands = [];
  const bandIndex = new Map();

  for (const item of ordered) {
    const strength = resolveSimilarMatchStrength(item);
    if (!bandIndex.has(strength)) {
      bandIndex.set(strength, bands.length);
      bands.push({
        strength,
        label: BAND_LABELS[strength] || BAND_LABELS.exact,
        restaurants: [],
        _restaurantIndex: new Map(),
      });
    }
    const band = bands[bandIndex.get(strength)];
    const restaurantId = item?.restaurant_id != null ? String(item.restaurant_id) : "";
    const restaurantName = String(item?.restaurant_name || "").trim() || "Nearby restaurant";
    const rKey = restaurantId || restaurantName;
    if (!band._restaurantIndex.has(rKey)) {
      band._restaurantIndex.set(rKey, band.restaurants.length);
      band.restaurants.push({
        restaurant_id: restaurantId || null,
        restaurant_name: restaurantName,
        items: [],
      });
    }
    band.restaurants[band._restaurantIndex.get(rKey)].items.push(item);
  }

  return bands.map(({ strength, label, restaurants }) => ({
    strength,
    label,
    restaurants,
  }));
}

/** @deprecated Prefer groupSimilarResultsByMatchStrength — kept for callers that only need flat restaurant groups. */
export function groupSimilarResultsByRestaurant(items, getItemId) {
  const bands = groupSimilarResultsByMatchStrength(items, getItemId);
  const flat = [];
  for (const band of bands) {
    for (const r of band.restaurants) flat.push(r);
  }
  return flat;
}

/**
 * Map explanation codes → short consumer phrases. Debug / future UI only.
 * Never returns raw technical codes.
 */
export function humanizeSimilarMatchReasons(explanation) {
  if (!explanation || typeof explanation !== "object") return [];
  const codes = Array.isArray(explanation.codes) ? explanation.codes : [];
  const phrases = [];
  const push = (p) => {
    if (p && !phrases.includes(p)) phrases.push(p);
  };
  for (const code of codes) {
    switch (String(code)) {
      case "exact_food_form_match":
        push("Same food type");
        break;
      case "soft_food_form_match":
        push("Similar food type");
        break;
      case "compatible_carrier":
        push("Same serving style");
        break;
      case "primary_protein_match":
        push("Same protein");
        break;
      case "meal_context_match":
        push("Same meal context");
        break;
      case "preparation_similarity":
        push("Similar preparation");
        break;
      default:
        break;
    }
  }
  return phrases;
}

export function shouldExposeSimilarMatchReasons(searchOrFlag) {
  if (searchOrFlag === true) return true;
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search || "");
      if (params.get("similar_debug") === "1" || params.get("include_compatibility_debug") === "1") {
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  if (typeof searchOrFlag === "string") {
    const params = new URLSearchParams(searchOrFlag || "");
    return (
      params.get("similar_debug") === "1" || params.get("include_compatibility_debug") === "1"
    );
  }
  return false;
}
