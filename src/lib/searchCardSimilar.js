export const SEARCH_CARD_NO_SIMILAR_TEXT = "No similar items found.";
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

export function mergeSimilarItems(existingItems, incomingItems, getItemId) {
  const seen = new Set((existingItems || []).map((item) => getItemId(item)).filter(Boolean));
  const merged = [...(existingItems || [])];
  for (const item of incomingItems || []) {
    const itemId = getItemId(item);
    if (!itemId || seen.has(itemId)) continue;
    seen.add(itemId);
    merged.push(item);
  }
  return merged;
}

export function buildSimilarStateFromResponse(json, { appendItems = [] } = {}) {
  const batch = Array.isArray(json?.similar) ? json.similar : [];
  const resolveId = (row) => row?.menu_item_id || row?.menuItemId || row?.id || null;
  const items = appendItems.length ? mergeSimilarItems(appendItems, batch, resolveId) : batch;
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
