/**
 * Vertical reel navigation copy — desktop arrow keys vs mobile swipe.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  formatVerticalReelCue,
  formatVerticalReelNavHint,
  verticalReelUsesArrowKeyHints,
} from "../src/lib/feedVerticalReelNavigationCopy.js";

test("verticalReelUsesArrowKeyHints: desktop only", () => {
  assert.equal(verticalReelUsesArrowKeyHints(true), true);
  assert.equal(verticalReelUsesArrowKeyHints(false), false);
});

test("formatVerticalReelNavHint: mobile swipe copy", () => {
  assert.match(
    formatVerticalReelNavHint({
      index: 0,
      total: 5,
      atStart: true,
      atEnd: false,
      isDesktopViewport: false,
      modalWithExit: true,
    }),
    /swipe up for next · swipe down or Exit to leave/
  );
  assert.match(
    formatVerticalReelNavHint({
      index: 4,
      total: 5,
      atStart: false,
      atEnd: true,
      isDesktopViewport: false,
    }),
    /swipe down for previous/
  );
});

test("formatVerticalReelNavHint: desktop arrow key copy", () => {
  assert.match(
    formatVerticalReelNavHint({
      index: 0,
      total: 5,
      atStart: true,
      atEnd: false,
      isDesktopViewport: true,
    }),
    /↓ arrow key for next/
  );
  assert.match(
    formatVerticalReelNavHint({
      index: 2,
      total: 5,
      atStart: false,
      atEnd: false,
      isDesktopViewport: true,
    }),
    /↓ arrow key next · ↑ arrow key previous/
  );
});

test("formatVerticalReelCue: swipe vs arrow", () => {
  assert.match(formatVerticalReelCue({ isDesktopViewport: false }), /Swipe up/);
  assert.match(formatVerticalReelCue({ isDesktopViewport: true }), /Arrow key/);
});

console.log("feedVerticalReelNavigationCopy: PASS");
