import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildMenuItemDetailApiQuery } from "../src/lib/menuItemDetailGeoQuery.js";

const DETAIL_PAGE = new URL("../src/pages/MenuItemDetailPage.jsx", import.meta.url);

test("buildMenuItemDetailApiQuery passes city/state when lat/lng absent", () => {
  assert.equal(
    buildMenuItemDetailApiQuery({ city: "Los Angeles", state: "CA" }),
    "?city=Los+Angeles&state=CA"
  );
});

test("buildMenuItemDetailApiQuery includes lat/lng and city/state together", () => {
  const qs = buildMenuItemDetailApiQuery({
    lat: 34.05,
    lng: -118.24,
    city: "Los Angeles",
    state: "CA",
  });
  assert.match(qs, /lat=34\.05/);
  assert.match(qs, /lng=-118\.24/);
  assert.match(qs, /city=Los\+Angeles/);
  assert.match(qs, /state=CA/);
});

test("buildMenuItemDetailApiQuery returns empty when no geo", () => {
  assert.equal(buildMenuItemDetailApiQuery({}), "");
});

test("MenuItemDetailPage Surface forwards data attrs for sticky hero marker", () => {
  const source = fs.readFileSync(DETAIL_PAGE, "utf8");
  assert.match(source, /function Surface\(\{ children, style, \.\.\.rest \}/);
  assert.match(source, /\{\.\.\.rest\}/);
  assert.match(source, /data-menu-item-sticky-hero/);
  assert.match(source, /buildMenuItemDetailApiQuery/);
});
