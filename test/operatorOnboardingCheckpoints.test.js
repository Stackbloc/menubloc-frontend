/**
 * Automatic onboarding checkpoint + login resume contract tests.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  isOnboardingComplete,
  resolveNextOnboardingRoute,
  resolveOperatorResumePath,
} from "../src/lib/operatorOnboardingCheckpoints.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("incomplete after account+email+organization+information resumes at Locations", () => {
  const restaurant = {
    id: 10,
    current_step_key: "locations",
    completed_step_keys: [
      "account_created",
      "email_verified",
      "business_organization",
      "restaurant_information",
    ],
    has_published_menu: false,
  };
  assert.equal(resolveNextOnboardingRoute(restaurant), "/restaurant/onboarding/locations");
  assert.equal(resolveOperatorResumePath(restaurant, "/operator"), "/restaurant/onboarding/locations");
});

test("incomplete after locations+payment resumes at public profile / design", () => {
  const restaurant = {
    id: 10,
    current_step_key: "basic_public_profile",
    completed_step_keys: [
      "account_created",
      "email_verified",
      "business_organization",
      "restaurant_information",
      "locations",
      "choose_plan",
      "subscription_checkout",
    ],
    has_published_menu: false,
  };
  assert.equal(resolveNextOnboardingRoute(restaurant), "/restaurant/design-select");
  assert.equal(
    resolveOperatorResumePath(restaurant, "/operator/my-account"),
    "/restaurant/design-select"
  );
});

test("completed onboarding goes to Operator Dashboard", () => {
  const live = {
    id: 10,
    current_step_key: "menu_live",
    completed_step_keys: ["menu_live"],
    has_published_menu: true,
  };
  assert.equal(isOnboardingComplete(live), true);
  assert.equal(resolveOperatorResumePath(live, null), "/operator");
  assert.equal(resolveOperatorResumePath(live, "/operator/deals"), "/operator/deals");
});

test("login cannot bypass unfinished onboarding via preferredNextPath", () => {
  const mid = {
    id: 10,
    current_step_key: "business_organization",
    completed_step_keys: ["email_verified"],
    has_published_menu: false,
  };
  assert.equal(resolveOperatorResumePath(mid, "/operator"), "/restaurant/onboarding/organization");
  assert.equal(
    resolveOperatorResumePath(mid, "/restaurant/onboarding/organization"),
    "/restaurant/onboarding/organization"
  );
});

test("resume from completed_step_keys when current_step_key missing", () => {
  const restaurant = {
    id: 10,
    current_step_key: null,
    completed_step_keys: [
      "create_operator_account",
      "email_verified",
      "business_organization",
      "restaurant_information",
    ],
    has_published_menu: false,
  };
  assert.equal(resolveNextOnboardingRoute(restaurant), "/restaurant/onboarding/locations");
});

test("does not resume to an earlier completed information step when next is locations", () => {
  const restaurant = {
    id: 10,
    current_step_key: "locations",
    completed_step_keys: ["email_verified", "business_organization", "restaurant_information"],
    has_published_menu: false,
  };
  assert.notEqual(resolveNextOnboardingRoute(restaurant), "/restaurant/onboarding/information");
  assert.equal(resolveNextOnboardingRoute(restaurant), "/restaurant/onboarding/locations");
});

test("Restaurant Information UI has Continue only — no Save & Exit Later", () => {
  const page = read("src/pages/RestaurantOnboardingInformation.jsx");
  assert.match(page, /Your progress is saved automatically/);
  assert.match(page, /\{saving \? "Saving…" : "Continue"\}/);
  assert.doesNotMatch(page, /Save & exit later/i);
  assert.doesNotMatch(page, /Save draft/i);
  assert.doesNotMatch(page, /Continue later/i);
  assert.doesNotMatch(page, /Save Progress/i);
});

test("free plan without recorded payment bypass prefers Locations complete path", () => {
  const restaurant = {
    id: 10,
    current_step_key: null,
    completed_step_keys: [
      "account_created",
      "email_verified",
      "business_organization",
      "restaurant_information",
      "locations",
    ],
    selected_plan_code: "verified",
    has_published_menu: false,
    draft_payload: { stage_records: {} },
  };
  assert.equal(resolveNextOnboardingRoute(restaurant), "/restaurant/onboarding/locations");
});

test("free plan with recorded payment bypass skips subscription route", () => {
  const restaurant = {
    id: 10,
    current_step_key: "public_profile_review",
    completed_step_keys: [
      "account_created",
      "email_verified",
      "business_organization",
      "restaurant_information",
      "locations",
      "payment",
    ],
    selected_plan_code: "verified",
    has_published_menu: false,
    draft_payload: {
      stage_records: {
        payment: { status: "skipped", skip_reason: "free_plan" },
      },
    },
  };
  assert.equal(resolveNextOnboardingRoute(restaurant), "/restaurant/design-select");
});

test("OperatorLogin uses automatic resume helper and keeps AuthPageFrame", () => {
  const login = read("src/pages/operator/OperatorLogin.jsx");
  assert.match(login, /resolveOperatorResumePath/);
  assert.match(login, /operatorOnboardingCheckpoints/);
  assert.match(login, /AuthPageFrame/);
  assert.match(login, /styles\.submitButton/);
  assert.doesNotMatch(login, /PageShell/);
  assert.doesNotMatch(login, /background:\s*"#1d4ed8"/);
});
