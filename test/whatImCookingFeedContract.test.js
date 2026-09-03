/**
 * What I'm Cooking — last Post to Feed video category; also lands on profile @home.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("What I'm Cooking is last Post to Feed video and posts to Feed + @home", () => {
  const kinds = read("src/lib/feedContentKinds.js");
  const channels = read("src/lib/liveFeedCategory.js");
  const createSheet = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");
  const compose = read("src/lib/feedVideoCompose.js");
  const overlay = read("src/components/consumer/feed/FeedVideoComposeOverlay.jsx");
  const home = read("src/pages/consumer/myMenuply/HomeAtHomeSection.jsx");
  const eating = read("src/pages/consumer/myMenuply/eatingHubUtils.js");

  assert.match(kinds, /COOKING:\s*"cooking"/);
  assert.match(channels, /id: "cooking"/);
  assert.match(channels, /What I'm Cooking/);

  assert.match(createSheet, /FEED_CONTENT_KINDS\.COOKING/);
  const idsBlock = createSheet.slice(
    createSheet.indexOf("FEED_VIDEO_CATEGORY_IDS"),
    createSheet.indexOf("];", createSheet.indexOf("FEED_VIDEO_CATEGORY_IDS")) + 2
  );
  assert.ok(idsBlock.indexOf("REVIEWS") < idsBlock.indexOf("COOKING"));

  assert.match(compose, /postFeedCookingVideo/);
  assert.match(compose, /createHomemadeDish/);
  assert.match(compose, /market_discoverable:\s*true/);
  assert.match(overlay, /postFeedCookingVideo/);
  assert.match(eating, /id: "cooking"/);
  assert.match(home, /video_url/);
  assert.match(home, /What I'm Cooking/);
});
