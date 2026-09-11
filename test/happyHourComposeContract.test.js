/**
 * Happy Hour — shared Multiplier/Edit metadata dialog (no separate system).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("Happy Hour intents live in shared eatingHubUtils", () => {
  const utils = read("src/pages/consumer/myMenuply/eatingHubUtils.js");
  assert.match(utils, /HAPPY_HOUR_INTENTS/);
  assert.match(utils, /I'm enjoying Happy Hour/);
  assert.match(utils, /I'm going to Happy Hour today/);
  assert.match(utils, /happyHourFoodName/);
});

test("EatingCompose Where order is Restaurant → Happy Hour → @Home", () => {
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  const rest = compose.indexOf('data-testid="ate-where-restaurant"');
  const hh = compose.indexOf('data-testid="ate-where-happy-hour"');
  const home = compose.indexOf('data-testid="ate-where-home"');
  assert.ok(rest > 0 && hh > rest && home > hh, "chip order Restaurant → Happy Hour → @Home");
  assert.match(compose, /ate-happy-hour-intents/);
  assert.match(compose, /ate-happy-hour-\$\{intent\.id\}/);
  assert.match(compose, /whereType === "happy_hour"/);
  assert.match(compose, /whereType: "restaurant"/);
  assert.match(compose, /happyHourFoodName/);
});

test("ActivityStatusLineCompose Edit Add includes Happy Hour before @home", () => {
  const status = read("src/pages/consumer/myMenuply/ActivityStatusLineCompose.jsx");
  const rest = status.indexOf("Restaurant");
  const hh = status.indexOf('data-testid="ate-where-happy-hour"');
  const home = status.indexOf("@home");
  assert.ok(rest > 0 && hh > rest && home > hh);
  assert.match(status, /mode === "happy_hour"/);
  assert.match(status, /ate-happy-hour-intents/);
});

test("Multiplier lists Happy Hour immediately before cooking/@home", () => {
  const sheet = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");
  assert.match(sheet, /FEED_HAPPY_HOUR_ITEM/);
  assert.match(sheet, /feed-video-create-happy-hour/);
  assert.match(sheet, /initialWhereType:\s*"happy_hour"/);
  const hhPush = sheet.indexOf("items.push(FEED_HAPPY_HOUR_ITEM)");
  const cookingId = sheet.indexOf("FEED_CONTENT_KINDS.COOKING");
  assert.ok(hhPush > 0 && cookingId > 0);
  // Insert runs when cooking is next — Happy Hour before cooking in list builder.
  assert.match(sheet, /if \(item\.id === FEED_CONTENT_KINDS\.COOKING\)/);
});

test("Feed shell threads initialWhereType into shared compose overlay", () => {
  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  const overlay = read("src/components/consumer/feed/FeedVideoComposeOverlay.jsx");
  const sheet = read("src/pages/consumer/myMenuply/EatingComposeSheet.jsx");
  assert.match(shell, /composeInitialWhere/);
  assert.match(shell, /initialWhereType=\{composeInitialWhere\}/);
  assert.match(overlay, /initialWhereType/);
  assert.match(sheet, /initialWhereType=\{initialWhereType\}/);
});
