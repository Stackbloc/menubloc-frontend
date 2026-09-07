import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("Waiter briefing sections + cluster follow; no forbidden UI", () => {
  const page = read("src/pages/FoodInterestsPage.jsx");
  // Spec sections (fixed order, skip-if-null)
  assert.match(page, /Hello \{firstName\}/);
  assert.match(page, /Here&apos;s what&apos;s going on/);
  assert.match(page, /waiter-connect|ConnectSection/);
  assert.match(page, /waiter-join-me|JoinMeSection/);
  assert.match(page, /waiter-private-offer|PrivateOfferSection/);
  assert.match(page, /waiter-meal-options|MealOptionsSection/);
  assert.match(page, /briefing\?\.connect/);
  assert.match(page, /briefing\?\.joinMe/);
  assert.match(page, /briefing\?\.privateOffer/);
  assert.match(page, /briefing\?\.mealOptions/);
  assert.match(page, /WAITER_MEAL_PERIODS/);
  assert.match(page, /\/account\/cluster-subscriptions/);
  assert.match(page, /readDetectedLocation/);
  assert.match(page, /WaiterPublicActivity/);
  assert.doesNotMatch(page, /import\s+.*MarketFallback|<[Mm]arketFallback|CommunityGrowthCard\s*[({]/);
  assert.doesNotMatch(page, /\bbriefing\.cards\b/);
  assert.doesNotMatch(page, /Good morning|Good afternoon|Good evening/);
  // Legacy one-card-per-category path retired with briefing rebuild
  assert.doesNotMatch(page, /\bgroupByType\b/);

  const api = read("src/lib/waiterApi.js");
  assert.match(api, /fetchWaiterBriefing/);
  assert.match(api, /\/api\/waiter\/briefing/);
  assert.doesNotMatch(api, /if \(!city \|\| !state\) return \{ ok: true/);
});
