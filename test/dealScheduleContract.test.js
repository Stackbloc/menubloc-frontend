/**
 * Deal days + hours (Andre 2026-11-04): labels match the backend, the terms line is built from
 * the owner's choices, and own copy that leaves out the days/hours gets a reminder.
 */
import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import {
  buildDealTermsText,
  dealCopyMissingSchedule,
  dealScheduleProblem,
  formatDealSchedule,
} from "../src/lib/dealSchedule.js";

test("labels match the backend", () => {
  assert.strictEqual(formatDealSchedule({ days: [1, 2, 3, 4, 5], start: "11:00", end: "14:00" }), "Mon–Fri · 11 AM–2 PM");
  assert.strictEqual(formatDealSchedule({ days: [2] }), "Tuesdays");
  assert.strictEqual(formatDealSchedule({ days: [0, 6] }), "Sat & Sun");
  assert.strictEqual(formatDealSchedule({ start: "21:00", end: "02:00" }), "9 PM–2 AM daily");
  assert.strictEqual(formatDealSchedule({ days: [0, 1, 2, 3, 4, 5, 6] }), null);
});

test("terms line from the owner's choices", () => {
  assert.strictEqual(
    buildDealTermsText({
      dealType: "percent_off", value: "20", itemNames: ["Carbonara"],
      days: [1, 2, 3, 4, 5], start: "11:00", end: "14:00", startDate: "2026-11-04", endDate: "2026-12-04",
    }),
    "20% off Carbonara. Mon–Fri · 11 AM–2 PM, Nov 4 – Dec 4."
  );
  assert.strictEqual(
    buildDealTermsText({ dealType: "fixed_price", value: "9", itemNames: ["Tacos"], days: [2], startDate: "2026-11-04", endDate: "2026-11-30" }),
    "Tacos for $9. Tuesdays, Nov 4 – Nov 30."
  );
  assert.strictEqual(
    buildDealTermsText({ dealType: "other", startDate: "2026-11-04", endDate: "2026-11-04" }),
    "Every day, Nov 4."
  );
});

test("reminder when own copy skips the days/hours", () => {
  const schedule = { days: [1, 2, 3, 4, 5], start: "11:00", end: "14:00" };
  assert.deepStrictEqual(dealCopyMissingSchedule("Great pasta deal", schedule), { days: true, hours: true });
  assert.deepStrictEqual(dealCopyMissingSchedule("Weekdays 11am-2pm only", schedule), { days: false, hours: false });
  assert.deepStrictEqual(dealCopyMissingSchedule("Lunch on Mondays", schedule), { days: false, hours: false });
  assert.deepStrictEqual(dealCopyMissingSchedule("Anything", { days: [], start: "", end: "" }), { days: false, hours: false });
});

test("form validation", () => {
  assert.ok(dealScheduleProblem({ start: "11:00", end: "" }));
  assert.ok(dealScheduleProblem({ start: "11:00", end: "11:00" }));
  assert.strictEqual(dealScheduleProblem({ start: "", end: "" }), null);
  assert.strictEqual(dealScheduleProblem({ start: "21:00", end: "02:00" }), null);
});

test("both deal forms send the schedule and use the terms when description is empty", () => {
  for (const file of ["src/pages/owner/OwnerRestaurantDealsPanel.jsx", "src/pages/operator/OperatorDealsEditor.jsx"]) {
    const src = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(src, /<DealScheduleFields/, file);
    assert.match(src, /<DealTermsHelper/, file);
    assert.match(src, /valid_days:/, file);
    assert.match(src, /valid_start_time:/, file);
    assert.match(src, /termsText/, file);
  }
});
