/**
 * Frontend Business Organization onboarding contracts.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  PENDING_ORGANIZATION_LEGAL_NAME,
  buildBusinessOrganizationPayload,
  emptyBusinessOrganizationForm,
  organizationToForm,
  validateBusinessOrganizationForm,
} from "../src/lib/businessOrganizationSchema.js";
import {
  NEXT_ROUTE_AFTER_CHECKPOINT,
  ONBOARDING_CHECKPOINT_ORDER,
  resolveNextOnboardingRoute,
  resolveOperatorResumePath,
} from "../src/lib/operatorOnboardingCheckpoints.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("checkpoint order places business_organization before restaurant_information", () => {
  const iOrg = ONBOARDING_CHECKPOINT_ORDER.indexOf("business_organization");
  const iInfo = ONBOARDING_CHECKPOINT_ORDER.indexOf("restaurant_information");
  assert.ok(iOrg >= 0 && iOrg < iInfo);
  assert.equal(
    NEXT_ROUTE_AFTER_CHECKPOINT.email_verified,
    "/restaurant/onboarding/organization"
  );
  assert.equal(
    NEXT_ROUTE_AFTER_CHECKPOINT.business_organization,
    "/restaurant/onboarding/information"
  );
});

test("resume after email routes to organization stage", () => {
  const restaurant = {
    id: 10,
    current_step_key: "business_organization",
    completed_step_keys: ["account_created", "email_verified"],
    has_published_menu: false,
  };
  assert.equal(
    resolveNextOnboardingRoute(restaurant),
    "/restaurant/onboarding/organization"
  );
  assert.equal(
    resolveOperatorResumePath(restaurant, "/operator"),
    "/restaurant/onboarding/organization"
  );
});

test("dashboard cannot bypass missing organization setup", () => {
  const mid = {
    id: 10,
    current_step_key: "restaurant_information",
    completed_step_keys: ["email_verified"],
    has_published_menu: false,
  };
  assert.equal(
    resolveOperatorResumePath(mid, "/operator"),
    "/restaurant/onboarding/organization"
  );
});

test("form validation and payload exclude bank/tax fields", () => {
  const form = {
    ...emptyBusinessOrganizationForm(),
    legal_name: "ABC Food Holdings LLC",
    entity_type: "llc",
    is_sole_proprietor: false,
    country_code: "US",
    billing_email: "finance@abc.example",
    relationship_to_restaurant: "owner",
  };
  const v = validateBusinessOrganizationForm(form);
  assert.equal(v.ok, true);
  const payload = buildBusinessOrganizationPayload(form);
  assert.equal(payload.legal_name, "ABC Food Holdings LLC");
  assert.equal(payload.entity_type, "llc");
  assert.equal(payload.tax_id, undefined);
  assert.equal(payload.bank_account, undefined);
});

test("empty form starts with blank legal_name", () => {
  const form = emptyBusinessOrganizationForm();
  assert.equal(form.legal_name, "");
});

test("organizationToForm blanks unconfirmed legal names", () => {
  const display = "Joe's Pizza";
  assert.equal(
    organizationToForm(
      { legal_name: display, entity_type: "llc", is_provisional: true },
      {},
      { restaurantDisplayName: display }
    ).legal_name,
    ""
  );
  assert.equal(
    organizationToForm(
      {
        legal_name: PENDING_ORGANIZATION_LEGAL_NAME,
        entity_type: "other",
        is_provisional: false,
      },
      {}
    ).legal_name,
    ""
  );
  assert.equal(
    organizationToForm(
      { legal_name: display, entity_type: "llc", is_provisional: false },
      {},
      { restaurantDisplayName: display }
    ).legal_name,
    ""
  );
  assert.equal(
    organizationToForm(
      {
        legal_name: "ABC Food Holdings LLC",
        entity_type: "llc",
        is_provisional: false,
      },
      {},
      { restaurantDisplayName: display }
    ).legal_name,
    "ABC Food Holdings LLC"
  );
});

test("App mounts organization onboarding route", () => {
  const app = read("src/App.jsx");
  assert.match(app, /RestaurantOnboardingOrganization/);
  assert.match(app, /\/restaurant\/onboarding\/organization/);
});

test("organization page does not collect Stripe payout fields", () => {
  const page = read("src/pages/RestaurantOnboardingOrganization.jsx");
  assert.doesNotMatch(page, /tax_id|ssn|bank_account|routing_number|stripe/i);
  assert.match(page, /Legal entity name/);
});

test("organization page legal_name avoids signup autocomplete collision", () => {
  const page = read("src/pages/RestaurantOnboardingOrganization.jsx");
  assert.match(page, /placeholder="e\.g\. Jane Smith, sole proprietor"/);
  assert.match(page, /name="legal_entity_name"/);
  assert.match(page, /autoComplete="off"/);
  assert.doesNotMatch(page, /autoComplete="organization"/);
  assert.match(page, /restaurantDisplayName/);
});

test("organization page resolves onboarding state safely (no blank-screen destructure crash)", () => {
  const page = read("src/pages/RestaurantOnboardingOrganization.jsx");
  assert.doesNotMatch(page, /resolveRestaurantOnboardingState\(\s*\)/);
  assert.match(page, /resolveRestaurantOnboardingState\(\s*\{/);
  assert.match(page, /routeState:\s*location\.state/);
  assert.match(page, /\)\.state/);
});
