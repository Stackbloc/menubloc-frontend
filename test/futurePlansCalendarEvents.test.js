import test from "node:test";
import assert from "node:assert/strict";
import {
  formatFuturePlanRowLabel,
  futurePlanRestaurantName,
} from "../src/pages/consumer/myMenuply/dinerHubFormat.js";

test("future plan rows use Restaurant [date]", () => {
  const label = formatFuturePlanRowLabel({
    restaurant_name: "In-N-Out",
    plan_date: "2026-08-21",
  });
  assert.match(label, /^In-N-Out \[/);
  assert.match(label, /Aug 21\]$/);
});

test("place_label meal prefix is not the restaurant name", () => {
  assert.equal(
    futurePlanRestaurantName({
      place_label: "Dinner · Fixins Soul Kitchen",
    }),
    "Fixins Soul Kitchen"
  );
});
