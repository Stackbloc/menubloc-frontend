/**
 * Regression: every Feed/My Menuply compose path that builds food_name must import
 * eatingFoodName from src/lib (not a missing DB column).
 * Incident: SusieCakes Wanna Eat + media → ReferenceError "eatingFoodName is not defined"
 * after ce7734ce dropped the import from feedVideoCompose while leaving call sites.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { eatingFoodName, joinHomemadeComment } from "../src/lib/eatingPlaceLink.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const LIB_IMPORT =
  /import\s*\{[^}]*eatingFoodName[^}]*\}\s*from\s*["'](?:\.\.\/)*lib\/eatingPlaceLink\.js["']|import\s*\{[^}]*eatingFoodName[^}]*\}\s*from\s*["']\.\/eatingPlaceLink\.js["']/;

describe("eatingFoodName wiring — all compose/media paths", () => {
  it("lib helper resolves names", () => {
    assert.equal(
      eatingFoodName({ text: "", dish: { item_name: "Red Velvet" }, restaurant: null, homemade: false }),
      "Red Velvet"
    );
    assert.equal(joinHomemadeComment(true, "note"), "Homemade. note");
  });

  it("feedVideoCompose imports from lib and posts food_name on want paths", () => {
    const compose = read("src/lib/feedVideoCompose.js");
    assert.match(compose, /from\s*["']\.\/eatingPlaceLink\.js["']/);
    assert.match(compose, /eatingFoodName\s*\(/);
    assert.match(compose, /joinHomemadeComment\s*\(/);
    assert.match(compose, /export async function postFeedWantVideo/);
    assert.match(compose, /export async function postGuestFeedWantVideo/);
    assert.match(compose, /export async function postFeedAteVideo/);
    assert.match(compose, /food_name:\s*name/);
  });

  it("MyMenuplyPage + plan/post helpers import from lib", () => {
    assert.match(read("src/pages/consumer/MyMenuplyPage.jsx"), LIB_IMPORT);
    assert.match(
      read("src/pages/consumer/myMenuply/EatingPlanDayForm.jsx"),
      /from\s*["']\.\.\/\.\.\/\.\.\/lib\/eatingPlaceLink\.js["']/
    );
    assert.match(
      read("src/pages/consumer/myMenuply/PostAfterActions.jsx"),
      /from\s*["']\.\.\/\.\.\/\.\.\/lib\/eatingPlaceLink\.js["']/
    );
  });

  it("pages shim re-exports lib (no duplicate implementation)", () => {
    const shim = read("src/pages/consumer/myMenuply/eatingPlaceLink.js");
    assert.match(shim, /from\s*["']\.\.\/\.\.\/\.\.\/lib\/eatingPlaceLink\.js["']/);
    assert.doesNotMatch(shim, /export function eatingFoodName/);
  });
});
