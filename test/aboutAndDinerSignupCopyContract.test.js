/**
 * About + diner signup positioning copy contracts.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("About Menuply uses food/people identity; no Food Intelligence headline", () => {
  const about = read("src/pages/AboutMenuply.jsx");
  assert.match(about, /Food is social/);
  assert.match(about, /find, explore, share, and experience food together/);
  assert.match(about, /Waiter/);
  assert.match(about, /For Restaurants/);
  assert.match(about, /Share your food/);
  assert.doesNotMatch(about, /Food Intelligence for Everyone/);
  assert.doesNotMatch(about, /information layer|ecosystem architecture|data layer|social layer/i);
  assert.doesNotMatch(about, /One Menu\. Multiplied by Thousands/);
});

test("Diner signup pitch uses new proposition; form/SMS preserved", () => {
  const page = read("src/pages/consumer/DinerSignup.jsx");
  assert.match(page, /Menuply is different\./);
  assert.match(page, /Explore restaurant menus/);
  assert.match(page, /Make plans with your friends/);
  assert.match(page, /Discover\. Plan\. Eat\./);
  assert.match(page, /that sell through\s+Menuply and those that don/);
  assert.doesNotMatch(page, /small fortune|pass those savings/);
  assert.match(page, /type="email"/);
  assert.match(page, /SmsAuthModal/);
  assert.match(page, /requires_phone_verification/);
});
