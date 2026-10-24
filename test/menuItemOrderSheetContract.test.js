/**
 * Tap-to-order item sheet (Andre, 2026-10-23 — Viztango / Square Online feel): a dish tap opens a
 * sheet with photo, quantity, owner modifier groups and "Add to order $X"; required groups and
 * min/max gate the add; adding shows a "Your cart (N)" popover instead of the generic toast.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  clampQuantity,
  computeSheetTotalCents,
  describeGroupRule,
  firstBlockingGroup,
  getItemPhotoUrls,
  getSheetGroups,
  groupSelectionStatus,
  selectedModifiers,
  toggleGroupSelection,
} from "../src/components/basket/itemOrderSheetModel.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const ITEM = {
  menu_item_id: 552047,
  name: "Cajun Chicken Pasta",
  image_url: "https://example.test/a.jpg",
  photo_urls: ["https://example.test/a.jpg", "https://example.test/b.jpg"],
  modifier_groups: [
    {
      id: "pasta",
      name: "Pasta",
      required: true,
      min_selections: 1,
      max_selections: 1,
      options: [
        { id: "linguine", name: "Linguine", price_delta_cents: 0 },
        { id: "gf", name: "Gluten-free penne", price_delta_cents: 250 },
      ],
    },
    {
      id: "veg",
      name: "Add Vegetables",
      min_selections: 0,
      max_selections: 2,
      options: [
        { id: "tomato", name: "Tomatoes", price_delta_cents: 100 },
        { id: "onion", name: "Red Onion", price_delta_cents: 100 },
        { id: "basil", name: "Basil", price_delta_cents: 100 },
      ],
    },
  ],
};

test("groups normalize with required / optional and min / max", () => {
  const [pasta, veg] = getSheetGroups(ITEM);
  assert.equal(pasta.required, true);
  assert.equal(pasta.minSelections, 1);
  assert.equal(veg.required, false);
  assert.equal(veg.maxSelections, 2);
  assert.equal(describeGroupRule(pasta), "Choose 1");
  assert.equal(describeGroupRule(veg), "Choose up to 2");
  assert.equal(describeGroupRule({ minSelections: 2, maxSelections: 4 }), "Choose 2 to 4");
});

test("required group blocks Add until chosen; radios never un-pick a required choice", () => {
  const groups = getSheetGroups(ITEM);
  const [pasta] = groups;
  assert.equal(firstBlockingGroup(groups, {})?.groupId, "pasta");
  let picked = toggleGroupSelection(pasta, [], "gf");
  assert.deepEqual(picked, ["gf"]);
  assert.deepEqual(toggleGroupSelection(pasta, picked, "gf"), ["gf"]);
  assert.deepEqual(toggleGroupSelection(pasta, picked, "linguine"), ["linguine"]);
  assert.equal(firstBlockingGroup(groups, { pasta: picked }), null);
});

test("checkbox group stops at max and reports over-max as blocking", () => {
  const veg = getSheetGroups(ITEM)[1];
  let ids = toggleGroupSelection(veg, [], "tomato");
  ids = toggleGroupSelection(veg, ids, "onion");
  assert.deepEqual(toggleGroupSelection(veg, ids, "basil"), ["tomato", "onion"]);
  assert.deepEqual(toggleGroupSelection(veg, ids, "tomato"), ["onion"]);
  assert.equal(groupSelectionStatus(veg, ["tomato", "onion", "basil"]).ok, false);
});

test("Add to order total = (base + options) × quantity", () => {
  const groups = getSheetGroups(ITEM);
  const sel = { pasta: ["gf"], veg: ["tomato", "basil"] };
  assert.equal(computeSheetTotalCents(1795, groups, sel, 3), (1795 + 250 + 200) * 3);
  assert.equal(computeSheetTotalCents(1795, groups, {}, 1), 1795);
  assert.deepEqual(selectedModifiers(groups, sel).map((m) => m.name), ["Gluten-free penne", "Tomatoes", "Basil"]);
  assert.equal(clampQuantity(0), 1);
  assert.equal(clampQuantity(500), 99);
});

test("photos: primary first, extras de-duplicated → 'See N photos'", () => {
  assert.deepEqual(getItemPhotoUrls(ITEM), ["https://example.test/a.jpg", "https://example.test/b.jpg"]);
  assert.deepEqual(getItemPhotoUrls({ photo_url: "x" }), ["x"]);
  assert.match(read("src/components/basket/MenuItemOrderSheet.jsx"), /See \{photos\.length\} photos/);
});

test("sheet: quantity stepper, Optional/Required labels, sticky ✕ + Add to order $X", () => {
  const sheet = read("src/components/basket/MenuItemOrderSheet.jsx");
  assert.match(sheet, /aria-label="Decrease quantity"/);
  assert.match(sheet, /aria-label="Increase quantity"/);
  assert.match(sheet, /"Required"\) : "Optional"/);
  assert.match(sheet, /aria-expanded=\{isOpen\}/);
  assert.match(sheet, /className="mp-ios-close" aria-label="Close"/);
  assert.match(sheet, /<span>Add to order<\/span>\s*<span>\{formatCents\(totalCents\)\}<\/span>/);
  assert.match(sheet, /aria-disabled=\{blocking \? "true" : "false"\}/);
  assert.match(sheet, /@media \(max-width:640px\)/);
  assert.match(sheet, /createPortal\(/);
});

test("restaurant menu: a dish tap opens the sheet; adding shows the Your cart popover", () => {
  const page = read("src/pages/PublicMenuPage.jsx");
  assert.match(page, /tapRowToAdd: true,\s*tapRowOpensSheet: true,/);
  assert.match(page, /<MenuItemOrderSheet/);
  assert.match(page, /announce: false/);
  assert.match(page, /<CartAddedPopover/);
  assert.match(page, /navigate\("\/checkout"\)/);
  const card = read("src/components/menu-templates/PublicMenuItemCard.jsx");
  assert.match(card, /if \(tapRowOpensSheet\) \{\s*openSheet\(\);\s*return;\s*\}/);
  assert.match(card, /transform: pressed \? "scale\(0\.985\)"/);
  const ctx = read("src/context/OrderCartContext.jsx");
  assert.match(ctx, /item, announce = true \}\) => \{/);
  assert.match(ctx, /if \(announce\) \{/);
});

test("popover: Your cart (N), line stepper + trash, Continue to cart $X", () => {
  const pop = read("src/components/basket/CartAddedPopover.jsx");
  assert.match(pop, /Your cart \(\{itemCount\}\)/);
  assert.match(pop, /Continue to cart \{formatCents\(subtotalCents\)\}/);
  assert.match(pop, /aria-label=\{`Remove \$\{formatMenuItemName\(line\.name\)\}`\}/);
  assert.match(pop, /CART_POPOVER_AUTO_CLOSE_MS = 5000/);
});
