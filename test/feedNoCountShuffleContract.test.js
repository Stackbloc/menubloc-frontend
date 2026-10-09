/**
 * Feed reels: no video count; random order; no repeat until the whole feed has played.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatVerticalReelNavHint } from "../src/lib/feedVerticalReelNavigationCopy.js";
import { shuffleFeedVideos, wrapEndlessFeedNext } from "../src/lib/shuffleProfileVideos.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("nav hint omits the count when showPosition=false; keeps it by default", () => {
  const base = { index: 2, total: 12, atStart: false, atEnd: false };
  for (const isDesktopViewport of [true, false]) {
    const hidden = formatVerticalReelNavHint({ ...base, isDesktopViewport, showPosition: false });
    assert.doesNotMatch(hidden, /\d+ \/ \d+/);
    assert.doesNotMatch(hidden, /^ · /);
    assert.match(formatVerticalReelNavHint({ ...base, isDesktopViewport }), /^3 \/ 12 · /);
  }
});

test("Feed home and Feed Deals reels hide the count", () => {
  assert.match(
    read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx"),
    /showPosition: variant !== "feedHome"/
  );
  assert.match(read("src/components/consumer/feed/DealVideoSwipe.jsx"), /showPosition: false/);
});

test("endless shuffle: every video plays once before any repeats", () => {
  const ids = Array.from({ length: 9 }, (_, i) => ({ id: `v${i}` }));
  let list = shuffleFeedVideos(ids);
  let index = 0;
  for (let pass = 0; pass < 5; pass += 1) {
    const seen = [list[index].id];
    for (let step = 1; step < ids.length; step += 1) {
      ({ items: list, index } = wrapEndlessFeedNext(list, index));
      seen.push(list[index].id);
    }
    assert.equal(new Set(seen).size, ids.length, `pass ${pass} played each video exactly once`);
    const last = list[index].id;
    ({ items: list, index } = wrapEndlessFeedNext(list, index));
    assert.equal(index, 0);
    assert.notEqual(list[0].id, last, "new pass does not start with the clip just watched");
  }
});

test("Feed Deals shuffles on load and loops via wrapEndlessFeedNext", () => {
  assert.match(
    read("src/pages/consumer/feed/FeedDealsPage.jsx"),
    /setItems\(shuffleFeedVideos\(mapDealsToFeedVideoItems\(data\?\.deals\)\)\)/
  );
  const swipe = read("src/components/consumer/feed/DealVideoSwipe.jsx");
  assert.match(swipe, /wrapEndlessFeedNext\(playlist, index\)/);
  assert.match(swipe, /const atEnd = playlist\.length <= 1;/);
});
