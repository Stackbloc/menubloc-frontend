import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildDraftTabs,
  looksLikeDrinkSection,
  orderSectionsByLayout,
  suggestFoodDrinkTabs,
} from "../src/lib/menuSectionLayout.js";

const cupOJoy = [
  "Fresh Milk", "Guava Green Tea", "Meals", "Milk Shake", "Milk Teas", "Sea Salt Cream Topped Coffee",
  "Slush", "Smoothie", "Snacks", "Special Offer Package", "Teas",
];

test("Food / Drinks suggestion splits a boba-shop menu sensibly", () => {
  const tabs = suggestFoodDrinkTabs(cupOJoy);
  assert.deepEqual(tabs[0], { label: "Food", sections: ["Meals", "Snacks", "Special Offer Package"] });
  assert.equal(tabs[1].label, "Drinks");
  assert.equal(tabs[1].sections.length, 8);
  assert.equal(looksLikeDrinkSection("Steak & Potatoes"), false);
  assert.equal(suggestFoodDrinkTabs(["Burgers", "Fries"]), null);
});

test("draft tabs keep saved order and add new sections to the first tab", () => {
  const tabs = buildDraftTabs(
    { tabs: [{ label: "Drinks", sections: ["milk teas", "Gone section"] }, { label: "Food", sections: ["Meals"] }] },
    ["Meals", "Milk Teas", "Snacks"]
  );
  assert.deepEqual(tabs, [
    { label: "Drinks", sections: ["Milk Teas", "Snacks"] },
    { label: "Food", sections: ["Meals"] },
  ]);
  assert.deepEqual(buildDraftTabs(null, ["A", "B"]), [{ label: "", sections: ["A", "B"] }]);
});

test("editor sections follow the saved layout", () => {
  const sections = ["Meals", "Milk Teas", "Snacks"].map((name) => ({ name, items: [] }));
  const ordered = orderSectionsByLayout(sections, { tabs: [{ label: "", sections: ["Snacks", "Meals"] }] });
  assert.deepEqual(ordered.map((s) => s.name), ["Snacks", "Meals", "Milk Teas"]);
  assert.equal(orderSectionsByLayout(sections, null), sections);
});

test("public menu shows owner section tabs through the template tab bar", () => {
  const src = fs.readFileSync(new URL("../src/pages/PublicMenuPage.jsx", import.meta.url), "utf8");
  assert.match(src, /data\.section_tabs/);
  assert.match(src, /tabs_allowed_for_public_view: true/);
  // Section-tab props must override the menu-level defaults, so they come after them.
  assert.ok(src.indexOf("...(sectionTabs.length") > src.indexOf("menuPresentation: data?.menu_presentation"));
  const editor = fs.readFileSync(new URL("../src/components/menuEditor/SharedMenuEditor.jsx", import.meta.url), "utf8");
  assert.match(editor, /<MenuSectionLayoutPanel/);
});
