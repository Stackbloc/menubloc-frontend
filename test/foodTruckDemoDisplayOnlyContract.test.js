import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(currentDir, "..", "src/pages/FoodTruckPage.jsx"),
  "utf8"
);

test("demo food truck keeps ordering labeled unavailable and links to menu via icon", () => {
  assert.match(source, /profile\?\.public_ordering_mode === "display_only"/);
  assert.match(source, /Demo profile — ordering unavailable\./);
  assert.match(source, /Checkout and payment are disabled\./);
  assert.match(source, /FoodTruckPublicEditorial/);
  assert.match(source, /menuHref/);
  assert.doesNotMatch(source, /<MenuInline/);
});

test("food truck profile does not render a standalone Order action chip", () => {
  const actions = fs.readFileSync(
    path.join(currentDir, "..", "src/components/restaurant/publicProfile/ProfilePrimaryActions.jsx"),
    "utf8"
  );
  assert.match(actions, /profileType === "food_truck"/);
  assert.match(actions, /!isFoodTruck && canShowOrderAction/);
});

test("internal demo status is not read by the public food truck page", () => {
  assert.doesNotMatch(source, /\.is_demo/);
});
