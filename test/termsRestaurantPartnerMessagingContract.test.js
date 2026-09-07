/**
 * Contract: Terms of Use Restaurant Partner Terms match commission-first messaging.
 * Version must stay in sync with BE src/lib/legalConsent.js TERMS_VERSION.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const legal = fs.readFileSync(path.join(root, "src/content/legal.js"), "utf8");

test("Terms version is terms_of_use_v2026_09_07 with Sep 7 effective date", () => {
  assert.match(legal, /consumerTerms:\s*"terms_of_use_v2026_09_07"/);
  assert.match(legal, /"title": "Menuply Terms of Use"[\s\S]*?"effectiveDate": "September 7, 2026"/);
});

test("Restaurant Partner Terms: commission-first, no $0 subscription plan framing", () => {
  assert.match(
    legal,
    /marketplace commission on transactions generated through Menuply/
  );
  assert.match(
    legal,
    /Participation on Menuply does not require a subscription fee unless the restaurant separately elects a paid option/
  );
  assert.match(
    legal,
    /Applicable commission rates and fees are disclosed in the product experience/
  );
  assert.doesNotMatch(legal, /free or \$0 subscription plans/);
  assert.doesNotMatch(
    legal,
    /disclosed before the applicable subscription fee amount is shown/
  );
  assert.doesNotMatch(legal, /Standard Plan/);
});
