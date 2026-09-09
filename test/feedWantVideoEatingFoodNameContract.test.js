/**
 * Regression: Wanna Eat feed video compose must import eatingFoodName.
 * Incident: SusieCakes "What I Wanna Eat" video → ReferenceError "eatingFoodName is not defined".
 * Not a missing DB column — API/DB field is food_name on diner_want_to_eat.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

describe("Wanna Eat feed video food_name wiring", () => {
  it("feedVideoCompose imports eatingFoodName and posts food_name", () => {
    const compose = read("src/lib/feedVideoCompose.js");
    assert.match(
      compose,
      /import\s*\{[^}]*eatingFoodName[^}]*\}\s*from\s*["']\.\.\/pages\/consumer\/myMenuply\/eatingPlaceLink\.js["']/
    );
    assert.match(compose, /export async function postFeedWantVideo/);
    assert.match(compose, /export async function postGuestFeedWantVideo/);
    assert.match(compose, /createWantToEat\(\{[\s\S]*food_name:\s*name/);
    assert.match(compose, /createGuestFeedVideo\(\{[\s\S]*kind:\s*"want"[\s\S]*food_name:\s*name/);
  });

  it("eatingPlaceLink exports eatingFoodName helper", () => {
    const link = read("src/pages/consumer/myMenuply/eatingPlaceLink.js");
    assert.match(link, /export function eatingFoodName/);
  });
});
