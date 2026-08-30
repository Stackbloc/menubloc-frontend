/**
 * Restaurant dining intent — explicit I want to go on public profiles.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("restaurant profile mounts People who want to go section", () => {
  const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
  assert.match(shell, /RestaurantDiningIntentSection/);
  assert.match(shell, /isDiningHall \? null/);

  const section = read("src/components/restaurant/RestaurantDiningIntentSection.jsx");
  assert.match(section, /People who want to go/);
  assert.match(section, /I want to go/);
  assert.match(section, /fetchRestaurantDiningIntent/);
  assert.match(section, /requestConnection/);
  assert.match(section, /dining_intent_viewed/);
  assert.match(section, /Invite to Eat/);
  assert.doesNotMatch(section, /homemade|grocery|recipe/i);

  const sheet = read("src/components/restaurant/DiningIntentSheet.jsx");
  assert.match(sheet, /want_to_go/);
  assert.match(sheet, /planning_to_go/);
  assert.match(sheet, /looking_for_company/);
  assert.match(sheet, /dining_intent_created/);
  assert.match(sheet, /dining_intent_removed/);

  const api = read("src/lib/consumerApi.js");
  assert.match(api, /fetchRestaurantDiningIntent/);
  assert.match(api, /createRestaurantDiningIntent/);
  assert.match(api, /removeRestaurantDiningIntent/);
});
