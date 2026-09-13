import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mapWelcomeCuisineLabels } from "../src/lib/dinerFavoriteFoods.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("Welcome cuisine chips map onto existing favorite_foods keys", () => {
  const korean = mapWelcomeCuisineLabels(["Korean"]);
  assert.deepEqual(korean, [{ kind: "cuisine", key: "korean", label: "Korean" }]);
  const mexican = mapWelcomeCuisineLabels(["Mexican"]);
  assert.deepEqual(mexican, [{ kind: "cuisine", key: "mexican", label: "Mexican" }]);
  const skipped = mapWelcomeCuisineLabels(["Vegan", "Vegetarian"]);
  assert.deepEqual(skipped, []);
});

test("AccountWelcome and Waiter briefing persist/read favorite cuisines", () => {
  const welcome = readFileSync(join(root, "src/pages/consumer/AccountWelcome.jsx"), "utf8");
  assert.match(welcome, /mapWelcomeCuisineLabels\(selectedCuisines\)/);
  assert.match(welcome, /updateConsumerProfile\(\{\s*favorite_foods:/);
  assert.doesNotMatch(welcome, /Because you love/);

  const waiterApi = readFileSync(join(root, "src/lib/waiterApi.js"), "utf8");
  assert.match(waiterApi, /restaurant_id/);
  assert.match(waiterApi, /restaurant_slug/);

  const page = readFileSync(join(root, "src/pages/FoodInterestsPage.jsx"), "utf8");
  assert.match(page, /card\.why/);
  assert.doesNotMatch(page, /Because you love/);
  assert.doesNotMatch(page, /Good morning|Good afternoon|Good evening/);
});
