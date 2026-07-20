/**
 * Automatic onboarding checkpoint + login resume contract tests.
 * Post-locations: upload → worksheet → profile → gate; design deferred last.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  CORE_ONBOARDING_CHECKPOINT_ORDER,
  DEFERRED_ONBOARDING_STAGES,
  getIncompleteFinishSetupSteps,
  isCoreOnboardingComplete,
  isOnboardingComplete,
  resolveNextOnboardingRoute,
  resolveOperatorResumePath,
} from "../src/lib/operatorOnboardingCheckpoints.js";
import {
  isFoodTruckOnboardingComplete,
  resolveFoodTruckOnboardingRoute,
} from "../src/lib/foodTruckOnboarding.js";
import { resolvePostOrganizationPath } from "../src/lib/businessOrganizationSchema.js";
import { resolvePostLocationsPath } from "../src/lib/restaurantInformationSchema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("core order: locations → menu_upload before profile gate; design deferred last", () => {
  const loc = CORE_ONBOARDING_CHECKPOINT_ORDER.indexOf("locations");
  const upload = CORE_ONBOARDING_CHECKPOINT_ORDER.indexOf("menu_upload");
  const ws = CORE_ONBOARDING_CHECKPOINT_ORDER.indexOf("menu_worksheet");
  const menu = CORE_ONBOARDING_CHECKPOINT_ORDER.indexOf("default_menu_ready");
  const profile = CORE_ONBOARDING_CHECKPOINT_ORDER.indexOf("public_profile_edit");
  const gate = CORE_ONBOARDING_CHECKPOINT_ORDER.indexOf("profile_complete_gate");
  assert.ok(loc >= 0 && upload > loc && ws > upload && menu > ws && profile > menu && gate > profile);
  assert.deepEqual([...DEFERRED_ONBOARDING_STAGES], [
    "merchant_onboarding",
    "delivery_onboarding",
    "menu_design",
  ]);
  assert.equal(DEFERRED_ONBOARDING_STAGES[DEFERRED_ONBOARDING_STAGES.length - 1], "menu_design");
});

test("after locations incomplete resume is menu upload — never design-select", () => {
  const restaurant = {
    id: 10,
    current_step_key: "menu_upload",
    completed_step_keys: [
      "account_created",
      "email_verified",
      "business_organization",
      "payment",
      "restaurant_information",
      "locations",
    ],
    has_published_menu: false,
  };
  assert.equal(resolveNextOnboardingRoute(restaurant), "/restaurant/menu-upload-choice");
  assert.notEqual(resolveNextOnboardingRoute(restaurant), "/restaurant/design-select");
});

test("post-locations path is menu-upload-choice", () => {
  assert.equal(resolvePostLocationsPath({ selected_plan: "founders_annual" }), "/restaurant/menu-upload-choice");
  assert.equal(resolvePostLocationsPath({}), "/restaurant/menu-upload-choice");
});

test("core complete with continue_later resumes dashboard — not merchant", () => {
  const restaurant = {
    id: 10,
    current_step_key: "complete",
    completed_step_keys: [
      "account_created",
      "email_verified",
      "business_organization",
      "payment",
      "restaurant_information",
      "locations",
      "menu_upload",
      "menu_worksheet",
      "default_menu_ready",
      "public_profile_edit",
      "profile_complete_gate",
    ],
    draft_payload: {
      stage_records: {
        profile_complete_gate: { status: "skipped", skip_reason: "continue_later" },
      },
    },
    has_published_menu: true,
  };
  assert.equal(isCoreOnboardingComplete(restaurant), true);
  assert.equal(isOnboardingComplete(restaurant), true);
  assert.equal(resolveOperatorResumePath(restaurant, "/operator"), "/operator");
  assert.notEqual(resolveNextOnboardingRoute(restaurant), "/operator/merchant");
  assert.notEqual(resolveNextOnboardingRoute(restaurant), "/restaurant/design-select");
});

test("finish setup lists merchant then delivery then design", () => {
  const steps = getIncompleteFinishSetupSteps({
    completed_step_keys: ["profile_complete_gate"],
    draft_payload: { stage_records: {} },
  });
  assert.deepEqual(
    steps.map((s) => s.id),
    ["merchant_onboarding", "delivery_onboarding", "menu_design"]
  );
});

test("after organization without payment resumes at subscription", () => {
  const restaurant = {
    id: 10,
    current_step_key: "payment",
    completed_step_keys: ["account_created", "email_verified", "business_organization"],
    selected_plan_code: "founders_annual",
    has_published_menu: false,
  };
  assert.equal(resolveNextOnboardingRoute(restaurant), "/restaurant/subscription");
});

test("post-organization path: free → information, paid → subscription", () => {
  assert.equal(
    resolvePostOrganizationPath({ selected_plan_code: "verified" }),
    "/restaurant/onboarding/information"
  );
  assert.equal(
    resolvePostOrganizationPath({ selected_plan: "founders_annual" }),
    "/restaurant/subscription"
  );
});

test("profile-complete page has Continue payments and Continue later", () => {
  const page = read("src/pages/RestaurantOnboardingProfileComplete.jsx");
  assert.match(page, /Continue: set up payments/);
  assert.match(page, /Continue later/);
  assert.match(page, /Your profile is complete on Menuply/);
  assert.match(page, /Your menu can be seen at/);
});

test("worksheet publish navigates to profile onboarding", () => {
  const page = read("src/pages/operator/OperatorMenuWorksheetPage.jsx");
  assert.match(page, /profileEditOnboardingPath/);
  assert.match(page, /default_menu_ready/);
});

test("locations complete never targets design-select in schema helper", () => {
  assert.equal(resolvePostLocationsPath({ post_locations_path: "/restaurant/design-select" }), "/restaurant/menu-upload-choice");
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

test("dashboard includes Finish setup cards wiring", () => {
  const dash = read("src/pages/operator/OperatorDashboard.jsx");
  assert.match(dash, /getIncompleteFinishSetupSteps/);
  assert.match(dash, /Finish setup/);
  assert.match(dash, /Recommended:/);
});

test("food truck onboarding skips worksheet, merchant, and delivery until panel", () => {
  const base = {
    id: 20,
    category: "food_truck",
    restaurant_type: "food_truck",
    selected_plan_code: "food_truck_annual",
    completed_step_keys: [
      "account_created",
      "email_verified",
      "basic_information_complete",
    ],
    draft_payload: {
      stage_records: {
        basic_information_complete: { status: "completed" },
      },
    },
  };

  assert.equal(resolveFoodTruckOnboardingRoute(base), "/restaurant/pdf-upload?food_truck_onboarding=1");
  assert.equal(resolveFoodTruckOnboardingRoute({
    ...base,
    completed_step_keys: [...base.completed_step_keys, "menu_uploaded"],
  }), "/operator/subscription?onboarding=food_truck");
  assert.equal(resolveFoodTruckOnboardingRoute({
    ...base,
    subscription_active: true,
    completed_step_keys: [...base.completed_step_keys, "menu_uploaded", "subscription_active"],
  }), "/foodtruck/onboarding/details?activated=1");
  assert.equal(resolveFoodTruckOnboardingRoute({
    ...base,
    subscription_active: true,
    completed_step_keys: [
      ...base.completed_step_keys,
      "menu_uploaded",
      "subscription_active",
      "onboarding_complete",
    ],
  }), "/foodtruck/onboarding/details");
  assert.equal(isFoodTruckOnboardingComplete({
    ...base,
    subscription_active: true,
    completed_step_keys: [
      ...base.completed_step_keys,
      "menu_uploaded",
      "subscription_active",
      "onboarding_complete",
    ],
  }), false);
  assert.equal(isFoodTruckOnboardingComplete({
    ...base,
    subscription_active: true,
    completed_step_keys: [
      ...base.completed_step_keys,
      "menu_uploaded",
      "subscription_active",
      "detailed_information_complete",
      "onboarding_complete",
    ],
  }), true);
});
