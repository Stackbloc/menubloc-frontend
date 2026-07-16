import test from "node:test";
import assert from "node:assert/strict";
import {
  SEARCH_CARD_NO_SIMILAR_TEXT,
  SIMILAR_PAGE_SIZE,
  buildSimilarStateFromResponse,
  cacheSimilarState,
  getCachedSimilarState,
  getSimilarMoreButtonLabel,
  groupSimilarResultsByMatchStrength,
  humanizeSimilarMatchReasons,
  mergeSimilarItems,
  resolveSimilarEmptyStateMessage,
  searchCardSimilarCache,
  shouldShowSimilarMoreButton,
} from "../src/lib/searchCardSimilar.js";

const getItemId = (row) => row?.menu_item_id || row?.menuItemId || row?.id || null;

test("zero similar results produce ready state with empty items", () => {
  const state = buildSimilarStateFromResponse({ ok: true, similar: [] });
  assert.equal(state.status, "ready");
  assert.deepEqual(state.items, []);
  assert.equal(state.pagination.has_more, false);
});

test("zero similar results show empty state copy", () => {
  assert.equal(SEARCH_CARD_NO_SIMILAR_TEXT, "No closely similar menu items were found.");
  assert.equal(resolveSimilarEmptyStateMessage(), "No closely similar menu items were found.");
});

test("zero result response is cached and reused without refetch", () => {
  searchCardSimilarCache.clear();
  const cacheKey = "similar:abc:lat:34:lng:-118";
  const emptyState = buildSimilarStateFromResponse({ ok: true, similar: [] });
  cacheSimilarState(cacheKey, emptyState);

  const cached = getCachedSimilarState(cacheKey);
  assert.ok(cached);
  assert.equal(cached.status, "ready");
  assert.deepEqual(cached.items, []);
  assert.equal(searchCardSimilarCache.has(cacheKey), true);
});

test("More appears only when pagination.has_more is true", () => {
  assert.equal(shouldShowSimilarMoreButton({ has_more: true }), true);
  assert.equal(shouldShowSimilarMoreButton({ has_more: false }), false);
  assert.equal(shouldShowSimilarMoreButton(null), false);
  assert.equal(shouldShowSimilarMoreButton(undefined), false);

  const emptyState = buildSimilarStateFromResponse({ ok: true, similar: [] });
  assert.equal(shouldShowSimilarMoreButton(emptyState.pagination), false);
});

test("More button label uses Show N more when idle", () => {
  assert.equal(getSimilarMoreButtonLabel({ loadingMore: false, pageSize: SIMILAR_PAGE_SIZE }), "Show 8 more");
  assert.equal(getSimilarMoreButtonLabel({ loadingMore: true }), "Loading…");
});

test("mergeSimilarItems appends without duplicates and preserves order", () => {
  const existing = [{ id: 1 }, { id: 2 }];
  const incoming = [{ id: 2 }, { id: 3 }];
  const merged = mergeSimilarItems(existing, incoming, (row) => row.id);
  assert.deepEqual(merged.map((row) => row.id), [1, 2, 3]);
});

test("mergeSimilarItems collapses same franchise dish at different locations", () => {
  const existing = [
    { menu_item_id: "101", chain_menu_item_id: 55, name: "Big Mac" },
  ];
  const incoming = [
    { menu_item_id: "202", chain_menu_item_id: 55, name: "Big Mac" },
    { menu_item_id: "303", chain_menu_item_id: 77, name: "Quarter Pounder" },
  ];
  const merged = mergeSimilarItems(existing, incoming, getItemId);
  assert.deepEqual(merged.map(getItemId), ["101", "303"]);
});

test("mergeSimilarItems collapses fries salads and sandwiches by canonical name", () => {
  const merged = mergeSimilarItems(
    [],
    [
      { menu_item_id: "1", name: "Medium French Fries" },
      { menu_item_id: "2", name: "Side of Fries" },
      { menu_item_id: "3", name: "Caesar Salad" },
      { menu_item_id: "4", name: "Classic Caesar Salad" },
      { menu_item_id: "5", name: "Turkey Sandwich" },
      { menu_item_id: "6", name: "Turkey Sandwich" },
    ],
    getItemId
  );
  assert.deepEqual(merged.map(getItemId), ["1", "3", "5"]);
});

test("first similar page dedupes backend duplicates", () => {
  const state = buildSimilarStateFromResponse({
    ok: true,
    similar: [
      { menu_item_id: "a", name: "French Fries" },
      { menu_item_id: "b", name: "Medium Fries" },
      { menu_item_id: "c", name: "Club Sandwich" },
      { menu_item_id: "d", name: "Club Sandwich" },
    ],
  });
  assert.deepEqual(state.items.map(getItemId), ["a", "c"]);
});

test("load-more merge does not duplicate cards after More", () => {
  const firstPage = buildSimilarStateFromResponse({
    ok: true,
    similar: [{ menu_item_id: "a" }, { menu_item_id: "b" }],
    pagination: { limit: 8, offset: 0, returned_count: 2, total_count: 4, has_more: true },
  });
  const secondPage = buildSimilarStateFromResponse(
    {
      ok: true,
      similar: [{ menu_item_id: "b" }, { menu_item_id: "c" }],
      pagination: { limit: 8, offset: 2, returned_count: 2, total_count: 4, has_more: false },
    },
    { appendItems: firstPage.items }
  );

  assert.deepEqual(secondPage.items.map(getItemId), ["a", "b", "c"]);
  assert.equal(shouldShowSimilarMoreButton(secondPage.pagination), false);
});

test("groupSimilarResultsByMatchStrength keeps exact ahead of close/related", () => {
  const bands = groupSimilarResultsByMatchStrength(
    [
      { menu_item_id: "2", name: "Spicy Variant", restaurant_name: "B", match_strength: "close", distance_miles: 0.5 },
      { menu_item_id: "1", name: "Classic", restaurant_name: "A", match_strength: "exact", distance_miles: 2 },
      { menu_item_id: "3", name: "Loose", restaurant_name: "C", match_strength: "related", distance_miles: 0.2 },
    ],
    getItemId
  );
  assert.deepEqual(
    bands.map((b) => b.strength),
    ["exact", "close", "related"]
  );
  assert.equal(bands[0].restaurants[0].items[0].menu_item_id, "1");
  assert.deepEqual(
    humanizeSimilarMatchReasons({ codes: ["exact_food_form_match", "primary_protein_match"] }),
    ["Same food type", "Same protein"]
  );
});
