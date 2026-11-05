/**
 * Contract: cluster "Food by type" (2026-10-28).
 *   node --test test/clusterFoodByTypeContract.test.js
 * Chip logic helpers + screen rules (flag-gated, one accent, neutral tile borders, counts-only grid,
 * debounce/abort, session-only chips, est. label, existing search reused unchanged).
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FOOD_BY_TYPE_DEBOUNCE_MS,
  FOOD_BY_TYPE_PAGE_SIZE,
  chipsKey,
  createLatestRequestRunner,
  dishNutritionParts,
  formatDishCount,
  keepKnownChips,
  readSessionChips,
  toggleChip,
  writeSessionChips,
} from "../src/lib/clusterFoodByType.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
// 2026-11-05: the chips live on the cluster page (app look); the old screen redirects there.
const oldPageSrc = read("src/pages/ClusterFoodByTypePage.jsx");
const pageSrc = read("src/components/cluster/ClusterFoodByTypeParts.jsx") + read("src/hooks/useFoodTypeChips.js");
const boxSrc = read("src/components/cluster/ClusterMksCategoryBlock.jsx");
const cssSrc = read("src/styles/clusterFoodByType.css");
const libSrc = read("src/lib/clusterFoodByType.js");
const apiSrc = read("src/lib/clusterApi.js");
const appSrc = read("src/App.jsx");
const clusterPageSrc = read("src/pages/ClusterPage.jsx");

function memoryStorage() {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) };
}

test("toggleChip: multi-select toggle, sorted so the same set makes the same request", () => {
  let chips = [];
  chips = toggleChip(chips, "vegan");
  chips = toggleChip(chips, "low_carb");
  assert.deepEqual(chips, ["low_carb", "vegan"]);
  chips = toggleChip(chips, "vegan");
  assert.deepEqual(chips, ["low_carb"]);
  assert.equal(chipsKey(["vegan", "low_carb"]), chipsKey(["low_carb", "vegan"]));
});

test("session chips: round-trip per cluster; broken storage never throws", () => {
  const storage = memoryStorage();
  writeSessionChips("usc", ["vegan", "low_carb"], storage);
  assert.deepEqual(readSessionChips("usc", storage), ["low_carb", "vegan"]);
  assert.deepEqual(readSessionChips("ucla", storage), []);
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  assert.deepEqual(readSessionChips("usc", broken), []);
  assert.doesNotThrow(() => writeSessionChips("usc", ["vegan"], broken));
  storage.setItem("menuply.foodByType.chips.usc", "{not json");
  assert.deepEqual(readSessionChips("usc", storage), []);
});

test("chips persist for the session only (sessionStorage, never localStorage)", () => {
  assert.match(libSrc, /globalThis\.sessionStorage/);
  assert.doesNotMatch(libSrc + pageSrc, /localStorage/);
});

test("keepKnownChips drops ids the server no longer offers", () => {
  const available = [{ id: "low_carb" }, { id: "vegan" }];
  assert.deepEqual(keepKnownChips(["keto", "vegan"], available), ["vegan"]);
  assert.deepEqual(keepKnownChips(["keto"], []), ["keto"]);
});

test("formatDishCount", () => {
  assert.equal(formatDishCount(0), "0 dishes");
  assert.equal(formatDishCount(1), "1 dish");
  assert.equal(formatDishCount(3200), "3,200 dishes");
});

test("dish nutrition: est. on estimated values, none on verified, missing values skipped", () => {
  const est = dishNutritionParts({ calories: 520.4, protein_g: 31, carbs_g: null, sodium_mg: 640, nutrition_label: "est." });
  assert.deepEqual(est.map((p) => p.text), ["520 cal", "31g protein", "640mg sodium"]);
  assert.ok(est.every((p) => p.estimated));
  const verified = dishNutritionParts({ calories: 670, data_source: "verified", nutrition_label: null });
  assert.equal(verified[0].estimated, false);
  assert.deepEqual(dishNutritionParts({}), []);
});

test("debounce 200 ms + abort: rapid taps send one request; a new request aborts the old one", () => {
  assert.equal(FOOD_BY_TYPE_DEBOUNCE_MS, 200);
  const timers = [];
  const runner = createLatestRequestRunner({
    setTimer: (fn, ms) => { timers.push({ fn, ms, live: true }); return timers.length - 1; },
    clearTimer: (id) => { timers[id].live = false; },
  });
  const started = [];
  const first = runner.run((signal) => started.push(["a", signal]));
  runner.run((signal) => started.push(["b", signal]));
  const third = runner.run((signal) => started.push(["c", signal]));
  assert.equal(first.signal.aborted, true);
  timers.filter((t) => t.live).forEach((t) => t.fn());
  assert.deepEqual(started.map(([n]) => n), ["c"]);
  assert.equal(timers[timers.length - 1].ms, 200);
  runner.run(() => {}, { immediate: true });
  assert.equal(third.signal.aborted, true, "in-flight request aborted when a new one starts");
});

test("dish list page size 40 (server caps at 60)", () => {
  assert.equal(FOOD_BY_TYPE_PAGE_SIZE, 40);
});

test("flag-gated chips on the cluster page; the old /food-by-type route redirects there with ?category=", () => {
  assert.match(read("src/lib/featureFlags.js"), /VITE_ENABLE_FOOD_BY_TYPE/);
  assert.match(clusterPageSrc, /useFoodTypeChips\(clusterSlug, \{ enabled: enabled && isClusterFoodByTypeEnabled\(\) \}\)/);
  assert.match(appSrc, /\/clusters\/:stateSlug\/:citySlug\/:clusterSlug\/food-by-type/);
  assert.match(oldPageSrc, /<Navigate to=\{`\/clusters\/\$\{stateSlug\}\/\$\{citySlug\}\/\$\{clusterSlug\}\$\{qs\}`\} replace \/>/);
  assert.match(oldPageSrc, /CLUSTER_CATEGORY_QUERY_KEY/);
  assert.doesNotMatch(clusterPageSrc, /cluster-food-by-type-link/);
});

test("chips only where the cluster has food-by-type tiles (USC today); other clusters keep plain boxes", () => {
  assert.match(pageSrc, /const has = tiles\.length > 0 && list\.length > 0/);
  assert.match(pageSrc, /availableChips: supported \? availableChips : \[\]/);
  assert.match(pageSrc, /if \(!availableChips\.length\) return null/);
});

test("box counts come from the counts endpoint; dish rows from the dishes endpoint with chips carried", () => {
  assert.match(apiSrc, /food-by-type\/counts/);
  assert.match(apiSrc, /food-by-type\/\$\{encodeURIComponent\(category\)\}\/dishes/);
  assert.match(pageSrc, /fetchClusterFoodByTypeCounts\(clusterSlug, \{ chips, signal \}\)/);
  assert.match(pageSrc, /fetchClusterFoodByTypeDishes\(clusterSlug, category, \{ chips/);
  assert.match(pageSrc, /next_cursor/);
  assert.match(clusterPageSrc, /counts=\{chipsOn \? foodChips\.counts : null\}/);
});

test("loading: previous counts stay (dimmed) while refreshing; retry on dish error", () => {
  assert.match(boxSrc, /opacity: refreshing && counts \? 0\.6 : 1/);
  assert.match(pageSrc, /fbt-grid--refreshing/);
  assert.match(cssSrc, /\.fbt-grid--refreshing\s*\{\s*opacity/);
  assert.match(pageSrc, /Try again/);
});

test("empty boxes with chips on: dimmed, disabled, still in place, show 0 dishes", () => {
  assert.match(boxSrc, /disabled=\{empty\}/);
  assert.match(boxSrc, /opacity: empty \? 0\.4 : 1/);
  assert.equal(formatDishCount(0), "0 dishes");
});

test("one accent (--mp-accent) on selected chips; tiles have neutral 1px borders; no other greens", () => {
  assert.match(cssSrc, /\.fbt-chip\[aria-pressed="true"\]\s*\{[^}]*var\(--mp-accent/);
  assert.match(cssSrc, /\.fbt-tile\s*\{[^}]*border:\s*1px solid #e5e7eb/);
  const hexes = cssSrc.match(/#[0-9a-f]{3,6}\b/gi) || [];
  const allowedAccentFallbacks = new Set(["#0f7a24"]);
  for (const hex of hexes) {
    const h = hex.slice(1).length === 3 ? hex.slice(1).split("").map((c) => c + c).join("") : hex.slice(1);
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    const greenish = g > r + 40 && g > b + 20;
    assert.ok(!greenish || allowedAccentFallbacks.has(hex.toLowerCase()), `unexpected green ${hex}`);
  }
  assert.doesNotMatch(pageSrc, /border:\s*`?\$\{accent/);
});

test("tiles: fixed height, names clamp to two lines, 3 columns", () => {
  assert.match(cssSrc, /\.fbt-tile\s*\{[^}]*height:\s*112px/);
  assert.match(cssSrc, /-webkit-line-clamp:\s*2/);
  assert.match(cssSrc, /grid-template-columns:\s*repeat\(3,/);
});

test("chips come from the server config, not hard-coded thresholds on the client", () => {
  assert.match(pageSrc, /available_chips/);
  assert.doesNotMatch(pageSrc + libSrc, /\b600\b|\b25\b g|carbs_g\s*<=|protein_g\s*>=/);
  assert.doesNotMatch(pageSrc, /Filters/);
});

test("one search: the cluster page's own search form (no second Food by type search)", () => {
  assert.match(clusterPageSrc, /export function ClusterFoodSearchForm\(/);
  assert.doesNotMatch(pageSrc, /ClusterFoodSearchForm/);
});
