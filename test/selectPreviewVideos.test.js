/**
 * Unit tests for selectPreviewVideos (deterministic profile Videos preview).
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  selectPreviewVideos,
  isPreviewEligible,
  deriveCategoryChips,
} from "../src/lib/selectPreviewVideos.js";

function makeVideo(overrides = {}) {
  const id = overrides.video_id ?? Math.floor(Math.random() * 1e6);
  const kind = overrides.kind || "ate";
  return {
    video_key: overrides.video_key || `${kind}:${id}`,
    kind,
    video_id: id,
    video_url: overrides.video_url ?? "https://cdn.example/v.mp4",
    thumbnail_url: overrides.thumbnail_url ?? "https://cdn.example/t.jpg",
    item_name: overrides.item_name ?? `Dish ${id}`,
    menu_item_id: overrides.menu_item_id ?? id,
    section_name: overrides.section_name ?? "Entrees",
    created_at: overrides.created_at ?? "2026-09-01T12:00:00.000Z",
    tagged_restaurant_id: overrides.tagged_restaurant_id ?? 100,
    creator_key: overrides.creator_key ?? `ck${id}`,
    creator_label: overrides.creator_label ?? "A diner",
    ...overrides,
  };
}

function buildPool(n, { daysSpread = 40, categories = ["Entrees", "Sides"] } = {}) {
  const now = Date.parse("2026-09-19T12:00:00.000Z");
  return Array.from({ length: n }, (_, i) => {
    const ageDays = (i * daysSpread) / Math.max(n - 1, 1);
    const created = new Date(now - ageDays * 86400000).toISOString();
    return makeVideo({
      video_id: i + 1,
      menu_item_id: (i % 8) + 1,
      item_name: `Dish ${(i % 8) + 1}`,
      section_name: categories[i % categories.length],
      created_at: created,
      creator_key: `diner${(i % 12) + 1}`,
      tagged_restaurant_id: i % 3 === 0 ? 200 : 100,
    });
  });
}

test("same seed → same output; different seeds differ when pool ≥ 10", () => {
  const pool = buildPool(12);
  const now = "2026-09-19T12:00:00.000Z";
  const a = selectPreviewVideos(pool, { seed: 42, now, profileRestaurantId: 100 });
  const b = selectPreviewVideos(pool, { seed: 42, now, profileRestaurantId: 100 });
  const c = selectPreviewVideos(pool, { seed: 99, now, profileRestaurantId: 100 });
  assert.deepEqual(
    a.items.map((v) => v.video_key),
    b.items.map((v) => v.video_key)
  );
  assert.notDeepEqual(
    a.items.map((v) => v.video_key).sort(),
    c.items.map((v) => v.video_key).sort()
  );
});

test("plan / event / removed never appear", () => {
  const pool = [
    makeVideo({ video_id: 1, kind: "ate" }),
    makeVideo({ video_id: 2, kind: "plan" }),
    makeVideo({ video_id: 3, kind: "event" }),
    makeVideo({ video_id: 4, kind: "want", removed_by_restaurant: true }),
    makeVideo({ video_id: 5, kind: "managed", moderation_blocked: true }),
  ];
  const { items, poolSize } = selectPreviewVideos(pool, {
    seed: 1,
    now: "2026-09-19T12:00:00.000Z",
    profileRestaurantId: 100,
  });
  assert.equal(poolSize, 1);
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, "ate");
  assert.equal(isPreviewEligible(pool[1]), false);
});

test("constraints: at most 2 per dish, at most 1 per diner", () => {
  const pool = Array.from({ length: 20 }, (_, i) =>
    makeVideo({
      video_id: i + 1,
      menu_item_id: i < 10 ? 1 : 2,
      item_name: i < 10 ? "Burger" : "Salad",
      creator_key: `d${i % 3}`,
      section_name: i % 2 === 0 ? "Entrees" : "Salads",
      created_at: new Date(Date.parse("2026-09-19T12:00:00.000Z") - i * 86400000).toISOString(),
    })
  );
  const { items } = selectPreviewVideos(pool, {
    seed: 7,
    now: "2026-09-19T12:00:00.000Z",
    profileRestaurantId: 100,
    limit: 6,
  });
  const byDish = new Map();
  const byDiner = new Map();
  for (const v of items) {
    const d = v.menu_item_id;
    byDish.set(d, (byDish.get(d) || 0) + 1);
    byDiner.set(v.creator_key, (byDiner.get(v.creator_key) || 0) + 1);
  }
  for (const count of byDish.values()) assert.ok(count <= 2);
  for (const count of byDiner.values()) assert.equal(count, 1);
});

test("pool ≤ 6 returns all in score order with no shuffle", () => {
  const pool = buildPool(5, { daysSpread: 20 });
  const now = "2026-09-19T12:00:00.000Z";
  const a = selectPreviewVideos(pool, { seed: 1, now, profileRestaurantId: 100 });
  const b = selectPreviewVideos(pool, { seed: 999, now, profileRestaurantId: 100 });
  assert.equal(a.items.length, 5);
  assert.deepEqual(
    a.items.map((v) => v.video_key),
    b.items.map((v) => v.video_key)
  );
  for (let i = 1; i < a.items.length; i += 1) {
    assert.ok(a.items[i - 1]._preview_score >= a.items[i]._preview_score);
  }
});

test("across 20 seeds with lastShownIds, average overlap ≤ 4", () => {
  const pool = buildPool(14);
  const now = "2026-09-19T12:00:00.000Z";
  let prev = selectPreviewVideos(pool, {
    seed: 0,
    now,
    profileRestaurantId: 100,
  }).items.map((v) => v.video_key);
  let totalOverlap = 0;
  for (let s = 1; s <= 20; s += 1) {
    const next = selectPreviewVideos(pool, {
      seed: s,
      now,
      lastShownIds: prev,
      profileRestaurantId: 100,
    }).items.map((v) => v.video_key);
    const set = new Set(prev);
    const overlap = next.filter((id) => set.has(id)).length;
    totalOverlap += overlap;
    prev = next;
  }
  const avg = totalOverlap / 20;
  assert.ok(avg <= 4, `average overlap ${avg} > 4`);
});

test("deriveCategoryChips hides row when fewer than 2 categories with ≥2 videos", () => {
  const thin = [
    makeVideo({ video_id: 1, section_name: "Entrees" }),
    makeVideo({ video_id: 2, section_name: "Entrees" }),
    makeVideo({ video_id: 3, section_name: "Sides" }),
  ];
  assert.equal(deriveCategoryChips(thin).length, 0);
  const rich = [
    ...thin,
    makeVideo({ video_id: 4, section_name: "Sides" }),
  ];
  assert.equal(deriveCategoryChips(rich).length, 2);
});
