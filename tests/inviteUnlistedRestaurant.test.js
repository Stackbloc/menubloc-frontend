import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { cleanPlaceLocation, unlistedRestaurantPlace, unlistedPlaceName } from "../src/lib/unlistedPlace.js";

// Invite to Eat can name a restaurant that is not on Menuply (Andre 2026-11-07), the way posts can.
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("typed name becomes an unlisted place and goes out as place_name", () => {
  const place = unlistedRestaurantPlace("  Joe's   Tacos ");
  assert.deepEqual(place, { restaurant_id: null, restaurant_name: "Joe's Tacos", unlisted: true });
  assert.equal(unlistedPlaceName(place), "Joe's Tacos");
  assert.equal(unlistedPlaceName({ restaurant_id: 12, restaurant_name: "Real Place" }), null);
});

test("picker offers 'Use what I typed' only when a screen opts in", () => {
  const picker = read("src/components/diningCrews/DiningCrewFoodEntityPicker.jsx");
  assert.match(picker, /allowUnlisted = false/, "Dining Crews keeps today's behavior");
  assert.match(picker, /unlistedRestaurantPlace/);
  assert.match(picker, /invite-restaurant-use-typed/);
  assert.match(read("src/pages/consumer/InviteToEatStartPage.jsx"), /allowUnlisted/);
});

test("start page lets Continue through for a typed place and passes the name, no id", () => {
  const page = read("src/pages/consumer/InviteToEatStartPage.jsx");
  assert.match(page, /disabled=\{!hasPlace\}/);
  assert.match(page, /restaurantId: restaurantId \|\| null/);
  // Listed restaurants still resolve exactly as before.
  assert.match(page, /selected\?\.restaurant_id \|\| selected\?\.id/);
});

test("modal sends restaurant_id for Menuply places, place_name for typed ones", () => {
  const modal = read("src/components/InviteToEatModal.jsx");
  assert.match(modal, /restaurant_id: restaurantId \|\| undefined/);
  assert.match(modal, /place_name: restaurantId \? undefined : unlistedPlaceNameFor\(restaurantName\)/);
  assert.match(modal, /disabled=\{busy \|\| !\(restaurantId \|\| unlistedPlaceNameFor\(restaurantName\)\)\}/);
});

test("typed place location: city/state, optional street, trimmed, blanks → null (mig 0400 limits)", () => {
  assert.deepEqual(cleanPlaceLocation({ city: "  Los   Angeles ", state: "CA", address: "  " }), { city: "Los Angeles", state: "CA", address: null });
  assert.deepEqual(cleanPlaceLocation(null), { city: null, state: null, address: null });
  const long = cleanPlaceLocation({ city: "x".repeat(99), state: "y".repeat(99), address: "z".repeat(300) });
  assert.deepEqual([long.city.length, long.state.length, long.address.length], [80, 40, 200]);
});

test("start page asks where a typed place is; street address stays folded until asked for", () => {
  const page = read("src/pages/consumer/InviteToEatStartPage.jsx");
  assert.match(page, /\{unlistedPlaceName \? \(\s*<UnlistedPlaceLocation/);
  assert.match(page, /placeLocation: restaurantId \? null : cleanPlaceLocation\(placeLocation\)/);
  const box = read("src/components/UnlistedPlaceLocation.jsx");
  assert.match(box, /showStreet \? \(/);
  assert.match(box, /\+ Add street address/);
  assert.match(box, /\(optional\)/);
});

test("modal sends place_city/state/address only for a typed place", () => {
  const modal = read("src/components/InviteToEatModal.jsx");
  for (const f of ["city", "state", "address"]) {
    assert.match(modal, new RegExp(`place_${f}: restaurantId \\? undefined : placeLocation\\?\\.${f} \\|\\| undefined`));
  }
});
