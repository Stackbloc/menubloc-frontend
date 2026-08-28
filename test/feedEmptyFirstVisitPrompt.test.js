/**
 * Feed empty first-visit prompt contract.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FEED_EMPTY_FIRST_VISIT_PROMPT_COPY,
  FEED_EMPTY_PROMPT_VIDEO_THRESHOLD,
  hasSeenFeedBefore,
  markFeedFirstVisitSeen,
  shouldShowFeedEmptyFirstVisitPrompt,
} from "../src/lib/feedEmptyFirstVisitPrompt.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

function mockStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
  };
}

test("feed empty prompt: copy + threshold constants", () => {
  assert.match(
    FEED_EMPTY_FIRST_VISIT_PROMPT_COPY,
    /Tap X below to post a video about what you're eating or wanting to eat today/
  );
  assert.equal(FEED_EMPTY_PROMPT_VIDEO_THRESHOLD, 50);
});

test("feed empty prompt: first visit only when empty and under threshold", () => {
  const storage = mockStorage();
  assert.equal(
    shouldShowFeedEmptyFirstVisitPrompt({
      publicVideoCount: 0,
      hasItems: false,
      storage,
    }),
    true
  );
  markFeedFirstVisitSeen(storage);
  assert.equal(hasSeenFeedBefore(storage), true);
  assert.equal(
    shouldShowFeedEmptyFirstVisitPrompt({
      publicVideoCount: 0,
      hasItems: false,
      storage,
    }),
    false
  );
});

test("feed empty prompt: hidden at national threshold and when items exist", () => {
  const storage = mockStorage();
  assert.equal(
    shouldShowFeedEmptyFirstVisitPrompt({
      publicVideoCount: FEED_EMPTY_PROMPT_VIDEO_THRESHOLD,
      hasItems: false,
      storage,
    }),
    false
  );
  assert.equal(
    shouldShowFeedEmptyFirstVisitPrompt({
      publicVideoCount: 0,
      hasItems: true,
      storage,
    }),
    false
  );
});

test("feed empty prompt: wired in Feed home + fullscreen", () => {
  const home = read("src/pages/consumer/feed/FeedHomePage.jsx");
  assert.match(home, /feedEmptyFirstVisitPrompt/);
  assert.match(home, /showEmptyFirstVisitPrompt/);
  assert.match(home, /public_video_count/);

  const fullscreen = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(fullscreen, /showEmptyFirstVisitPrompt/);
  assert.match(fullscreen, /FEED_EMPTY_FIRST_VISIT_PROMPT_COPY/);
  assert.doesNotMatch(fullscreen, /No public food videos yet/);
});
