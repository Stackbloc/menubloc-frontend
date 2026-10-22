/**
 * Concise public-profile hours: Today + chronological day-range grouping.
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

function testInNOutStyleGroupingFromWednesday() {
  const rows = [
    hourRow(0, "10:30", "01:00"),
    hourRow(1, "10:30", "01:00"),
    hourRow(2, "10:30", "01:00"),
    hourRow(3, "10:30", "01:00"),
    hourRow(4, "10:30", "01:00"),
    hourRow(5, "10:30", "01:30"),
    hourRow(6, "10:30", "01:30"),
  ];
  // Wednesday in America/Los_Angeles → ranges start Thursday
  const now = new Date("2026-08-12T18:00:00Z");
  const out = formatHoursRows(rows, { timezone: "America/Los_Angeles", now });
  assert.equal(out[0].day, "Today");
  assert.equal(out[0].text, "10:30 AM – 1:00 AM");
  assert.deepEqual(
    out.slice(1).map((r) => `${r.day}|${r.text}`),
    [
      "Thu|10:30 AM – 1:00 AM",
      "Fri – Sat|10:30 AM – 1:30 AM",
      "Sun – Wed|10:30 AM – 1:00 AM",
    ]
  );
  assert.equal(out.length, 4);
}

function testFridayChronologicalCombine() {
  // User example: today Friday → Sat–Sun open, Mon–Tue closed, Wed–Fri open
  const rows = [
    hourRow(0, "10:00", "20:00"), // Sun
    { day_of_week: 1, is_closed: true }, // Mon
    { day_of_week: 2, is_closed: true }, // Tue
    hourRow(3, "10:00", "20:00"), // Wed
    hourRow(4, "10:00", "20:00"), // Thu
    hourRow(5, "10:00", "20:00"), // Fri
    hourRow(6, "10:00", "20:00"), // Sat
  ];
  const out = formatHoursRows(rows, {
    timezone: "UTC",
    now: new Date("2026-08-14T18:00:00Z"), // Friday
    includeTodayLine: false,
  });
  assert.deepEqual(
    out.map((r) => `${r.day}|${r.text}`),
    [
      "Sat – Sun|10:00 AM – 8:00 PM",
      "Mon – Tue|Closed",
      "Wed – Fri|10:00 AM – 8:00 PM",
    ]
  );
}

/** Klaudette-style: must not jump Friday → Sunday (Sun-first week sort regression). */
function testKlaudetteFridayMustListSaturdayNext() {
  const rows = [
    hourRow(0, "13:00", "22:00"), // Sun
    { day_of_week: 1, is_closed: true },
    { day_of_week: 2, is_closed: true },
    hourRow(3, "13:00", "22:00"), // Wed
    hourRow(4, "13:00", "22:00"), // Thu
    hourRow(5, "13:00", "22:00"), // Fri
    hourRow(6, "13:00", "22:00"), // Sat
  ];
  const out = formatHoursRows(rows, {
    timezone: "America/Los_Angeles",
    now: new Date("2026-08-14T21:00:00Z"), // Friday afternoon PT
    includeTodayLine: false,
  });
  assert.equal(out[0].day, "Sat – Sun");
  assert.equal(out[0].text, "1:00 PM – 10:00 PM");
  assert.equal(out[1].day, "Mon – Tue");
  assert.equal(out[1].text, "Closed");
  assert.equal(out[2].day, "Wed – Fri");
  assert.equal(out[2].text, "1:00 PM – 10:00 PM");
  assert.ok(!out.some((r) => r.day === "Sun" || r.day === "Wed – Sat"));
}

function testAllSameWeek() {
  const rows = [0, 1, 2, 3, 4, 5, 6].map((d) => hourRow(d, "09:00", "17:00"));
  const out = formatHoursRows(rows, {
    timezone: "America/Los_Angeles",
    now: new Date("2026-08-12T18:00:00Z"), // Wed → Thu–Wed
  });
  assert.equal(out[0].day, "Today");
  assert.equal(out[1].day, "Thu – Wed");
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
    now: new Date("2026-08-11T12:00:00Z"), // Tue → start Wed
  });
  assert.equal(out[0].day, "Today");
  assert.equal(out[0].text, "Closed");
  assert.deepEqual(
    out.slice(1).map((r) => `${r.day}|${r.text}`),
    [
      "Wed – Thu|11:00 AM – 9:00 PM",
      "Fri – Sat|11:00 AM – 10:00 PM",
      "Sun – Mon|11:00 AM – 9:00 PM",
      "Tue|Closed",
    ]
  );
}

function testOmitTodayLineForFoodTruck() {
  const rows = [0, 1, 2, 3, 4, 5, 6].map((d) => hourRow(d, "09:00", "17:00"));
  const out = formatHoursRows(rows, {
    timezone: "America/Los_Angeles",
    now: new Date("2026-08-12T18:00:00Z"), // Wed
    includeTodayLine: false,
  });
  assert.equal(out[0].day, "Thu – Wed");
  assert.equal(out[0].text, "9:00 AM – 5:00 PM");
  assert.equal(out.length, 1);
  assert.ok(!out.some((r) => r.day === "Today"));
}

function testFoodTruckTodayHeadingFormat() {
  const heading = formatFoodTruckHoursTodayHeading(
    "America/Los_Angeles",
    new Date("2026-06-01T18:00:00Z")
  );
  assert.equal(heading, "Monday, June 1");
  assert.ok(!heading.startsWith("Today"));
}

function testEmptyAndTodayDow() {
  assert.deepEqual(formatHoursRows([]), []);
  assert.deepEqual(formatHoursRows(null), []);
  const dow = getTodayDayOfWeek("America/Los_Angeles", new Date("2026-08-12T18:00:00Z"));
  assert.equal(dow, 3); // Wednesday
}

function main() {
  testInNOutStyleGroupingFromWednesday();
  testFridayChronologicalCombine();
  testKlaudetteFridayMustListSaturdayNext();
  testAllSameWeek();
  testClosedDayBreaksRange();
  testOmitTodayLineForFoodTruck();
  testFoodTruckTodayHeadingFormat();
  testEmptyAndTodayDow();
  console.log("formatHoursRowsConciseContract: ok");
}

main();

// 2026-10-21: typical weekly hours for profile heroes — Mon → Sun, merged, short times, no dates.
{
  const { formatWeeklyHoursRows } = await import("../src/lib/formatOperatingHours.js");
  const week = [1, 2, 3, 4, 5].map((d) => ({ day_of_week: d, opens_at: "11:00", closes_at: "21:00" }));
  week.push({ day_of_week: 6, opens_at: "10:00", closes_at: "22:30" });
  week.push({ day_of_week: 0, is_closed: true });
  const wed = new Date("2026-10-21T19:00:00Z");
  const rows = formatWeeklyHoursRows(week, { timezone: "America/Los_Angeles", now: wed });
  assert.deepEqual(
    rows.map((r) => [r.day, r.text, r.isToday]),
    [
      ["Mon – Fri", "11 AM – 9 PM", true],
      ["Sat", "10 AM – 10:30 PM", false],
      ["Sun", "Closed", false],
    ]
  );
  assert.deepEqual(formatWeeklyHoursRows([]), []);
  console.log("formatWeeklyHoursRows: ok");
}
