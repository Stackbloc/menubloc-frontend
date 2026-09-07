/**
 * Contract: restaurant signup entry is a Menuply invitation, not a plan pitch.
 * Internal FREE_PLAN_CODE (published_free) is preserved; "Standard" must not
 * appear as customer-facing copy on the entry or account plan label path.
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

test("RestaurantSignupEntry is invitation + Sign Up using FREE_PLAN_CODE", () => {
  const src = read("src/pages/RestaurantSignupEntry.jsx");
  assert.match(src, /FREE_PLAN_CODE/);
  assert.match(src, /proceedToAccount\(businessKind \|\| "restaurant"\)|proceedToAccount\("restaurant"\)/);
  assert.match(src, /Your Menu\. More Ways to Be Discovered\./);
  assert.match(src, /Create and manage your free account\. No subscription fee\./);
  assert.match(src, /Put your menu where the conversation about food is happening\./);
  assert.match(src, /Claim your free profile\. Upload and manage your menu\. Join the community\./);
  assert.match(src, /"Sign Up"/);
  assert.match(src, /to="\/terms"/);
  assert.match(src, /Terms of Use/);
  assert.match(src, /unified-signup-kind-chooser/);
  assert.match(src, /handleChooseKind\("restaurant"\)/);
  assert.match(src, /handleChooseKind\("food_truck"\)/);
  assert.match(src, /handleChooseKind\("franchise"\)/);
  assert.doesNotMatch(src, /12%\s*commission/i);
  assert.doesNotMatch(src, /PlanComparisonTable/);
  assert.doesNotMatch(src, /SIGNUP_PLAN_OPTIONS/);
  assert.doesNotMatch(src, /Select Standard/);
  assert.doesNotMatch(src, /name:\s*"Standard"/);
  assert.doesNotMatch(src, />Standard</);
});

test("RestaurantSignup account focuses on creating Menuply account, not plans", () => {
  const src = read("src/pages/RestaurantSignup.jsx");
  assert.match(src, /Create your Menuply account/);
  assert.match(src, /Get your restaurant on Menuply and start building your presence in the community\./);
  assert.match(src, /return t\("signup\.account\.plan\.standard", "Menuply"\)/);
  assert.doesNotMatch(src, /Choose your subscription/);
  assert.doesNotMatch(src, /Start your Standard subscription/);
  assert.doesNotMatch(src, /Select a pricing plan/);
  assert.doesNotMatch(src, /partnerExpectationTitle/);
});

test("Shared free-tier customer label is Menuply not Standard", () => {
  const helpers = read("src/components/payments/paymentHelpers.js");
  assert.match(helpers, /return "Menuply"/);
  assert.doesNotMatch(helpers, /return "Standard"/);
  const account = read("src/pages/operator/OperatorMyAccount.jsx");
  assert.match(account, /return "Menuply"/);
  assert.doesNotMatch(account, /return "Standard"/);
});

test("Restaurants landing Create Account goes to invitation signup", () => {
  const src = read("src/pages/RestaurantsLandingPage.jsx");
  assert.match(src, /CREATE_ACCOUNT_ROUTE\s*=\s*"\/restaurant\/signup"/);
});

test("English i18n free-plan customer labels say Menuply not Standard", () => {
  const src = read("src/i18n/onboardingOperatorLabels.js");
  assert.match(src, /"signup\.account\.plan\.standard":\s*"Menuply"/);
  assert.match(src, /"signup\.account\.plan\.published_free":\s*"Menuply"/);
  assert.match(src, /"signup\.entry\.invite\.cta":\s*"Sign Up"/);
  assert.match(
    src,
    /"signup\.entry\.invite\.economics":\s*"Create and manage your free account\. No subscription fee\."/
  );
  assert.match(src, /"signup\.entry\.invite\.termsLink":\s*"Terms of Use"/);
  assert.doesNotMatch(src, /"signup\.entry\.invite\.economics":\s*"12% commission/);
});
