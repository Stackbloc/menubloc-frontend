/**
 * Restaurant profile Videos redesign — grid tiles, sheet player, exclude plan.
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
