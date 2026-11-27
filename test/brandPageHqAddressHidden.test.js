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

// 2026-11-27 (Andre): the Brand page menu header shows "Franchise HQ: City, ST" — never the street or a maps link.
test("menu header shows only Franchise HQ city/state on the Brand page, no street or directions", () => {
  const display = resolvePublicMenuAddressDisplay(ihopBrand);
  assert.equal(display.addressLine, "Franchise HQ: Glendale, CA");
  assert.equal(display.addressLine1, "Franchise HQ: Glendale, CA");
  assert.equal(display.addressLine2, "");
  assert.equal(display.directionsHref, "");
  assert.doesNotMatch(display.addressLine, /Brand Blvd|91203/);
});

test("Brand page with no city/state shows nothing", () => {
  const display = resolvePublicMenuAddressDisplay({ ...ihopBrand, city: "", state: "" });
  assert.equal(display.addressLine, "");
});

test("menu header passes the address and maps link to every template, compact headers included", () => {
  const src = read("src/pages/PublicMenuPage.jsx");
  assert.doesNotMatch(src, /addressLine: compactMenuHeader \? "" : addressLine/);
  const catalog = read("src/components/menuCatalog/CatalogMenuRenderer.jsx");
  assert.match(catalog, /const directionsHref = addressDisplay\.isBrandHq\s*\?\s*""/);
});

test("regular restaurant menu header still shows its address", () => {
  const display = resolvePublicMenuAddressDisplay({ ...ihopBrand, is_canonical_parent: false });
  assert.equal(display.addressLine1, "450 N Brand Blvd");
  assert.equal(display.addressLine2, "Glendale, CA");
  assert.ok(display.directionsHref.includes("91203"), "ZIP stays in the maps link");
});

// 2026-11-27 (Andre): same format on every menu — street, then "City, ST" alone as the last line.
test("every menu address uses one format: street / City, ST", () => {
  const cases = [
    [{ address: "3096 McClintock Ave", city: "Los Angeles", state: "CA", zip: "90007" }, ["3096 McClintock Ave", "Los Angeles, CA"]],
    [{ address: "644 VETERANS PKWY", city: "Barnesville", state: "GA", zip: "30204" }, ["644 Veterans Pkwy", "Barnesville, GA"]],
    [{ address: "3516 W. 8th St.", city: "Los Angeles", state: "CA" }, ["3516 W 8th St", "Los Angeles, CA"]],
    [{ address: "1200 N MAIN ST STE 4B", city: "Santa Ana", state: "ca" }, ["1200 N Main St Ste 4B", "Santa Ana, CA"]],
    [{ address: "922 Gayley Ave, 90024", city: "Los Angeles", state: "CA" }, ["922 Gayley Ave", "Los Angeles, CA"]],
    [{ address_line: "123 Main St, Pasadena, CA 91101" }, ["123 Main St", "Pasadena, CA"]],
    [{ address: null, city: "Stroudsburg", state: "PA" }, ["", "Stroudsburg, PA"]],
  ];
  for (const [row, [line1, line2]] of cases) {
    const d = resolvePublicMenuAddressDisplay(row);
    assert.equal(d.addressLine1, line1, JSON.stringify(row));
    assert.equal(d.addressLine2, line2, JSON.stringify(row));
  }
});

test("no map pin next to Franchise HQ", () => {
  assert.equal(resolvePublicMenuAddressDisplay(ihopBrand).isBrandHq, true);
  assert.match(read("src/components/menu-templates/GoogleMapsPinIcon.jsx"), /if \(!useContext\(MenuAddressPinContext\)\) return null/);
  assert.match(read("src/pages/PublicMenuPage.jsx"), /<MenuAddressPinContext\.Provider value=\{!isBrandHqAddress\}>/);
  assert.match(read("src/components/menuCatalog/CatalogMenuRenderer.jsx"), /<MenuAddressPinContext\.Provider value=\{!addressDisplay\.isBrandHq\}>/);
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

// 2026-11-27 (Andre): the little Google Maps icon in front of the address, not an underline.
test("every menu address link shows the Google Maps pin", () => {
  const files = [
    "BoldCasual", "Classic", "DarkPremium", "EditorialCasual", "EditorialDark", "EditorialQSR",
    "EditorialSteakhouse", "FamilyDiner", "Fine", "PremiumBistro", "RefinedDark", "RefinedEditorial",
  ].map((n) => `src/components/menu-templates/${n}MenuTemplate.jsx`).concat("src/components/menuCatalog/CatalogDrinksMenuRenderer.jsx");
  for (const f of files) {
    const src = read(f);
    assert.match(src, /<GoogleMapsPinIcon size=\{\d+\} \/>/, f);
    assert.doesNotMatch(src, /📍|<MapPinIcon/, f);
  }
});

// 2026-11-27 (Andre): "the share can go below address" (as in the app).
test("Share menu pill sits under the address on templates with an address", () => {
  const rail = read("src/components/menu-templates/MenuHeaderIconRail.jsx");
  assert.match(rail, /export function MenuHeaderShareBelowAddress\(\)/);
  assert.match(rail, /shareBelowAddress \? null : <ShareMenuPill share=\{share\} \/>/);
  for (const n of ["Classic", "Fine", "EditorialCasual", "EditorialDark", "EditorialQSR", "EditorialSteakhouse", "FamilyDiner", "RefinedDark"]) {
    const src = read(`src/components/menu-templates/${n}MenuTemplate.jsx`);
    assert.match(src, /<MenuHeaderNameWithActions shareBelowAddress/, n);
    assert.ok(src.indexOf("<MenuHeaderShareBelowAddress />") > src.indexOf("<MenuAddressLines"), n);
  }
});
