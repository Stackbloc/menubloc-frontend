/**
 * Contract: public claim → signup/account preserves and locks CK identity.
 *
 * claimPrefillState (restaurant_id + name/city/state) must survive
 * Philosophy → plan entry → account, and account must lock those fields
 * and POST restaurant_id for claim-bind (no duplicate create).
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

test("RestaurantPhilosophy forwards location.state to plan entry", () => {
  const src = read("src/pages/RestaurantPhilosophy.jsx");
  assert.match(src, /useLocation/);
  assert.match(src, /navigate\(PLAN_ROUTE,\s*\{\s*state:\s*location\.state\s*\}\)/);
});

test("RestaurantSignupEntry forwards claim identity keys with selected_plan", () => {
  const src = read("src/pages/RestaurantSignupEntry.jsx");
  assert.match(src, /proceedWithPlanCode/);
  for (const key of [
    "restaurant_id",
    "restaurant_name",
    "city",
    "state",
    "address_line1",
    "postal_code",
    "phone",
    "website_url",
    "claim_source",
    "public_restaurant_slug_or_id",
  ]) {
    assert.match(src, new RegExp(`"${key}"`));
  }
  assert.match(src, /selected_plan:\s*selectedPlan/);
  assert.match(src, /\.\.\.claimIdentity/);
});

test("RestaurantSignup locks name/city/state and posts restaurant_id in claim mode", () => {
  const src = read("src/pages/RestaurantSignup.jsx");
  assert.match(src, /claimRestaurantId/);
  assert.match(src, /isClaimIdentityLocked/);
  assert.match(src, /location\.state\?\.restaurant_name/);
  assert.match(src, /location\.state\?\.city/);
  assert.match(src, /location\.state\?\.state/);
  assert.match(src, /readOnly=\{isClaimIdentityLocked\}/);
  assert.match(src, /inputLocked/);
  assert.match(src, /Protected listing identity/);
  assert.match(src, /payload\.restaurant_id\s*=\s*claimRestaurantId/);
  assert.match(
    src,
    /CLAIM_LOCKED_FIELDS\.has\(name\)/
  );
});
