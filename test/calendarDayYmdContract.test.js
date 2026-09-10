/**
 * Journal calendar-day normalization — UTC DATE vs local timestamp contract.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calendarDayYmd, localDateYmd, planYmd } from "../src/lib/calendarDayYmd.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("calendarDayYmd keeps pure YYYY-MM-DD", () => {
  assert.equal(calendarDayYmd("2026-09-08"), "2026-09-08");
  assert.equal(planYmd("2026-09-08"), "2026-09-08");
});

test("calendarDayYmd keeps PG DATE midnight UTC as calendar day (no LA shift)", () => {
  assert.equal(calendarDayYmd("2026-09-08T00:00:00.000Z"), "2026-09-08");
  assert.equal(calendarDayYmd(new Date(Date.UTC(2026, 8, 8, 0, 0, 0))), "2026-09-08");
});

test("calendarDayYmd uses local day for real timestamps (not UTC slice)", () => {
  // 2026-09-09 03:00 UTC — in US timezones this is still Sep 8 evening.
  const iso = "2026-09-09T03:00:00.000Z";
  const expected = localDateYmd(new Date(iso));
  assert.equal(calendarDayYmd(iso), expected);
  // Naive first-10 slice is the UTC calendar day; local may differ.
  if (expected !== iso.slice(0, 10)) {
    assert.notEqual(calendarDayYmd(iso), iso.slice(0, 10));
  }
});

test("hub helpers import shared calendarDayYmd", () => {
  const utils = read("src/pages/consumer/myMenuply/eatingHubUtils.js");
  assert.match(utils, /from ["'].*calendarDayYmd\.js["']/);
  assert.match(utils, /calendarDayYmd\(row\.eaten_on\)/);
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(hub, /calendarDayYmd/);
  const merge = read("src/lib/eatingFeedMerge.js");
  assert.match(merge, /calendarDayYmd\(row\.eaten_on\)/);
});
