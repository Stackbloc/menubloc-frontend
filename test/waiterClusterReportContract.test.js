import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("Waiter surfaces subscribed-cluster report without forbidden UI", () => {
  const page = read("src/pages/FoodInterestsPage.jsx");
  assert.match(page, /groupByType/);
  assert.match(page, /WAITER_MEAL_PERIODS/);
  assert.match(page, /briefing\?\.recommendations/);
  assert.match(page, /cluster_report/);
  assert.match(page, /\/account\/cluster-subscriptions/);
  assert.match(page, /Today&apos;s food highlights|Today's food highlights/);
  assert.match(page, /plus updates from/);
  assert.match(page, /Food picks for/);
  assert.match(page, /sortWaiterGroups/);
  assert.match(page, /readDetectedLocation/);
  assert.match(page, /emptyMessage/);
  assert.doesNotMatch(page, /import\s+.*MarketFallback|<[Mm]arketFallback|CommunityGrowthCard\s*[({]/);
  assert.doesNotMatch(page, /\bbriefing\.cards\b/);
  assert.match(page, /briefing\?\.recommendations/);

  const api = read("src/lib/waiterApi.js");
  assert.match(api, /fetchWaiterBriefing/);
  assert.match(api, /\/api\/waiter\/briefing/);
  // Briefing may be fetched without city when signed-in for cluster report
  assert.doesNotMatch(api, /if \(!city \|\| !state\) return \{ ok: true/);
});
