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

test("demo food truck keeps its menu visible and labels ordering as unavailable", () => {
  assert.match(source, /profile\?\.public_ordering_mode === "display_only"/);
  assert.match(source, /Demo profile — ordering unavailable\./);
  assert.match(source, /Checkout and payment are disabled\./);
  assert.match(source, /<MenuInline[\s\S]*menuData=\{menuState\.data\}/);
  assert.match(source, /FoodTruckPublicEditorial/);
});

test("internal demo status is not read by the public food truck page", () => {
  assert.doesNotMatch(source, /\.is_demo/);
});
