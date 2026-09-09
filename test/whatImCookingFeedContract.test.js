/**
 * What's Cooking @home — Multiplier video category; profile @home is photos via +.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("What's Cooking @home is Multiplier category; @home photos use + Add", () => {
  const kinds = read("src/lib/feedContentKinds.js");
  const channels = read("src/lib/liveFeedCategory.js");
  const createSheet = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");
  const compose = read("src/lib/feedVideoCompose.js");
  const overlay = read("src/components/consumer/feed/FeedVideoComposeOverlay.jsx");
  const home = read("src/pages/consumer/myMenuply/HomeAtHomeSection.jsx");
  const eating = read("src/pages/consumer/myMenuply/eatingHubUtils.js");

  assert.match(kinds, /COOKING:\s*"cooking"/);
  assert.match(channels, /id: "cooking"/);
  assert.match(channels, /What's Cooking @home/);
  assert.match(channels, /cooking:\s*"What's Cooking @home"/);
  assert.doesNotMatch(channels, /What I'm Cooking/);

  assert.match(createSheet, /FEED_CONTENT_KINDS\.COOKING/);
  const idsBlock = createSheet.slice(
    createSheet.indexOf("FEED_VIDEO_CATEGORY_IDS"),
    createSheet.indexOf("];", createSheet.indexOf("FEED_VIDEO_CATEGORY_IDS")) + 2
  );
  assert.ok(idsBlock.indexOf("REVIEWS") < idsBlock.indexOf("COOKING"));

  assert.match(compose, /postFeedCookingVideo/);
  assert.match(compose, /createHomemadeDish/);
  assert.match(compose, /What's Cooking @home/);
  assert.match(compose, /market_discoverable:\s*true/);
  assert.match(overlay, /postFeedCookingVideo/);
  assert.match(overlay, /What's Cooking @home/);
  assert.match(eating, /id: "cooking"/);
  assert.match(eating, /What's Cooking @home/);
  assert.match(home, /video_url/);
  assert.match(home, /What's Cooking @home/);
  assert.match(home, /home-at-home-add/);
  assert.match(home, /source="library"/);
});
