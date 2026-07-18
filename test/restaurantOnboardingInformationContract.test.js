/**
 * Contract: Restaurant Information onboarding stage wiring.
 * Ensures new route + shared form + ownership-safe API client exist,
 * and legacy RestaurantProfile anonymous save is not reused.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  buildRestaurantInformationPayload,
  RESTAURANT_INFORMATION_PROTECTED_FIELDS,
  resolvePostInformationPath,
  resolvePostLocationsPath,
  validateRestaurantInformationForm,
} from "../src/lib/restaurantInformationSchema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("App mounts /restaurant/onboarding/information and keeps legacy restaurant-profile", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/restaurant\/onboarding\/information"/);
  assert.match(app, /RestaurantOnboardingInformation/);
  assert.match(app, /path="\/restaurant\/onboarding\/locations"/);
  assert.match(app, /path="\/restaurant-profile\/:id"/);
});

test("operatorApi exposes ownership-safe information endpoints", () => {
  const api = read("src/lib/operatorApi.js");
  assert.match(api, /getOwnedRestaurantInformation/);
  assert.match(api, /updateOwnedRestaurantInformation/);
  assert.match(
    api,
    /export const getOwnedRestaurantInformation = \(rid\) =>\s*get\(`\/operator\/restaurants\/\$\{rid\}\/onboarding\/information`\)/
  );
  assert.match(
    api,
    /export const updateOwnedRestaurantInformation = \(rid, body\) =>\s*patch\(`\/operator\/restaurants\/\$\{rid\}\/onboarding\/information`, body\)/
  );
  assert.doesNotMatch(
    api,
    /updateOwnedRestaurantInformation[\s\S]{0,120}patch\(`\/restaurants\//
  );
});

test("onboarding information page uses PATCH helper and never posts /restaurants", () => {
  const page = read("src/pages/RestaurantOnboardingInformation.jsx");
  assert.match(page, /getOwnedRestaurantInformation/);
  assert.match(page, /updateOwnedRestaurantInformation/);
  assert.match(page, /RestaurantInformationForm/);
  assert.doesNotMatch(page, /fetch\(`\$\{API\}\/restaurants/);
  assert.doesNotMatch(page, /method:\s*"POST"/);
  assert.match(page, /could not find a restaurant|Restaurant not found|pause onboarding/i);
  assert.doesNotMatch(page, /Save & exit later/i);
  assert.doesNotMatch(page, /Save draft/i);
});

test("shared form has no PDF upload or menu processing", () => {
  const form = read("src/components/restaurant/RestaurantInformationForm.jsx");
  assert.doesNotMatch(form, /parse-file|Upload \+ Parse|type="file"|application\/pdf/i);
  assert.match(form, /Private/);
  assert.match(form, /manager_name/);
});

test("signup verify nextPath goes to business organization", () => {
  const signup = read("src/pages/RestaurantSignup.jsx");
  assert.match(signup, /ORGANIZATION_ROUTE/);
  assert.match(signup, /nextPath:\s*ORGANIZATION_ROUTE/);
});

test("email verification default onboarding nextPath is organization", () => {
  const verify = read("src/pages/operator/OperatorEmailVerification.jsx");
  assert.match(verify, /\/restaurant\/onboarding\/organization/);
});

test("schema validates continue requirements and strips to editable payload", () => {
  const incomplete = validateRestaurantInformationForm(
    { restaurant_name: "A", category: "" },
    { complete: true }
  );
  assert.equal(incomplete.ok, false);
  assert.ok(incomplete.missing.includes("category"));

  const payload = buildRestaurantInformationPayload(
    {
      restaurant_name: "Cafe",
      category: "restaurant",
      cuisine: "american",
      manager_name: "Pat",
      phone: "(555) 111-2222",
      website_url: "https://x.test",
      address_line1: "1 Main",
      address_line2: "",
      city: "LA",
      state: "ca",
      postal_code: "90012",
      country_code: "US",
      email: "should-not-send@example.com",
      authoritative_restaurant_id: 999,
    },
    { complete: true }
  );
  assert.equal(payload.complete, true);
  assert.equal(payload.phone, "5551112222");
  assert.equal(payload.email, undefined);
  assert.equal(payload.authoritative_restaurant_id, undefined);
  assert.equal(payload.address_line1, undefined);
  assert.equal(payload.city, undefined);
  assert.equal(payload.state, undefined);
  assert.equal(payload.postal_code, undefined);
  for (const field of RESTAURANT_INFORMATION_PROTECTED_FIELDS) {
    assert.equal(payload[field], undefined);
  }

  const completeOk = validateRestaurantInformationForm(
    {
      restaurant_name: "Cafe",
      category: "restaurant",
      phone: "5551112222",
    },
    { complete: true }
  );
  assert.equal(completeOk.ok, true);
});

test("information form no longer collects address fields", () => {
  const form = read("src/components/restaurant/RestaurantInformationForm.jsx");
  assert.doesNotMatch(form, /Address line 1/);
  assert.doesNotMatch(form, /address_line1/);
  assert.match(form, /Locations/);
});

test("post-information navigation targets locations; locations go to menu upload", () => {
  assert.equal(resolvePostInformationPath({}), "/restaurant/onboarding/locations");
  assert.equal(
    resolvePostLocationsPath({ selected_plan: "verified" }),
    "/restaurant/menu-upload-choice"
  );
  assert.equal(
    resolvePostLocationsPath({ selected_plan: "growth" }),
    "/restaurant/menu-upload-choice"
  );
  assert.equal(
    resolvePostLocationsPath({ post_locations_path: "/restaurant/subscription" }),
    "/restaurant/menu-upload-choice"
  );
});
