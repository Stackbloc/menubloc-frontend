/**
 * @home on My Menuply is a photo/video grid of home-cooked meals — display only.
 * Capture/upload is bottom-nav X / Feed; cooking videos from Feed appear here.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("@home displays home-cooked meals; no section camera upload", () => {
  const section = read("src/pages/consumer/myMenuply/HomeAtHomeSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  const feedX = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");

  assert.match(section, /data-testid="home-at-home"/);
  assert.match(section, /@home/);
  assert.match(section, /home-at-home-feed-link/);
  assert.match(section, /Feed \(X\)/);
  assert.doesNotMatch(section, /MenuplyMediaPicker/);
  assert.doesNotMatch(section, /home-at-home-picker/);
  assert.doesNotMatch(section, /home-at-home-add/);
  assert.doesNotMatch(section, /titleLeading/);
  assert.doesNotMatch(section, /Photograph a meal/);
  assert.match(section, /video_url/);
  assert.doesNotMatch(section, /createWhatIAteToday/);
  assert.doesNotMatch(section, /FEED_CONTENT_KINDS/);

  assert.match(page, /HomeAtHomeSection/);
  assert.match(page, /deleteHomemadeDish/);
  assert.doesNotMatch(page, /onPhotoFile=\{onHomeAtHomePhoto\}/);
  assert.doesNotMatch(page, /market_discoverable:\s*true/);

  assert.match(peer, /HomeAtHomeSection readOnly/);
  assert.match(peer, /fetchUserHomemadeDishes\(peerId\)/);

  assert.doesNotMatch(feedX, /home-at-home/);
  assert.match(feedX, /FEED_CONTENT_KINDS\.COOKING/);
  assert.match(feedX, /LIVE_FEED_FULL_CATEGORY_LABELS\.cooking/);

  const labels = read("src/lib/liveFeedCategory.js");
  assert.match(labels, /cooking:\s*"What I'm Cooking"/);
});
