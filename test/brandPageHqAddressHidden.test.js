// 2026-10-08 (Andre): a franchise's corporate/HQ address is irrelevant to
// diners. The Brand page (canonical franchise record) must not show it on the
// menu header, the profile page, or search brand cards.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isBrandPageRecord, resolvePublicMenuAddressDisplay } from "../src/lib/displayAddress.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const ihopBrand = {
  restaurant_id: 78970,
  is_canonical_parent: true,
  address: "450 N. Brand Blvd",
  city: "Glendale",
  state: "CA",
  zip: "91203",
};

test("Brand page record is detected only by is_canonical_parent", () => {
  assert.equal(isBrandPageRecord(ihopBrand), true);
  assert.equal(isBrandPageRecord({ ...ihopBrand, is_canonical_parent: false }), false);
  assert.equal(isBrandPageRecord(null), false);
});

test("menu header shows no HQ address or directions on the Brand page", () => {
  const display = resolvePublicMenuAddressDisplay(ihopBrand);
  assert.equal(display.addressLine, "");
  assert.equal(display.addressLine1, "");
  assert.equal(display.addressLine2, "");
  assert.equal(display.directionsHref, "");
});

test("regular restaurant menu header still shows its address", () => {
  const display = resolvePublicMenuAddressDisplay({ ...ihopBrand, is_canonical_parent: false });
  assert.match(display.addressLine, /450 N\. Brand Blvd/);
  assert.ok(display.directionsHref);
});

test("profile page hides HQ address and directions for the Brand page", () => {
  const src = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(src, /const hideHqAddress = isBrandPageRecord\(data\)/);
  assert.match(src, /streetAddr=\{displayStreetAddr\}/);
  assert.match(src, /cityLine=\{displayCityLine\}/);
});

test("search brand card uses the nearest store, never the HQ address", () => {
  const src = read("src/components/SearchResultCard.jsx");
  assert.match(src, /const brandLocationS = isBrandCardS \? brandNearestS \|\| \{\} : null;/);
  assert.match(src, /brandNearestS \? buildGoogleMapsUrl\(brandNearestS\) : null/);
});
