/**
 * @home on My Menuply is a photo grid of home-cooked meals — not a Feed channel.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("@home photographs home-cooked meals on the diner profile", () => {
  const section = read("src/pages/consumer/myMenuply/HomeAtHomeSection.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const peer = read("src/pages/consumer/ConsumerConnectionPeerPage.jsx");
  const feedX = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");

  assert.match(section, /data-testid="home-at-home"/);
  assert.match(section, /@home/);
  assert.match(section, /allowVideo=\{false\}/);
  assert.match(section, /facingMode="environment"/);
  assert.match(section, /Add your first home-cooked dish/);
  assert.match(section, /Photograph a meal/);
  assert.doesNotMatch(section, /createWhatIAteToday/);
  assert.doesNotMatch(section, /FEED_CONTENT_KINDS/);

  assert.match(page, /HomeAtHomeSection/);
  assert.match(page, /onHomeAtHomePhoto/);
  assert.match(page, /createHomemadeDish/);
  assert.match(page, /uploadHomemadeDishPhoto/);
  assert.match(page, /deleteHomemadeDish/);
  assert.doesNotMatch(page, /market_discoverable:\s*true/);

  assert.match(peer, /HomeAtHomeSection readOnly/);
  assert.match(peer, /fetchUserHomemadeDishes\(peerId\)/);

  assert.doesNotMatch(feedX, /home-at-home/);
  assert.doesNotMatch(feedX, /What I'm Cooking/);
});
