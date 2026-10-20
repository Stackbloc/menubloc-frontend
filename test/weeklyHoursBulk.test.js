/**
 * Hours editors: set several days at once + Open 24 hrs (2026-10-20).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { applyHoursToDays, isOpen24, setOpen24, OPEN_24_LABEL } from "../src/lib/weeklyHours.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const week = () => Array.from({ length: 7 }, (_, d) => ({ day_of_week: d, opens_at: "09:00", closes_at: "21:00", is_closed: true, label: null }));

test("Mon–Fri hours in one step; weekend untouched", () => {
  const out = applyHoursToDays(week(), [1, 2, 3, 4, 5], { mode: "hours", opens_at: "11:00", closes_at: "22:00" });
  for (const d of [1, 2, 3, 4, 5]) assert.deepEqual([out[d].is_closed, out[d].opens_at, out[d].closes_at], [false, "11:00", "22:00"]);
  assert.equal(out[0].is_closed, true);
  assert.equal(out[6].is_closed, true);
});

test("Open 24 hrs is 00:00–00:00 with its label; off restores times and drops only that label", () => {
  const out = applyHoursToDays(week(), [0, 6], { mode: "open24" });
  assert.deepEqual([out[6].is_closed, out[6].opens_at, out[6].closes_at, out[6].label], [false, "00:00", "00:00", OPEN_24_LABEL]);
  assert.equal(isOpen24(out[6]), true);
  assert.equal(isOpen24({ ...out[1], is_closed: false }), false);
  const off = setOpen24(out[6], false);
  assert.deepEqual([off.opens_at, off.closes_at, off.label], ["09:00", "21:00", null]);
  assert.equal(setOpen24({ ...out[6], label: "Brunch" }, false).label, "Brunch");
  // Rows loaded from the DB carry seconds.
  assert.equal(isOpen24({ is_closed: false, opens_at: "00:00:00", closes_at: "00:00:00" }), true);
  // Setting regular hours over a 24h day clears the 24h label.
  const back = applyHoursToDays(out, [6], { mode: "hours", opens_at: "10:00", closes_at: "14:00" });
  assert.equal(back[6].label, null);
  assert.equal(isOpen24(back[6]), false);
});

test("Closed in bulk", () => {
  const open = applyHoursToDays(week(), [1, 2], { mode: "hours", opens_at: "09:00", closes_at: "17:00" });
  const out = applyHoursToDays(open, [2], { mode: "closed" });
  assert.equal(out[1].is_closed, false);
  assert.equal(out[2].is_closed, true);
});

test("both hours editors mount the bulk panel and a per-day 24 hrs box", () => {
  const owner = readFileSync(join(root, "src/pages/owner/OwnerProfileManager.jsx"), "utf8");
  const operator = readFileSync(join(root, "src/pages/operator/OperatorHoursEditor.jsx"), "utf8");
  for (const src of [owner, operator]) {
    assert.match(src, /<HoursBulkSet/);
    assert.match(src, /applyHoursToDays\(prev, days, setting\)/);
    assert.match(src, /setOpen24\(/);
  }
  assert.match(owner, /data-testid="owner-hours-24"/);
  assert.match(operator, /data-testid="operator-hours-24"/);
});
