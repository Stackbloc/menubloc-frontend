"use strict";

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  localCalendarDay,
  resetPageVisitDedupeForTests,
  shouldRecordPageVisit,
} from "../src/lib/analyticsPageVisitDedupe.js";

test("shouldRecordPageVisit counts a path once per visitor per local day", () => {
  resetPageVisitDedupeForTests();
  const day1 = new Date(2026, 7, 17, 9, 0, 0).getTime();
  const laterSameDay = new Date(2026, 7, 17, 21, 0, 0).getTime();
  const day2 = new Date(2026, 7, 18, 9, 0, 0).getTime();

  assert.equal(localCalendarDay(day1), "2026-08-17");
  assert.equal(shouldRecordPageVisit("vis-1", "/", day1), true);
  assert.equal(shouldRecordPageVisit("vis-1", "/", laterSameDay), false);
  assert.equal(shouldRecordPageVisit("vis-1", "/account", laterSameDay), true);
  assert.equal(shouldRecordPageVisit("vis-1", "/", day2), true);
  assert.equal(shouldRecordPageVisit("vis-2", "/", day1), true);
});
