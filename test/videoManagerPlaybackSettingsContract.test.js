/**
 * Video Manager mute / run window / inactive settings contracts.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Video Manager editor exposes mute active and run window settings", () => {
  const src = read("src/pages/owner/OwnerVideoCuration.jsx");
  assert.match(src, /owner-video-playback-settings/);
  assert.match(src, /owner-video-play-muted/);
  assert.match(src, /owner-video-manager-active/);
  assert.match(src, /owner-video-run-starts/);
  assert.match(src, /owner-video-run-ends/);
  assert.match(src, /play_muted:/);
  assert.match(src, /manager_active:/);
  assert.match(src, /run_starts_at:/);
  assert.match(src, /run_ends_at:/);
});

test("Feed shows No sound. when manager forces mute", () => {
  const feed = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(feed, /isManagerForcedMute/);
  assert.match(feed, /No sound\./);
  const lib = read("src/lib/feedVideoPresentation.js");
  assert.match(lib, /function isManagerForcedMute/);
  assert.match(lib, /play_muted/);
});

test("profile videos honor play_muted No sound label", () => {
  const src = read("src/components/restaurant/publicProfile/ProfileVideosSection.jsx");
  assert.match(src, /profile-video-no-sound/);
  assert.match(src, /No sound\./);
  assert.match(src, /play_muted/);
});
