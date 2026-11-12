// Plan 34 (2026-11-11): Hours Bot "What to check" + review/undo + check schedule, and the
// platform-owner Sources box in Restaurant Manager → Details.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const page = read("src/pages/owner/OwnerScheduledBot.jsx");
const api = read("src/lib/ownerApi.js");
const sources = read("src/pages/owner/OwnerRestaurantSources.jsx");
const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");

test("Hours Bot page offers every scope, both modes and opt-in Google", () => {
  for (const kind of ["cluster", "city", "zip", "radius", "county", "state", "market", "all"]) {
    assert.match(page, new RegExp(`key: "${kind}"`));
  }
  assert.match(page, /Fill missing/);
  assert.match(page, /Check existing/);
  // Google Places only shown when configured, and off by default.
  assert.match(page, /bot\.google_places_configured \? <GoogleToggle/);
  assert.match(page, /const \[useGoogle, setUseGoogle\] = useState\(false\)/);
  assert.match(page, /runOwnerBotNow\("hours_bot", body\)/);
});

test("Review, Undo and the owner-editable check schedule are wired", () => {
  assert.match(page, /<HoursReviewQueue/);
  assert.match(page, /<HoursUndoList/);
  assert.match(page, /act\(c\.restaurant_id, "apply"\)/);
  assert.match(page, /act\(c\.restaurant_id, "keep"\)/);
  assert.match(page, /act\(c\.restaurant_id, "undo"\)/);
  assert.match(page, /updateHoursBotCheckSchedule/);
  assert.match(api, /\/api\/owner\/bots\/hours_bot\/check-schedule/);
  assert.match(api, /hours_bot\/restaurants\/\$\{encodeURIComponent\(restaurantId\)\}\/\$\{encodeURIComponent\(action\)\}/);
});

test("Sources box lives only in the owner Restaurant Manager", () => {
  assert.match(workspace, /existingRestaurant \? <OwnerRestaurantSources restaurantId=\{restaurant\.id\} \/>/);
  assert.match(api, /\/api\/owner\/bots\/sources\/restaurants\//);
  assert.match(sources, /removeRestaurantSource/);
  assert.match(sources, /addRestaurantSource/);
  // Chain-wide links can't be removed from one restaurant.
  assert.match(sources, /!s\.is_chain \?/);
});

test("Bot page keeps refreshing after a failed fetch while a run is going", () => {
  assert.match(page, /setFailedLoads\(\(n\) => n \+ 1\)/);
  assert.match(page, /\}, \[bot, load, failedLoads\]\);/);
  assert.match(page, /Lost connection to the server — trying again…/);
});
