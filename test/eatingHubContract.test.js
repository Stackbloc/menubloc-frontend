/**
 * Unified Eating hub — one section, one tap-to-open calendar, past/future markers.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("My Menuply and peer hub use unified Eating section", () => {
  const mine = read("src/pages/consumer/MyMenuplyPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const calendar = read("src/pages/consumer/myMenuply/EatingHubCalendar.jsx");
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");

  for (const page of [mine, peer]) {
    assert.match(page, /EatingHubSection/);
    assert.doesNotMatch(page, /data-testid="what-im-eating"/);
    assert.doesNotMatch(page, /data-testid="want-to-eat"/);
  }

  assert.match(section, /data-testid="eating"/);
  assert.match(section, /EatingComposeSheet/);
  assert.match(section, /eating-log-trigger/);
  assert.match(section, /Journal day/);
  assert.match(section, /eating-calendar/);
  assert.match(section, /DinerCalendarTrigger/);
  assert.match(section, /dayMarkers/);
  assert.match(section, /eating-ate-panel/);
  assert.match(section, /eating-want-panel/);
  assert.match(section, /eating-plans-panel/);
  assert.match(section, /future-plans-summary/);
  assert.match(section, /None scheduled/);
  assert.match(section, /Invite Me/);
  assert.match(section, /upcoming-plans-calendar-open/);
  assert.match(section, /WhatIAteMealBoard/);
  assert.match(section, /what-i-ate-meal-board|WhatIAteMealBoard/);
  assert.doesNotMatch(section, /future-plans-calendar/);
  assert.doesNotMatch(section, /eating-plans-calendar/);
  assert.doesNotMatch(section, /PhotoGrid/);

  const mealBoard = read("src/pages/consumer/myMenuply/WhatIAteMealBoard.jsx");
  assert.match(mealBoard, /visibleWhatIAteMealPeriods/);
  assert.match(mealBoard, /groupEntriesByMealPeriod/);
  assert.match(mealBoard, /what-i-ate-meal-row/);
  assert.match(mealBoard, /video_url/);
  assert.match(mealBoard, /photo_url/);
  assert.match(mealBoard, /onSlotCapture/);
  assert.match(mealBoard, /source="camera"/);
  assert.match(mealBoard, /hubDate/);
  assert.match(section, /handleSlotCapture/);
  assert.match(section, /composeMediaSource/);
  assert.match(section, /\+ Log/);
  assert.match(section, /hubDate=\{hubDate\}/);
  assert.match(mine, /media=library|get\("media"\)/);

  const mealLib = read("src/lib/whatIAteTodayMealPeriod.js");
  assert.match(mealLib, /visibleWhatIAteMealPeriods/);
  assert.match(mealLib, /WHAT_I_ATE_MEAL_PERIOD_START_HOUR/);

  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(bits, /planCardBold/);
  assert.match(bits, /onOpenCalendar/);
  assert.match(bits, /Join Me open/);

  assert.match(calendar, /past_count/);
  assert.match(calendar, /future_count/);
  assert.match(calendar, /#007AFF/);
  assert.match(calendar, /#34C759/);

  assert.match(compose, /eating-compose-\$\{chip\.id\}/);
  assert.match(compose, /EATING_COMPOSE_CATEGORIES/);
  assert.match(compose, /EatingPlaceFields/);
  assert.match(compose, /homemade/);
  assert.match(compose, /allowVideo=\{category === "ate" \|\| category === "want"\}/);
  assert.match(section, /planPrefill/);
  assert.match(mine, /maybeFollowRestaurant/);
  assert.match(mine, /followRestaurant/);
  assert.match(mine, /compose=ate|get\("compose"\)/);
  assert.match(mine, /focus=connects|get\("focus"\)/);

  assert.match(peer, /readOnly/);
  assert.match(mine, /handleEatingCompose/);
  assert.match(mine, /dishPhotoUrl/);
  assert.match(mine, /video_url/);
  assert.ok(mine.indexOf("<DinerIdentityHero") < mine.indexOf("<EatingHubSection"));
  assert.ok(mine.indexOf("<EatingHubSection") < mine.indexOf('data-testid="dining-crews"'));
});

test("Eating journal look-back is 90 days; future plan dates are not capped", async () => {
  const utils = read("src/pages/consumer/myMenuply/eatingHubUtils.js");
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const calendar = read("src/pages/consumer/myMenuply/EatingHubCalendar.jsx");
  assert.match(utils, /EATING_HISTORY_DAYS = 90/);
  assert.doesNotMatch(utils, /EATING_HISTORY_DAYS = 45/);
  assert.match(utils, /Future plans are not capped/);
  assert.match(section, /canGoForward = true/);
  assert.match(section, /lookbackStart/);
  assert.match(calendar, /lookbackStart/);

  const mod = await import("../src/pages/consumer/myMenuply/eatingHubUtils.js");
  assert.equal(mod.EATING_HISTORY_DAYS, 90);
  assert.equal(mod.eatingHistoryStart("2026-08-19"), "2026-05-21");
  assert.equal(mod.clampEatingLookbackDate("2026-04-01", "2026-08-19"), "2026-05-21");
  assert.equal(mod.clampEatingLookbackDate("2026-08-10", "2026-08-19"), "2026-08-10");
  assert.equal(mod.clampEatingLookbackDate("2027-12-01", "2026-08-19"), "2026-08-19");
});
