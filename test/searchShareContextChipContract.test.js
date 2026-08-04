/**
 * Contract: shared home context-chip search URLs must cold-open via
 * /api/home/context-chip, not lexical /search?q=dinner alone.
 * Audit: docs/audits/2026-08-04_search-share-context-chip-mismatch.md
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const searchPage = fs.readFileSync(
  path.join(root, "src/pages/GrubbidSearchResults.jsx"),
  "utf8"
);
const chipApi = fs.readFileSync(
  path.join(root, "src/lib/homeContextChipApi.js"),
  "utf8"
);
const foodGrid = fs.readFileSync(
  path.join(root, "src/components/homeNext/HomeNextFoodGrid.jsx"),
  "utf8"
);

test("homeContextChipApi exports stable share source helpers", () => {
  assert.match(chipApi, /export const HOME_CONTEXT_CHIP_SOURCE = "home_context_chip"/);
  assert.match(chipApi, /export function isHomeContextChipSearchSource/);
  assert.match(chipApi, /export function resolveMealPeriodFromSearchParams/);
  assert.match(chipApi, /export function buildHomeContextChipSearchState/);
  assert.match(chipApi, /explicitCity && explicitState/);
  assert.match(chipApi, /params\.set\("source", HOME_CONTEXT_CHIP_SOURCE\)/);
});

test("buildHomeContextChipSearchUrl stamps source + meal period for share fidelity", () => {
  assert.match(chipApi, /params\.set\("context", mealPeriod\)/);
  assert.match(chipApi, /params\.set\("meal_period", mealPeriod\)/);
});

test("GrubbidSearchResults cold-opens shared context-chip links via fetchHomeContextChip", () => {
  assert.match(searchPage, /fetchHomeContextChip/);
  assert.match(searchPage, /isHomeContextChipSearchSource/);
  assert.match(searchPage, /buildHomeContextChipSearchState/);
  assert.match(searchPage, /resolveMealPeriodFromSearchParams/);
  assert.match(searchPage, /context_chip_cold_open/);
  assert.match(searchPage, /home context-chip cold open failed/);
  assert.match(searchPage, /location\.state\?\.homeContextChip/);
  assert.match(searchPage, /searchSource/);
  assert.match(searchPage, /contextChipMealPeriod/);
});

test("HomeNextFoodGrid still navigates with prefetch state (unchanged entry path)", () => {
  assert.match(foodGrid, /state:\s*\{\s*homeContextChip:\s*payload\s*\}/);
  assert.match(foodGrid, /buildHomeContextChipSearchUrl/);
});

test("Share results still copies the searchable URL", () => {
  assert.match(searchPage, /handleShareResults/);
  assert.match(searchPage, /navigator\.clipboard\.writeText\(window\.location\.href\)/);
});
