/**
 * Concise public-profile hours: Today + consecutive day-range grouping.
 */
import assert from "node:assert/strict";
import {
  formatFoodTruckHoursTodayHeading,
  formatHoursRows,
  getTodayDayOfWeek,
} from "../src/lib/formatOperatingHours.js";

function hourRow(day, opens, closes, extra = {}) {
  return {
    day_of_week: day,
    opens_at: opens,
    closes_at: closes,
    is_closed: false,
    ...extra,
  };
}

function testInNOutStyleGrouping() {
  const rows = [
    hourRow(0, "10:30", "01:00"),
    hourRow(1, "10:30", "01:00"),
    hourRow(2, "10:30", "01:00"),
    hourRow(3, "10:30", "01:00"),
    hourRow(4, "10:30", "01:00"),
    hourRow(5, "10:30", "01:30"),
    hourRow(6, "10:30", "01:30"),
  ];
  // Wednesday in America/Los_Angeles
  const now = new Date("2026-08-12T18:00:00Z");
  const out = formatHoursRows(rows, { timezone: "America/Los_Angeles", now });
  assert.equal(out[0].day, "Today");
  assert.equal(out[0].text, "10:30 AM – 1:00 AM");
  assert.deepEqual(
    out.slice(1).map((r) => r.day),
    ["Sun – Thu", "Fri – Sat"]
  );
  assert.equal(out[1].text, "10:30 AM – 1:00 AM");
  assert.equal(out[2].text, "10:30 AM – 1:30 AM");
  assert.equal(out.length, 3);
}

function testAllSameWeek() {
  const rows = [0, 1, 2, 3, 4, 5, 6].map((d) => hourRow(d, "09:00", "17:00"));
  const out = formatHoursRows(rows, {
    timezone: "America/Los_Angeles",
    now: new Date("2026-08-12T18:00:00Z"),
  });
  assert.equal(out[0].day, "Today");
  assert.equal(out[1].day, "Sun – Sat");
  assert.equal(out[1].text, "9:00 AM – 5:00 PM");
  assert.equal(out.length, 2);
}

function testClosedDayBreaksRange() {
  const rows = [
    hourRow(0, "11:00", "21:00"),
    hourRow(1, "11:00", "21:00"),
    { day_of_week: 2, is_closed: true },
    hourRow(3, "11:00", "21:00"),
    hourRow(4, "11:00", "21:00"),
    hourRow(5, "11:00", "22:00"),
    hourRow(6, "11:00", "22:00"),
  ];
  const out = formatHoursRows(rows, {
    timezone: "UTC",
    now: new Date("2026-08-11T12:00:00Z"), // Tue
  });
  assert.equal(out[0].day, "Today");
  assert.equal(out[0].text, "Closed");
  assert.deepEqual(
    out.slice(1).map((r) => `${r.day}|${r.text}`),
    [
      "Sun – Mon|11:00 AM – 9:00 PM",
      "Tue|Closed",
      "Wed – Thu|11:00 AM – 9:00 PM",
      "Fri – Sat|11:00 AM – 10:00 PM",
    ]
  );
}

function testOmitTodayLineForFoodTruck() {
  const rows = [0, 1, 2, 3, 4, 5, 6].map((d) => hourRow(d, "09:00", "17:00"));
  const out = formatHoursRows(rows, {
    timezone: "America/Los_Angeles",
    now: new Date("2026-08-12T18:00:00Z"),
    includeTodayLine: false,
  });
  assert.equal(out[0].day, "Sun – Sat");
  assert.equal(out[0].text, "9:00 AM – 5:00 PM");
  assert.equal(out.length, 1);
  assert.ok(!out.some((r) => r.day === "Today"));
}

function testFoodTruckTodayHeadingFormat() {
  // 2026-06-01 18:00 UTC = Monday morning in America/Los_Angeles
  const heading = formatFoodTruckHoursTodayHeading(
    "America/Los_Angeles",
    new Date("2026-06-01T18:00:00Z")
  );
  assert.equal(heading, "Today, Monday, June 1, 2026");
}

function testEmptyAndTodayDow() {
  assert.deepEqual(formatHoursRows([]), []);
  assert.deepEqual(formatHoursRows(null), []);
  const dow = getTodayDayOfWeek("America/Los_Angeles", new Date("2026-08-12T18:00:00Z"));
  assert.equal(dow, 3); // Wednesday
}

function main() {
  testInNOutStyleGrouping();
  testAllSameWeek();
  testClosedDayBreaksRange();
  testOmitTodayLineForFoodTruck();
  testFoodTruckTodayHeadingFormat();
  testEmptyAndTodayDow();
  console.log("formatHoursRowsConciseContract: ok");
}

main();
