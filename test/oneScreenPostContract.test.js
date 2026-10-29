/**
 * Post = one screen, no steps (Andre 2026-10-28/29), same as the app's Post tab: Record + Upload media,
 * what you're eating (Common Knowledge food types; "Use …" for a new food), where (optional, typed
 * or @home), ⭐ Recommend. No note, Happy hour or I made this. Quick Invite is on My Profile.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const sheet = read("src/components/consumer/feed/QuickPostSheet.jsx");

test("one screen: Upload media, @home, Recommend; no note, other tags or Invite", () => {
  assert.match(sheet, /Upload media/);
  assert.doesNotMatch(sheet, /Choose a clip|How is it|Happy hour|I made this|At home|quick-post-invite/);
  for (const id of ["quick-post-record", "quick-post-upload", "quick-post-food", "quick-post-where", "quick-post-at-home", "quick-post-tag-recommend", "quick-post-submit", "quick-post-tile-photo"]) {
    assert.match(sheet, new RegExp(`data-testid="${id}"`), id);
  }
  assert.match(sheet, />\s*@home\s*</);
  assert.match(sheet, /Post Clip/);
});

test("food is structured: suggested food names or Use …; no type codes in the browser", () => {
  assert.match(sheet, /searchFoodTypes\(q\)/);
  assert.match(sheet, /const canPost = Boolean\(file\) && !busy && Boolean\(food\) && !needsPlace/);
  // Names only: no food type codes, ids or categories leave the server or come back.
  assert.doesNotMatch(sheet, /food_type_code|food_type_id|\.category\b|\.code\b/);
  assert.match(sheet, /new food, we'll review it/);
  assert.match(read("src/lib/foodTypesApi.js"), /\/public\/food-types\?/);
  assert.doesNotMatch(read("src/lib/feedVideoCompose.js"), /food_type/);
});

test("restaurant picks: one option per franchise (brand, no store location)", () => {
  assert.match(sheet, /one_per_franchise: 1/);
  assert.match(read("src/lib/foodActivityApi.js"), /one_per_franchise \}\)/);
});

test("people type the menu item: dishes from any restaurant in the city; Restaurant (optional) label", () => {
  assert.match(sheet, /type: "dish", q, limit: 5, city: locationCity, state: locationState/);
  assert.match(sheet, /placeholder="Restaurant \(optional\)"/);
  assert.doesNotMatch(sheet, /Where\? \(optional\)/);
});

test("Quick Invite sits on My Profile, above My Social Calendar", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.ok(page.indexOf("<QuickInviteCard />") < page.indexOf("<SocialCalendarCard />"));
  const card = read("src/pages/consumer/myMenuply/QuickInviteCard.jsx");
  assert.match(card, /Quick Invite/);
  assert.match(card, /seed_code: code, quick_invite: "1"/);
});
