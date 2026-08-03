import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLUSTER_DRINK_SUBCATEGORY_CHIPS,
  isClusterBeveragesCategory,
} from "../src/lib/clusterDrinkSubcategories.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageSrc = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");
const apiSrc = readFileSync(join(root, "src/lib/clusterApi.js"), "utf8");

test("cluster drink subcategory chips include coffee, cocktails, wine, alcohol free", () => {
  const ids = CLUSTER_DRINK_SUBCATEGORY_CHIPS.map((c) => c.id);
  assert.ok(ids.includes("all"));
  assert.ok(ids.includes("coffee"));
  assert.ok(ids.includes("cocktails"));
  assert.ok(ids.includes("wine"));
  assert.ok(ids.includes("non_alcoholic"));
  const alcoholFree = CLUSTER_DRINK_SUBCATEGORY_CHIPS.find((c) => c.id === "non_alcoholic");
  assert.equal(alcoholFree.label, "Alcohol free");
});

test("BEVERAGES category detection", () => {
  assert.equal(isClusterBeveragesCategory({ code: "BEVERAGES" }), true);
  assert.equal(isClusterBeveragesCategory({ code: "BURGERS" }), false);
});

test("ClusterPage mounts oval drink subcategory ChipRail under Drinks", () => {
  assert.match(pageSrc, /CLUSTER_DRINK_SUBCATEGORY_CHIPS/);
  assert.match(pageSrc, /data-testid="cluster-food-drink-subcategory-chips"/);
  assert.match(pageSrc, /borderRadius:\s*999/);
  assert.match(pageSrc, /ChipRail/);
  assert.match(pageSrc, /drinkCategory/);
});

test("clusterApi passes drink_category for drink subcategory filter", () => {
  assert.match(apiSrc, /drink_category/);
  assert.match(apiSrc, /drinkCategory/);
});
