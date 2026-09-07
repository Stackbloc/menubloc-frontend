/**
 * Contract: Food truck signup bookmarks redirect into unified business signup.
 * Account create stays on RestaurantSignup → POST /owner/profile with food_truck.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("FoodTruckSignup redirects to unified signup kind=food_truck", () => {
  const src = read("src/pages/FoodTruckSignup.jsx");
  assert.match(src, /Navigate/);
  assert.match(src, /\/restaurant\/signup\?kind=food_truck/);
  assert.doesNotMatch(src, /fetch\(/);
  assert.doesNotMatch(src, /Optional paid upgrades/i);
});

test("App route redirects /foodtruck/signup into unified entry", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/foodtruck\/signup"/);
  assert.match(app, /\/restaurant\/signup\?kind=food_truck/);
});

test("Food truck CTAs and onboarding stage use unified entry", () => {
  const trucks = read("src/pages/FoodTrucksPage.jsx");
  const sheet = read("src/components/grubbid/AppMenuSheet.jsx");
  const onboarding = read("src/lib/foodTruckOnboarding.js");
  assert.match(trucks, /\/restaurant\/signup\?kind=food_truck/);
  assert.match(sheet, /\/restaurant\/signup\?kind=food_truck/);
  assert.match(onboarding, /\/restaurant\/signup\?kind=food_truck/);
});

test("Shared account form still posts food_truck owner/profile payload", () => {
  const account = read("src/pages/RestaurantSignup.jsx");
  assert.match(account, /payload\.category\s*=\s*"food_truck"/);
  assert.match(account, /signup_source\s*=\s*"food_truck_signup"/);
  assert.match(account, /FOOD_TRUCK_ANNUAL_PLAN_CODE/);
  assert.match(account, /\/owner\/profile/);
});
