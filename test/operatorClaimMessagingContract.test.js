/**
 * Messaging survey slice C: OperatorClaimSearch claim + success framing.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("OperatorClaimSearch success primary navigates to Menu Lab; Claim Profile / Claim your restaurant copy", () => {
  const page = read("src/pages/operator/OperatorClaimSearch.jsx");
  const labels = read("src/i18n/onboardingOperatorLabels.js");

  assert.match(page, /navigate\("\/operator\/menulab",\s*\{\s*replace:\s*true\s*\}\)/);
  assert.match(page, /operator\.claim\.addMenu["'],\s*["']Add your menu["']/);
  assert.match(page, /operator\.claim\.goDashboard["'],\s*["']Explore dashboard["']/);
  assert.match(page, /navigate\("\/operator"\)/);
  assert.match(page, /operator\.claim\.successTitle["'],\s*["']You're on Menuply\.["']/);
  assert.match(
    page,
    /\{name\} is linked\. Next, add or review your menu so diners can discover what you serve\./,
  );
  assert.match(page, /operator\.claim\.claimButton["'],\s*["']Claim Profile["']/);
  assert.match(page, /operator\.claim\.title["'],\s*["']Claim your restaurant["']/);
  assert.match(
    page,
    /Claim your restaurant profile to manage your information, menu, and presence on Menuply\./,
  );

  assert.match(labels, /"operator\.claim\.title":\s*"Claim your restaurant"/);
  assert.match(labels, /"operator\.claim\.claimButton":\s*"Claim Profile"/);
  assert.match(labels, /"operator\.claim\.successTitle":\s*"You're on Menuply\."/);
  assert.match(labels, /"operator\.claim\.addMenu":\s*"Add your menu"/);
  assert.match(labels, /"operator\.claim\.goDashboard":\s*"Explore dashboard"/);
  assert.doesNotMatch(page, /navigate\("\/operator",\s*\{\s*replace:\s*true\s*\}\)/);
});
