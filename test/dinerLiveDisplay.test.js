// Diner Intelligence Stage 3 display helpers.
import test from "node:test";
import assert from "node:assert/strict";
import { compareText, formatDuration, hourLabel, platformList, showNumber, timeAgo } from "../src/pages/owner/diners/liveDisplay.js";

test("durations, hours, platforms", () => {
  assert.equal(formatDuration(null), "—");
  assert.equal(formatDuration(42), "42s");
  assert.equal(formatDuration(75), "1m 15s");
  assert.equal(formatDuration(600), "10m");
  assert.equal(formatDuration(3700), "1h 1m");
  assert.deepEqual([0, 9, 12, 13, 23].map(hourLabel), ["12 AM", "9 AM", "12 PM", "1 PM", "11 PM"]);
  assert.equal(platformList(["ios", "web"]), "iPhone + Web");
  assert.equal(platformList([]), "—");
});

test("missing values never show as 0", () => {
  assert.equal(showNumber(null), "—");
  assert.equal(showNumber(0), "0");
  assert.equal(showNumber(2.25), "2.3");
});

test("time ago", () => {
  const now = Date.parse("2026-11-12T20:00:00Z");
  assert.equal(timeAgo("2026-11-12T19:59:40Z", now), "just now");
  assert.equal(timeAgo("2026-11-12T19:57:00Z", now), "3 min ago");
  assert.equal(timeAgo("2026-11-12T17:00:00Z", now), "3 hr ago");
  assert.equal(timeAgo("2026-11-11T20:00:00Z", now), "1 day ago");
  assert.equal(timeAgo(null, now), "—");
});

test("compare: no earlier data is said plainly, never a fake percentage", () => {
  assert.deepEqual(compareText(5, null), { text: "No earlier data", tone: "none" });
  assert.deepEqual(compareText(5, 3, { hasBefore: false }), { text: "No earlier data", tone: "none" });
  assert.equal(compareText(6, 4).text, "+2 (+50%) vs before (4)");
  assert.equal(compareText(3, 4).tone, "down");
  assert.equal(compareText(4, 4).tone, "flat");
  assert.equal(compareText(3, 0).text, "+3 vs before (0)");
});
