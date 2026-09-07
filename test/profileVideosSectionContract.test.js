/**
 * Restaurant profile Videos — initial 3, expandable, portrait tiles, shuffle on load.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { shuffleProfileVideos } from "../src/lib/shuffleProfileVideos.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("ProfileVideosSection caps initial visible + expandable view-all + shuffle", () => {
  const src = read("src/components/restaurant/publicProfile/ProfileVideosSection.jsx");
  assert.match(src, /PROFILE_VIDEOS_INITIAL_VISIBLE\s*=\s*3/);
  assert.match(src, /PROFILE_VIDEOS_FETCH_LIMIT\s*=\s*24/);
  assert.match(src, /profile-videos-view-all/);
  assert.match(src, /aspectRatio:\s*"9 \/ 16"/);
  assert.match(src, /objectFit:\s*"cover"/);
  assert.match(src, /shuffleProfileVideos/);
  assert.match(src, /repeat\(auto-fill/);
  assert.doesNotMatch(src, /maxWidth:\s*280/);
  assert.doesNotMatch(src, /maxHeight:\s*160/);
});

test("shuffleProfileVideos permutes without dropping keys", () => {
  const input = [
    { video_key: "a" },
    { video_key: "b" },
    { video_key: "c" },
    { video_key: "d" },
  ];
  const out = shuffleProfileVideos(input);
  assert.equal(out.length, 4);
  assert.deepEqual(
    [...out.map((v) => v.video_key)].sort(),
    ["a", "b", "c", "d"]
  );
  assert.notEqual(out, input);
});
