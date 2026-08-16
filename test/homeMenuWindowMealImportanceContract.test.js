/**
 * Home menu windows trust BE-shaped preview_menu_items (meal-importance contract).
 * Authority: docs/guardrails/2026-08-16_home-menu-window-meal-importance-contract.md
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("DiscoveryCard and FeaturedDiscoveryCard consume preview_menu_items from BE", () => {
  const discovery = read("src/components/discovery/DiscoveryCard.jsx");
  const featured = read("src/components/discovery/FeaturedDiscoveryCard.jsx");
  for (const src of [discovery, featured]) {
    assert.match(src, /preview_menu_items/);
    assert.match(src, /preview_items/);
    // No local invent of full-menu SKU lists for chips
    assert.doesNotMatch(src, /menu\.items\.slice\(/);
    assert.doesNotMatch(src, /all_menu_items/);
  }
});

test("HomeNextMenuCardRow routes panes through DiscoveryCard", () => {
  const row = read("src/components/homeNext/HomeNextMenuCardRow.jsx");
  assert.match(row, /DiscoveryCard/);
  assert.match(row, /paneVariant/);
});

test("FE mirror of meal-importance contract exists", () => {
  const body = read("docs/guardrails/2026-08-16_home-menu-window-meal-importance-contract.md");
  assert.match(body, /only from ranks 1–4/);
  assert.match(body, /Meal Importance/);
});
