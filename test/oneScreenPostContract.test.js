/**
 * Post = a quick post, not a form (Andre 2026-10-30), same as the app's Post tab: Record or Upload
 * media first; then the clip, one "What are you eating?" caption (typed text counts, ✓ when enough,
 * chips suggest), 📍 Restaurant · 🏠 Home chips, ⭐ Recommend once a restaurant is set, Post.
 * No warning banners. Quick Invite is on My Profile.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const sheet = read("src/components/consumer/feed/QuickPostSheet.jsx");

test("quick post: clip first, caption, chips; no form rows or warning banners", () => {
  assert.match(sheet, /Upload media/);
  assert.doesNotMatch(sheet, /Choose a clip|How is it|Happy hour|I made this|@home|quick-post-invite|quick-post-missing|Add a clip first|Restaurant \(optional\)/);
  for (const id of ["quick-post-record", "quick-post-upload", "quick-post-food", "quick-post-food-check", "quick-post-where-open", "quick-post-where", "quick-post-at-home", "quick-post-tag-recommend", "quick-post-submit", "quick-post-tile-photo", "quick-post-change-clip", "quick-post-cancel"]) {
    assert.match(sheet, new RegExp(`data-testid="${id}"`), id);
  }
  // Nothing but Record / Upload media until there's a clip.
  assert.match(sheet, /\{!file \? \(\s*\/\/ Step 1: only Record and Upload media\./);
  assert.match(sheet, /placeholder="What food are you eating\?"/);
  // What you typed is always the first chip, in green (Andre 2026-10-30: "lobster").
  assert.match(sheet, /\{ key: "typed", label: typedFood, typed: true, testId: "quick-post-food-typed"/);
  assert.match(sheet, /chipTyped: \{ color: GREEN/);
  // Typing on a phone: small clip, sheet at the top, so the keyboard can't cover the box.
  assert.match(sheet, /const typing = foodFocused \|\| placeFocused/);
  // Cancel throws the draft away (Andre 2026-10-30), on the button, Escape and a tap outside.
  assert.match(sheet, /function cancel\(\) \{[\s\S]*?setFile\(null\);[\s\S]*?onClose\?\.\(\);/);
  assert.equal((sheet.match(/\bcancel\(\);|onClick=\{cancel\}/g) || []).length, 3);
  assert.match(sheet, /🏠 Home/);
  assert.match(sheet, />\s*\{busy \? `Posting…\$\{uploadPercent != null \? ` \$\{uploadPercent\}%` : ""\}` : "Post"\}/);
});

test("what you type counts: exact suggestion, else the typed name; Post with no food jumps to the caption", () => {
  assert.match(sheet, /return \{ kind: "typed", name: typedFood \}/);
  assert.match(sheet, /const canPost = Boolean\(file\) && !busy && Boolean\(food\)/);
  assert.match(sheet, /if \(!food\) \{\s*foodRef\.current\?\.focus\(\);/);
  assert.match(sheet, /isRecommend: Boolean\(recommend && place\)/);
});

test("food is structured: suggested food names or Use …; no type codes in the browser", () => {
  assert.match(sheet, /searchFoodTypes\(q\)/);
  // Names only: no food type codes, ids or categories leave the server or come back.
  assert.doesNotMatch(sheet, /food_type_code|food_type_id|\.category\b|\.code\b/);
  assert.match(sheet, /new, we'll add it/);
  assert.match(read("src/lib/foodTypesApi.js"), /\/public\/food-types\?/);
  assert.doesNotMatch(read("src/lib/feedVideoCompose.js"), /food_type/);
});

test("restaurant picks: one option per franchise (brand, no store location)", () => {
  assert.match(sheet, /one_per_franchise: 1/);
  assert.match(read("src/lib/foodActivityApi.js"), /one_per_franchise \}\)/);
});

test("people type the menu item: dishes from any restaurant in the city", () => {
  assert.match(sheet, /type: "dish", q, limit: 5, city: locationCity, state: locationState/);
  assert.doesNotMatch(sheet, /Where\? \(optional\)/);
});

test("Quick Invite sits on My Profile, below My Social Calendar", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.ok(page.indexOf("<SocialCalendarCard />") < page.indexOf("<QuickInviteCard />"));
  const card = read("src/pages/consumer/myMenuply/QuickInviteCard.jsx");
  assert.match(card, /Quick Invite/);
  assert.match(card, /seed_code: code, quick_invite: "1"/);
});
