/**
 * Contract: unified business signup — restaurant / food_truck / franchise
 * share entry + account form. Franchise never creates via /owner/profile.
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

test("Entry exposes three business kinds and passes business_kind state", () => {
  const entry = read("src/pages/RestaurantSignupEntry.jsx");
  assert.match(entry, /business_kind/);
  assert.match(entry, /FOOD_TRUCK_ANNUAL_PLAN_CODE/);
  assert.match(entry, /franchise_review/);
  assert.match(entry, /kind=food_truck|kindFromUrl === "food_truck"/);
  assert.match(entry, /unified-signup-kind-chooser/);
});

test("Account form branches restaurant, food_truck, franchise APIs", () => {
  const account = read("src/pages/RestaurantSignup.jsx");
  assert.match(account, /normalizeBusinessKind/);
  assert.match(account, /submitFranchiseSignup/);
  assert.match(account, /registerOperator/);
  assert.match(account, /\/franchises\/claim/);
  assert.match(account, /payload\.category\s*=\s*"food_truck"/);
  assert.match(account, /signup_source\s*=\s*"food_truck_signup"/);
  assert.match(account, /\/owner\/profile/);
  // Franchise path must not POST owner/profile for create.
  const franchiseFn = account.slice(
    account.indexOf("async function submitFranchiseSignup"),
    account.indexOf("async function submitOwnerProfileSignup")
  );
  assert.ok(franchiseFn.length > 50, "submitFranchiseSignup block present");
  assert.doesNotMatch(franchiseFn, /\/owner\/profile/);
  assert.match(franchiseFn, /\/franchises\/claim/);
  assert.match(franchiseFn, /registerOperator/);
});

test("Franchises directory primary CTA goes to unified franchise signup", () => {
  const page = read("src/pages/FranchisesPage.jsx");
  assert.match(page, /\/restaurant\/signup\?kind=franchise/);
  assert.match(page, /Create account \/ request franchise review/);
});
