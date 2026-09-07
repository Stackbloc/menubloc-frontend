/**
 * Contract: SubscriptionSelect /restaurant/subscription is invitation economics,
 * not a Standard/Pro/Founder's onboarding pitch. FREE_PLAN_CODE preserved.
 * Optional Paid Upgrades UI removed; Stripe checkout wiring kept for intended paid plans.
 * Cold /pricing redirects to invitation signup in App.jsx.
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

test("SubscriptionSelect free path is Menuply invitation, not Standard pitch", () => {
  const src = read("src/pages/SubscriptionSelect.jsx");
  assert.match(src, /FREE_PLAN_CODE/);
  assert.match(src, /choosePublished/);
  assert.match(src, /12% commission\. No subscription fee\./);
  assert.match(src, /Continue with Menuply/);
  assert.match(src, /\[FREE_PLAN_CODE\]:\s*"Menuply"/);
  assert.doesNotMatch(src, /Optional paid upgrades/i);
  assert.doesNotMatch(src, /Show Pro and Founder/);
  assert.doesNotMatch(src, /Choose Standard/);
  assert.doesNotMatch(src, /Select Standard/);
  assert.doesNotMatch(src, /Continue with Standard/);
  assert.doesNotMatch(src, /Built for Better Value/);
  assert.doesNotMatch(src, /PlanComparisonTable/);
  assert.doesNotMatch(src, /title:\s*"Standard"/);
  assert.doesNotMatch(src, /\[FREE_PLAN_CODE\]:\s*"Standard"/);
});

test("Cold /pricing redirects to restaurant signup invitation", () => {
  const src = read("src/App.jsx");
  assert.match(
    src,
    /path="\/pricing"[^>]*element=\{crmHost \? <HostRouteRedirect to="\/crm" \/> : <Navigate to="\/restaurant\/signup" replace \/>\}/
  );
  assert.match(
    src,
    /path="\/restaurant\/subscription"[^>]*element=\{crmHost \? <HostRouteRedirect to="\/crm" \/> : <SubscriptionSelect \/>\}/
  );
});

test("Paid Stripe checkout wiring remains on SubscriptionSelect", () => {
  const src = read("src/pages/SubscriptionSelect.jsx");
  assert.match(src, /buildOwnerStripeCheckoutBody/);
  assert.match(src, /isFreePlanCode\(planCode\)/);
  assert.match(src, /handlePro/);
  assert.match(src, /handleFounder/);
  assert.match(src, /CHECKOUT_PRICE_LABELS\.founders_annual/);
  assert.match(src, /\/owner\/subscription\/checkout-session/);
});
