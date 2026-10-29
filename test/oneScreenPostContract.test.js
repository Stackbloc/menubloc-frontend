/**
 * Post = one screen, no steps (Andre 2026-10-28), same as the app's Post tab: Record + Upload media,
 * food · where (optional, typed or At home) · note, tags ⭐ Recommend · 🍹 Happy hour · 👩‍🍳 I made this,
 * Invite in the header. The Feed's Post button opens it straight away.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const sheet = read("src/components/consumer/feed/QuickPostSheet.jsx");

test("one screen: no numbered steps; Upload media, not Choose a clip", () => {
  assert.match(sheet, /Upload media/);
  assert.doesNotMatch(sheet, /Choose a clip/);
  assert.doesNotMatch(sheet, /Step \d|\d · /);
  for (const id of ["quick-post-record", "quick-post-upload", "quick-post-food", "quick-post-where", "quick-post-at-home", "quick-post-note", "quick-post-submit", "quick-post-invite"]) {
    assert.match(sheet, new RegExp(`data-testid="${id}"`), id);
  }
  assert.match(sheet, /Post Clip/);
  assert.match(sheet, /Public post to Feed/);
});

test("tags replace the post types; Recommend and Happy hour need a place (typed counts)", () => {
  assert.match(sheet, /⭐ Recommend/);
  assert.match(sheet, /🍹 Happy hour/);
  assert.match(sheet, /👩‍🍳 I made this/);
  assert.match(sheet, /const needsPlace = \(recommend \|\| happy\) && !place/);
  assert.match(sheet, /unlistedRestaurantPlace\(typedPlace\)/);
  assert.match(sheet, /HAPPY_HOUR_INTENTS\[0\]\.foodName/);
  assert.match(sheet, /category: "cooking", file, name: typedFood/);
});

test("Feed Post opens the one screen; Invite goes to the invite flow", () => {
  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shell, /setComposeCategory\("post"\)/);
  assert.match(shell, /handlePickQuickInvite\(code\)/);
  assert.match(read("src/components/consumer/feed/FeedVideoComposeOverlay.jsx"), /category === "post" \?/);
  // Recommend with a typed restaurant still marks the dish row.
  assert.match(read("src/lib/feedVideoCompose.js"), /restaurantId \|\| menuItemId \|\| unlistedPlaceName\(restaurant\)/);
});
