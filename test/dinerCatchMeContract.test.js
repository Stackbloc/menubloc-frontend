/**
 * Catch Me display + identity placement (no Wanna Eat merge).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatCatchMeRange,
  catchMeEditSummary,
  catchMeProfileLine,
} from "../src/lib/dinerCatchMeDisplay.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

test("Catch Me date formatting matches Atlanta Sept 18–21 examples", () => {
  assert.equal(formatCatchMeRange("2026-09-18", "2026-09-21"), "Sept 18–21");
  assert.equal(
    catchMeEditSummary({
      destination: "Atlanta, GA",
      city_name: "Atlanta",
      state_code: "GA",
      start_date: "2026-09-18",
      end_date: "2026-09-21",
    }),
    "Atlanta, GA · Sept 18–21"
  );
  assert.equal(
    catchMeProfileLine({
      city_name: "Atlanta",
      start_date: "2026-09-18",
      end_date: "2026-09-21",
    }),
    "Catch Me in Atlanta, Sept 18–21"
  );
  assert.equal(catchMeProfileLine(null), null);
});

test("Edit View Catch Me sits under current location with Add/Edit and no food fields", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const panel = read("src/pages/consumer/myMenuply/CatchMePanel.jsx");
  const locIdx = hero.indexOf("📍 {locationLabel}");
  const catchIdx = hero.indexOf("<CatchMePanel");
  assert.ok(locIdx > 0 && catchIdx > locIdx);
  assert.match(panel, /diner-catch-me-editor/);
  assert.match(panel, /searchUsCities/);
  assert.match(panel, /Start date/);
  assert.match(panel, /diner-catch-me-clear/);
  assert.doesNotMatch(panel, /wantToEat|food_name|createWantToEat|Steak/);
  assert.doesNotMatch(hero, /Catch Me in Atlanta · Steak/);
});

test("Profile View Catch Me is identity-only and omitted when empty", () => {
  const hero = read("src/pages/consumer/myMenuply/DinerIdentityHero.jsx");
  const discoverable = read("src/pages/consumer/DiscoverableDinerProfilePage.jsx");
  const activity = read("src/pages/consumer/myMenuply/DinerActivitySelectionLayer.jsx");
  assert.match(hero, /diner-catch-me-profile/);
  assert.match(hero, /catchMeProfileLine\(catchMe\) \?/);
  assert.match(discoverable, /discoverable-catch-me/);
  assert.doesNotMatch(activity, /catch_me|Catch Me/);
});

test("API client and Waiter suggestion use existing Invite to Eat LDL", () => {
  const api = read("src/lib/consumerApi.js");
  const waiter = read("src/pages/FoodInterestsPage.jsx");
  const start = read("src/pages/consumer/InviteToEatStartPage.jsx");
  assert.match(api, /updateCatchMe/);
  assert.match(api, /\/api\/consumer\/profile\/catch-me/);
  assert.match(waiter, /waiter-catch-me-ldl/);
  assert.match(waiter, /seed_code=LDL/);
  assert.doesNotMatch(waiter, /createEatInvitation/);
  assert.match(start, /invitee_name/);
  assert.match(start, /initialInviteeName/);
});
