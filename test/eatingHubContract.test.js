/**
 * My Menuply five-section presentation hub — creation via X, not inline forms.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("My Menuply and peer hub use five-section presentation hub", () => {
  const mine = read("src/pages/consumer/MyMenuplyPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const calendar = read("src/pages/consumer/myMenuply/EatingHubCalendar.jsx");
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");

  for (const page of [mine, peer]) {
    assert.match(page, /EatingHubSection/);
  }
  assert.match(section, /data-testid="what-im-eating"/);
  assert.match(section, /NearbyEatingSection/);
  assert.doesNotMatch(section, /SocialFoodInfoSection/);
  assert.doesNotMatch(section, /MealIntelSection/);
  assert.match(section, /data-testid="want-to-eat"/);
  assert.match(section, /data-testid="eating-plans"/);
  assert.ok(
    section.indexOf("<NearbyEatingSection") < section.indexOf('data-testid="want-to-eat"'),
    "Who's Eating before What I Wanna Eat"
  );

  assert.match(section, /data-testid="eating"/);
  assert.match(section, /EatingComposeSheet/);
  assert.doesNotMatch(section, /eating-log-trigger/);
  assert.doesNotMatch(section, /\+ Log/);
  assert.match(section, /Journal day/);
  assert.match(section, /eating-calendar/);
  assert.match(section, /DinerCalendarTrigger/);
  assert.match(section, /dayMarkers/);
  assert.match(section, /eating-ate-panel/);
  assert.match(section, /eating-want-panel/);
  assert.match(section, /eating-plans-panel/);
  assert.match(section, /future-plans-summary/);
  assert.match(section, /None scheduled/);
  assert.doesNotMatch(section, /want-invite-me-out-settings/);
  assert.match(compose, /want-invite-me-out-settings/);
  assert.match(section, /plans-join-me/);
  assert.match(section, /Invite Me Out/);
  assert.match(section, /upcoming-plans-calendar-open/);
  assert.match(peer, /EatingHubSection/);
  assert.match(peer, /readOnly/);
  assert.match(section, /WhatIAteMealBoard/);
  assert.match(section, /WantToEatList/);
  assert.match(section, /SectionEmptyState/);
  assert.doesNotMatch(section, /future-plans-calendar/);
  assert.doesNotMatch(section, /eating-plans-calendar/);
  assert.doesNotMatch(section, /PhotoGrid/);

  const sheet = read("src/pages/consumer/myMenuply/DinerCalendarSheet.jsx");
  assert.match(sheet, /Keep the sheet open so the selected day stays highlighted until Done/);
  const daySelectIdx = sheet.indexOf("onSelectDate={(ymd) => {");
  assert.ok(daySelectIdx > 0, "day cell onSelectDate handler present");
  const daySelectBlock = sheet.slice(daySelectIdx, daySelectIdx + 280);
  assert.match(daySelectBlock, /onSelectDate\(ymd\)/);
  assert.doesNotMatch(daySelectBlock, /onClose\(/);
  assert.match(sheet, /dayEvents/);
  assert.match(sheet, /No plans set/);
  assert.match(sheet, /event\.ymd === selectedDate/);
  assert.match(sheet, /event\.timeLabel/);

  const format = read("src/pages/consumer/myMenuply/dinerHubFormat.js");
  assert.match(format, /formatCalendarPlanLabel/);
  assert.match(format, /futurePlanDetailParts/);
  assert.match(mine, /futurePlanRestaurantName\(plan\)/);
  assert.match(mine, /timeLabel: meal/);
  assert.match(mine, /futurePlanDetailParts/);

  const mealBoard = read("src/pages/consumer/myMenuply/WhatIAteMealBoard.jsx");
  const dishVisual = read("src/pages/consumer/myMenuply/eatingDishVisual.js");
  assert.match(mealBoard, /visibleWhatIAteMealPeriods/);
  assert.match(mealBoard, /groupEntriesByMealPeriod/);
  assert.match(mealBoard, /what-i-ate-meal-sequence/);
  assert.doesNotMatch(mealBoard, /mealRowLabel/);
  assert.match(mealBoard, /mealHolderBadge/);
  assert.match(mealBoard, /what-i-ate-meal-delete/);
  assert.match(mealBoard, /useLongPressReveal|mediaLongPressReveal/);
  assert.doesNotMatch(mealBoard, /prefersHoverReveal|mediaHoverReveal/);
  assert.match(mealBoard, /onDelete/);
  assert.match(section, /onDiaryDelete/);
  assert.match(section, /onWantDelete/);
  assert.match(mealBoard, /resolveEatingDishVisual/);
  assert.match(dishVisual, /video_url/);
  assert.match(dishVisual, /photo_url/);
  assert.match(dishVisual, /item_photo_url/);
  assert.match(dishVisual, /restaurant_billboard_image_url/);
  // Priority order for all diners (mine + peer hubs share this helper).
  {
    const videoIdx = dishVisual.indexOf("if (video)");
    const dinerIdx = dishVisual.indexOf("if (dinerPhoto)");
    const menuIdx = dishVisual.indexOf("if (menuItemPhoto)");
    const logoIdx = dishVisual.indexOf("if (logo)");
    const billboardIdx = dishVisual.indexOf("if (billboard)");
    assert.ok(videoIdx > 0 && dinerIdx > videoIdx);
    assert.ok(menuIdx > dinerIdx && logoIdx > menuIdx && billboardIdx > logoIdx);
  }
  assert.match(mealBoard, /mealHolder/);
  assert.match(mealBoard, /mealHeroCard/);
  assert.match(mealBoard, /what-i-ate-meal-hero/);
  assert.match(mealBoard, /hubDate/);
  assert.match(mealBoard, /isPastDay/);
  assert.match(mealBoard, /No entries/);
  assert.match(mealBoard, /showEmptyHolders = false/);
  assert.doesNotMatch(mealBoard, /Nothing here/);
  assert.doesNotMatch(section, /handleSlotCapture/);
  assert.match(section, /composeMediaSource/);
  assert.match(section, /hubDate=\{hubDate\}/);
  assert.match(section, /kind === "venue_event"/);
  assert.match(mine, /media=library|get\("media"\)/);
  assert.match(mine, /my-events-calendar-open/);
  assert.match(mine, /kind: "venue_event"/);
  assert.match(mine, /openEventsCalendar/);
  assert.match(mine, /venueEventYmd/);
  assert.match(mine, /EventComposeSheet/);
  assert.match(mine, /createDinerSocialEvent/);
  const utils = read("src/pages/consumer/myMenuply/eatingHubUtils.js");
  assert.match(utils, /venueEventYmd/);
  assert.match(utils, /venueEvents/);

  const mealLib = read("src/lib/whatIAteTodayMealPeriod.js");
  assert.match(mealLib, /visibleWhatIAteMealPeriods/);
  assert.match(mealLib, /WHAT_I_ATE_MEAL_PERIOD_START_HOUR/);
  assert.match(mealLib, /empty days show copy, not camera slots/);

  const bits = read("src/pages/consumer/myMenuply/myMenuplyBits.jsx");
  assert.match(bits, /want-to-eat-delete/);
  assert.match(bits, /useLongPressReveal|mediaLongPressReveal/);
  assert.match(bits, /planRowCompact/);
  assert.match(bits, /plan-row-join-me/);
  assert.match(bits, /crew-member-stack/);
  assert.match(bits, /crew-member-name/);
  assert.match(bits, /avatar_url/);
  assert.doesNotMatch(bits, /String\.fromCharCode\(65/);
  assert.doesNotMatch(bits, /crewMemberInitials/);
  assert.match(bits, /onOpenCalendar/);
  assert.match(bits, /Join Me open/);  assert.match(calendar, /past_count/);
  assert.match(calendar, /future_count/);
  assert.match(calendar, /#007AFF/);
  assert.match(calendar, /#34C759/);

  assert.match(compose, /eating-compose-\$\{chip\.id\}/);
  assert.match(compose, /EATING_COMPOSE_CATEGORIES/);
  assert.match(compose, /EatingPlaceFields/);
  assert.match(compose, /homemade/);
  assert.match(compose, /allowPhoto=\{!feedMode\}/);
  assert.match(compose, /allowVideo=\{acceptMedia\}/);
  assert.match(compose, /feedMode/);
  assert.match(bits, /plan-add-video/);
  assert.match(section, /onPlanAddVideo/);
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
  assert.ok(mine.indexOf("<EatingHubSection") < mine.lastIndexOf('data-testid="dining-crews"'));
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
  assert.equal(mod.venueEventYmd({ event_date: "2026-09-01" }), "2026-09-01");
  assert.equal(mod.venueEventYmd({ starts_at: "2026-09-02T18:00:00.000Z" }), "2026-09-02");
  const markers = mod.buildEatingDayMarkersFromCalendar(
    [{ eaten_on: "2026-08-10", entry_count: 2 }],
    [{ plan_date: "2026-08-22" }],
    [{ starts_at: "2026-08-22T19:00:00.000Z", name: "Show" }]
  );
  assert.ok(markers.some((m) => m.ymd === "2026-08-10" && m.past_count >= 1));
  assert.ok(markers.some((m) => m.ymd === "2026-08-22" && m.future_count >= 1));
});
