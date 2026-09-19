/**
 * Restaurant profile Videos redesign — grid tiles, sheet player, exclude plan.
 * Part C: diary/Recent Posts text-only; viewer-aware attribution on BE.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("ProfileVideosSection: tile grid, no inline multi-player cards, See all sheet", () => {
  const src = read("src/components/restaurant/publicProfile/ProfileVideosSection.jsx");
  assert.match(src, /PROFILE_VIDEOS_PREVIEW_LIMIT\s*=\s*6/);
  assert.match(src, /PROFILE_VIDEOS_FETCH_LIMIT\s*=\s*60/);
  assert.match(src, /excludeKinds:\s*\["plan"\]/);
  assert.match(src, /selectPreviewVideos/);
  assert.match(src, /gridTemplateColumns:\s*"repeat\(3/);
  assert.match(src, /gap:\s*8/);
  assert.match(src, /aspectRatio:\s*"9 \/ 14"/);
  assert.match(src, /profile-videos-see-all/);
  assert.match(src, /profile-video-player-sheet/);
  assert.match(src, /role="dialog"/);
  // B9: still-capture is hidden metadata preload; removed once poster drawn
  assert.match(src, /profile-video-tile-still-capture/);
  assert.match(src, /preload="metadata"/);
  assert.match(src, /crossOrigin="anonymous"/);
  assert.match(src, /styles\.hiddenStillVideo/);
  assert.match(src, /STILL_IN_FLIGHT_MAX\s*=\s*6/);
  // B11 sheet sizing
  assert.match(src, /clamp\(130px, 38%, 200px\)/);
  assert.match(src, /min\(70svh, 640px\)/);
  assert.match(src, /objectFit:\s*"contain"/);
  assert.doesNotMatch(src, /PROFILE_VIDEOS_INITIAL_VISIBLE/);
  assert.doesNotMatch(src, /shuffleProfileVideos/);
  assert.doesNotMatch(src, /View all \(/);
});

test("API client supports excludeKinds without requiring it", () => {
  const api = read("src/lib/restaurantProfileVideosApi.js");
  assert.match(api, /excludeKinds/);
  assert.match(api, /exclude_kinds/);
});

test("PublicProfileShell passes restaurantName into Videos section", () => {
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  assert.match(shell, /ProfileVideosSection/);
  assert.match(shell, /restaurantName=\{name/);
});

test("C1: diary + Recent Posts are text-only on restaurant profile", () => {
  const diary = read("src/components/restaurant/WhatIAteTodayAtRestaurant.jsx");
  assert.doesNotMatch(diary, /<video[\s>]/);
  assert.doesNotMatch(diary, /video_url/);
  assert.doesNotMatch(diary, /photo_url/);
  assert.match(diary, /what-i-ate-restaurant-entry/);

  const posts = read("src/components/restaurant/WhatDinersAreSaying.jsx");
  assert.doesNotMatch(posts, /<video[\s>]/);
  assert.doesNotMatch(posts, /activity\.video_url/);
  assert.doesNotMatch(posts, /activity\.photo_url/);
  assert.match(posts, /diners-saying-activity/);
});
