import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { unlistedRestaurantPlace, unlistedPlaceName } from "../src/lib/unlistedPlace.js";

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
