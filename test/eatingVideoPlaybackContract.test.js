/**
 * Live-feed pause + clean video play URL contracts (2026-08-25).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import {
  __resetMealVideoPlayDepthForTests,
  getMealVideoPlayDepth,
  notifyMealVideoPlaying,
  notifyMealVideoStopped,
  stripMediaUrlFragment,
} from "../src/lib/menuplyLiveFeedControl.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("stripMediaUrlFragment removes #t= seek hashes", () => {
  assert.equal(
    stripMediaUrlFragment("https://cdn.example/v.mp4#t=0.001"),
    "https://cdn.example/v.mp4"
  );
  assert.equal(stripMediaUrlFragment("blob:abc"), "blob:abc");
  assert.equal(stripMediaUrlFragment(""), "");
});

test("meal play depth avoids A→B resume flicker", () => {
  __resetMealVideoPlayDepthForTests();
  notifyMealVideoPlaying();
  assert.equal(getMealVideoPlayDepth(), 1);
  notifyMealVideoPlaying();
  assert.equal(getMealVideoPlayDepth(), 2);
  notifyMealVideoStopped();
  assert.equal(getMealVideoPlayDepth(), 1);
  notifyMealVideoStopped();
  assert.equal(getMealVideoPlayDepth(), 0);
  __resetMealVideoPlayDepthForTests();
});

test("eatingDishVisual play URL has no #t= seek", () => {
  const dish = read("src/pages/consumer/myMenuply/eatingDishVisual.js");
  assert.match(dish, /stripMediaUrlFragment/);
  assert.doesNotMatch(dish, /withVideoPreviewSeek/);
});

test("VideoStillPreview play path strips fragment; seek only for poster", () => {
  const preview = read("src/components/consumer/VideoStillPreview.jsx");
  assert.match(preview, /stripMediaUrlFragment/);
  assert.match(preview, /withVideoPreviewSeek\(playSrc\)/);
  assert.match(preview, /fallbackPoster/);
  assert.match(preview, /notifyMealVideoPlaying/);
  assert.match(preview, /loadeddata|canplay/);
  assert.doesNotMatch(preview, /Open \/ download|Can't preview this format|Can&apos;t preview this format/);
});

test("eating dish video includes poster fallback (item / logo / billboard)", () => {
  const dish = read("src/pages/consumer/myMenuply/eatingDishVisual.js");
  assert.match(dish, /resolveVideoPosterFallback/);
  assert.match(dish, /posterFallbackUrl/);
  assert.match(dish, /item_photo_url/);
  assert.match(dish, /restaurant_logo_url/);
  assert.match(dish, /billboard/);
  const board = read("src/pages/consumer/myMenuply/WhatIAteMealBoard.jsx");
  assert.match(board, /fallbackPoster=\{media\.posterFallbackUrl/);
});

test("See Who's Eating pauses on meal play and closes fullscreen", () => {
  const surface = read("src/pages/consumer/myMenuply/SeeWhosEatingSurface.jsx");
  assert.match(surface, /MENUPY_PAUSE_LIVE_FEED/);
  assert.match(surface, /MENUPY_CLOSE_LIVE_FEED_FULLSCREEN/);
  assert.match(surface, /stripMediaUrlFragment\(preview\.video_url\)/);
  assert.match(surface, /position:\s*"sticky"/);

  const fullscreen = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(fullscreen, /stripMediaUrlFragment\(item\.video_url\)/);
  assert.match(fullscreen, /MENUPY_CLOSE_LIVE_FEED_FULLSCREEN/);
});

test("Month in Food does not use video_url as img", () => {
  const month = read("src/pages/consumer/monthInFood/buildMonthInFoodModel.js");
  assert.doesNotMatch(month, /photo_url \|\| row\.item_photo_url \|\| row\.video_url/);
  assert.match(month, /mediaUrl\(row\.photo_url \|\| row\.item_photo_url\)/);
});
