import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatCityStateZip,
  normalizeDisplayAddress,
} from "../src/lib/displayAddress.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("peels ZIP glued onto street (In-N-Out pattern)", () => {
  const out = normalizeDisplayAddress({
    address_line1: "922 Gayley Ave, 90024",
    city: "Los Angeles",
    state: "CA",
  });
  assert.equal(out.streetAddr, "922 Gayley Ave");
  assert.equal(out.postalCode, "90024");
  assert.equal(out.cityLine, "Los Angeles, CA 90024");
  assert.doesNotMatch(out.streetAddr, /\d{5}/);
});

test("keeps structured street / city / state / zip", () => {
  const out = normalizeDisplayAddress({
    address_line1: "900 Olympic Blvd",
    city: "Los Angeles",
    state: "CA",
    postal_code: "90015",
  });
  assert.equal(out.streetAddr, "900 Olympic Blvd");
  assert.equal(out.cityLine, "Los Angeles, CA 90015");
  assert.equal(formatCityStateZip("Los Angeles", "ca", "90015"), "Los Angeles, CA 90015");
});

test("peels full City, ST ZIP from street blob", () => {
  const out = normalizeDisplayAddress({
    address_line1: "501 East Adams St, Chicago, IL 60661",
  });
  assert.equal(out.streetAddr, "501 East Adams St");
  assert.equal(out.city, "Chicago");
  assert.equal(out.state, "IL");
  assert.equal(out.postalCode, "60661");
  assert.equal(out.cityLine, "Chicago, IL 60661");
});

test("profile surfaces use normalizeDisplayAddress", () => {
  assert.match(read("src/pages/RestaurantPublicPage.jsx"), /normalizeDisplayAddress/);
  assert.match(read("src/pages/FoodTruckPage.jsx"), /normalizeDisplayAddress/);
  assert.match(read("src/pages/FoodTruckPage.jsx"), /Add to Contacts/);
  assert.match(read("src/components/restaurant/publicProfile/ProfileHero.jsx"), /food-truck-home-address/);
  assert.match(
    read("src/components/restaurant/publicProfile/ProfileHero.jsx"),
    /Current Location:[\s\S]*food-truck-home-address|food-truck-home-address[\s\S]*Current Location:/
  );
  assert.match(
    read("src/components/restaurant/publicProfile/ProfileHero.jsx"),
    /streetAddr \? <span>\{streetAddr\}<\/span>/
  );
});
