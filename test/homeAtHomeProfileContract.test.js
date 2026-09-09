/**
 * @home on My Menuply — photo gallery with + Add → library (no camera).
 * Videos: Multiplier "What's Cooking @home". Connect view: content only.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("@home photo Add via library media picker; no camera", () => {
  const section = read("src/pages/consumer/myMenuply/HomeAtHomeSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  const feedX = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");

  assert.match(section, /data-testid="home-at-home"/);
  assert.match(section, /@home/);
  assert.match(section, /Add photos of your home cooked meals/);
  assert.match(section, /home-at-home-add/);
  assert.match(section, /MenuplyMediaPicker/);
  assert.match(section, /source="library"/);
  assert.match(section, /allowVideo=\{false\}/);
  assert.match(section, /onPhotoFile/);
  assert.doesNotMatch(section, /home-at-home-feed-link/);
  assert.doesNotMatch(section, /Cooking videos you make/);
  assert.doesNotMatch(section, /Make a cooking video/);
  assert.doesNotMatch(section, /source="camera"/);
  assert.doesNotMatch(section, /createWhatIAteToday/);

  assert.match(page, /HomeAtHomeSection/);
  assert.match(page, /onPhotoFile=\{previewAsConnect \? undefined : onHomeAtHomePhoto\}/);
  assert.match(page, /readOnly=\{previewAsConnect\}/);
  assert.match(page, /onHomeAtHomePhoto/);
  assert.match(page, /deleteHomemadeDish/);

  assert.match(peer, /HomeAtHomeSection readOnly/);
  assert.match(peer, /fetchUserHomemadeDishes\(peerId\)/);

  assert.doesNotMatch(feedX, /home-at-home/);
  assert.match(feedX, /FEED_CONTENT_KINDS\.COOKING/);
  assert.match(feedX, /LIVE_FEED_FULL_CATEGORY_LABELS\.cooking/);

  const labels = read("src/lib/liveFeedCategory.js");
  assert.match(labels, /cooking:\s*"What's Cooking @home"/);
});
