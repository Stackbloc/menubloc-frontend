/**
 * What I Ate Today — optional identity-social profile log.
 * Lookup never blocks posting. Not public /search. Not dining-hall menus.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("What I Ate Today is optional, fail-open, and not a search engine", () => {
  const section = read("src/components/consumer/WhatIAteTodaySection.jsx");
  const calendar = read("src/components/consumer/WhatIAteTodayCalendar.jsx");
  const add = read("src/components/consumer/WhatIAteTodayAddButton.jsx");
  const api = read("src/lib/consumerApi.js");
  const publicApi = read("src/lib/whatIAteTodayApi.js");
  const profileStrip = read("src/components/restaurant/WhatIAteTodayAtRestaurant.jsx");
  const diners = read("src/components/restaurant/WhatDinersAreSaying.jsx");
  const detail = read("src/pages/MenuItemDetailPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  const peerDiary = read("src/pages/consumer/ConnectionPeerWhatIAtePage.jsx");
  const mealLib = read("src/lib/whatIAteTodayMealPeriod.js");
  const app = read("src/App.jsx");
  const page = read("src/pages/consumer/WhatIAteTodayPage.jsx");

  assert.match(section, /WhatIAteTagPicker/);
  assert.match(section, /searchReportPlaces/);
  assert.match(section, /restaurant_id/);
  assert.match(section, /tagged restaurant profiles/);
  assert.match(publicApi, /\/public\/what-i-ate-today\/restaurants/);
  assert.match(profileStrip, /what-i-ate-at-restaurant/);
  assert.match(diners, /WhatIAteTodayAtRestaurant/);
  assert.match(section, /useState\(\(\) => whatIAteTodayLocalDate\(\)\)/);
  assert.match(section, /handleViewMonthChange/);
  assert.match(section, /defaultYmdForViewMonth/);
  assert.match(calendar, /what-i-ate-today-calendar/);
  assert.match(calendar, /defaultYmdForViewMonth/);
  assert.doesNotMatch(calendar, /formatDayHeading/);
  assert.doesNotMatch(calendar, /weekday:\s*"long"/);
  assert.match(section, /what-i-ate-meal-period/);
  assert.match(mealLib, /breakfast/);
  assert.match(mealLib, /late_night/);
  assert.match(api, /listWhatIAteTodayCalendar/);
  assert.match(section, /What I Ate Today/);
  assert.doesNotMatch(section, /sectionTitle\}>What I Ate<\//);
  assert.match(section, /showEmptyMealSlots=\{isPage\}/);
  assert.match(section, /mealEmpty/);
  assert.match(section, /Show my food diary to Connections/);
  assert.match(section, /meal_period/);
  assert.match(section, /createWhatIAteToday/);
  assert.match(section, /QuickCompose/);
  assert.match(section, /what-i-ate-meal-card/);
  assert.match(section, /what-i-ate-meal-heading/);
  assert.match(add, /Add to What I Ate Today/);
  assert.match(add, /\/account\/login\?next=/);
  assert.match(add, /createWhatIAteToday/);
  assert.match(api, /\/api\/consumer\/what-i-ate-today\/calendar/);
  assert.doesNotMatch(api, /what-i-ate-today[\s\S]{0,200}\/search/);
  assert.doesNotMatch(section, /\/search\?/);
  assert.doesNotMatch(add, /navigator\.share/);
  assert.match(detail, /showSaveToMyMenuply/);
  assert.doesNotMatch(detail, /<WhatIAteTodayAddButton/);
  assert.match(detail, /<VerdictBlock[\s\S]*compact/);
  assert.doesNotMatch(detail, /<StickyVerdictRail/);
  assert.match(peer, /\/what-i-ate/);
  assert.match(peerDiary, /mode="viewer"/);
  assert.match(peerDiary, /layout="page"/);
  assert.match(app, /WhatIAteTodayPage/);
  assert.match(page, /What I Ate Today/);
  assert.match(mealLib, /groupEntriesByMealPeriod/);
  assert.match(mealLib, /pickEntryForMeal/);
  assert.match(mealLib, /visibleWhatIAteMealPeriods/);
  assert.match(section, /QuickCompose/);
});

test("visibleWhatIAteMealPeriods hides future empty rows and keeps earlier backfill", async () => {
  const {
    visibleWhatIAteMealPeriods,
  } = await import("../src/lib/whatIAteTodayMealPeriod.js");

  const ids = (opts) => visibleWhatIAteMealPeriods(opts).map((p) => p.id);

  assert.deepEqual(
    ids({
      now: new Date("2026-08-20T09:00:00"),
      hubDateYmd: "2026-08-20",
      todayYmd: "2026-08-20",
    }),
    ["breakfast"]
  );

  assert.deepEqual(
    ids({
      now: new Date("2026-08-20T13:00:00"),
      hubDateYmd: "2026-08-20",
      todayYmd: "2026-08-20",
    }),
    ["breakfast", "lunch"]
  );

  assert.deepEqual(
    ids({
      now: new Date("2026-08-20T13:00:00"),
      hubDateYmd: "2026-08-20",
      todayYmd: "2026-08-20",
      filledPeriodIds: ["dinner"],
    }),
    ["breakfast", "lunch", "dinner"]
  );

  assert.deepEqual(
    ids({
      now: new Date("2026-08-20T13:00:00"),
      hubDateYmd: "2026-08-19",
      todayYmd: "2026-08-20",
    }),
    []
  );

  assert.deepEqual(
    ids({
      now: new Date("2026-08-20T13:00:00"),
      hubDateYmd: "2026-08-19",
      todayYmd: "2026-08-20",
      filledPeriodIds: ["lunch", "dinner"],
    }),
    ["lunch", "dinner"]
  );

  assert.deepEqual(
    ids({
      now: new Date("2026-08-20T13:00:00"),
      hubDateYmd: "2026-08-21",
      todayYmd: "2026-08-20",
      filledPeriodIds: ["lunch"],
    }),
    ["lunch"]
  );

  assert.deepEqual(
    ids({
      now: new Date("2026-08-20T02:00:00"),
      hubDateYmd: "2026-08-20",
      todayYmd: "2026-08-20",
    }),
    ["late_night"]
  );
});
