/**
 * Owner Video Catalog — CK-backed restaurant/menu pickers (no manual CK text).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

test("CkRestaurantMenuPicker uses CK place search — no menu-console free text IDs", () => {
  const picker = read("src/components/ck/CkRestaurantMenuPicker.jsx");
  assert.match(picker, /searchReportPlaces/);
  assert.match(picker, /type: "restaurant"/);
  assert.match(picker, /type: "menu_item"/);
  assert.match(picker, /asRestaurantPlace/);
  assert.match(picker, /asDishPlace/);
  assert.match(picker, /do not type restaurant or menu item names manually/i);
  assert.doesNotMatch(picker, /searchMenuConsoleRestaurants/);
  assert.doesNotMatch(picker, /searchMenuConsoleItems/);
});

test("Owner Video Catalog wires CK picker for metadata", () => {
  const page = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(page, /CkRestaurantMenuPicker/);
  assert.match(page, /useCkPlaceFromVideoIds/);
  assert.doesNotMatch(page, /searchMenuConsoleRestaurants/);
  assert.doesNotMatch(page, /searchMenuConsoleItems/);
});
