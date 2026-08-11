import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import { collectAvailableBeverageFilterOptions } from "../src/lib/clusterDrinksDirectory.js";
import { formatClusterListingNoteForDisplay } from "../src/lib/clusterListingNoteDisplay.js";
import {
  CLUSTER_DRINK_SUBCATEGORY_CHIPS,
  isClusterBeveragesCategory,
  resolveAvailableDrinkCategoriesFromResponse,
  visibleClusterDrinkSubcategoryChips,
} from "../src/lib/clusterDrinkSubcategories.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pageSrc = readFileSync(join(root, "src/pages/ClusterPage.jsx"), "utf8");
const apiSrc = readFileSync(join(root, "src/lib/clusterApi.js"), "utf8");
const cardSrc = readFileSync(
  join(root, "src/components/cluster/ClusterRestaurantDirectoryCard.jsx"),
  "utf8"
);
const drinksDirSrc = readFileSync(
  join(root, "src/components/cluster/ClusterPlaceholderListingCard.jsx"),
  "utf8"
);

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

test("visibleClusterDrinkSubcategoryChips hides empty Yellow Browser types", () => {
  assert.deepEqual(visibleClusterDrinkSubcategoryChips([]), []);
  assert.deepEqual(visibleClusterDrinkSubcategoryChips(null), []);
  const visible = visibleClusterDrinkSubcategoryChips(["coffee", "beer"]);
  assert.equal(visible[0].id, "all");
  const typedIds = visible.slice(1).map((c) => c.id);
  assert.ok(typedIds.includes("coffee"));
  assert.ok(typedIds.includes("beer"));
  assert.ok(!typedIds.includes("wine"));
  assert.ok(!typedIds.includes("cocktails"));
});

test("resolveAvailableDrinkCategoriesFromResponse ignores legacy advertising drink_categories", () => {
  const onlyCoffeeItems = {
    drink_categories: [
      "cocktails",
      "beer",
      "wine",
      "spirits",
      "coffee",
      "tea",
      "smoothies",
      "juice",
      "mocktails",
      "non_alcoholic",
      "happy_hour",
    ],
    menu_items: [{ name: "Cold Brew", drinks_browser_categories: ["coffee"] }],
  };
  assert.deepEqual(resolveAvailableDrinkCategoriesFromResponse(onlyCoffeeItems), ["coffee"]);
  assert.deepEqual(
    resolveAvailableDrinkCategoriesFromResponse({
      available_drink_categories: ["coffee", "beer"],
      drink_categories: onlyCoffeeItems.drink_categories,
      menu_items: [],
    }),
    ["coffee", "beer"]
  );
});

test("ClusterPage uses resolveAvailableDrinkCategoriesFromResponse", () => {
  assert.match(pageSrc, /resolveAvailableDrinkCategoriesFromResponse/);
  assert.match(pageSrc, /rememberMenuBrowserVenueSession/);
});

test("collectAvailableBeverageFilterOptions hides empty restaurant-tab drink chips", () => {
  const sections = [
    {
      area: "Indio Central Market",
      listings: [
        { name: "Everbloom", beverage_type: "coffee" },
        { name: "Beer Barn", beverage_type: "beer" },
      ],
    },
  ];
  const opts = collectAvailableBeverageFilterOptions(sections);
  assert.deepEqual(
    opts.map((o) => o.id),
    ["all", "coffee", "beer"]
  );
  assert.ok(!opts.some((o) => o.id === "wine"));
  assert.ok(!opts.some((o) => o.id === "cocktails"));
});

test("BEVERAGES category detection", () => {
  assert.equal(isClusterBeveragesCategory({ code: "BEVERAGES" }), true);
  assert.equal(isClusterBeveragesCategory({ code: "BURGERS" }), false);
});

test("ClusterPage mounts drink subcategory ChipRail only for non-empty visible chips", () => {
  assert.match(pageSrc, /visibleClusterDrinkSubcategoryChips/);
  assert.match(pageSrc, /availableDrinkCategories/);
  assert.match(pageSrc, /data-testid="cluster-food-drink-subcategory-chips"/);
  assert.match(pageSrc, /visibleDrinkChips\.length > 0/);
  assert.match(pageSrc, /ChipRail/);
  assert.match(pageSrc, /drinkCategory/);
});

test("clusterApi passes drink_category for drink subcategory filter", () => {
  assert.match(apiSrc, /drink_category/);
  assert.match(apiSrc, /drinkCategory/);
});

test("listing note display strips SOURCE STATUS garbled chrome", () => {
  assert.equal(
    formatClusterListingNoteForDisplay(
      "SOURCE STATUS: historical_reference — publicly associated with Coachella 2026"
    ),
    null
  );
  assert.equal(formatClusterListingNoteForDisplay("catering orders only"), "catering orders only");
  assert.equal(
    formatClusterListingNoteForDisplay("Indio Central Market · historical/reference"),
    "Indio Central Market · historical/reference"
  );
});

test("cluster restaurant card uses sanitized listing note on its own line", () => {
  assert.match(cardSrc, /formatClusterListingNoteForDisplay/);
  assert.match(cardSrc, /cluster-restaurant-listing-note/);
  assert.doesNotMatch(cardSrc, /WebkitLineClamp/);
});

test("cluster drinks directory hides empty beverage filter chips", () => {
  assert.match(drinksDirSrc, /collectAvailableBeverageFilterOptions/);
  assert.match(drinksDirSrc, /availableFilterOptions\.length > 1/);
});
