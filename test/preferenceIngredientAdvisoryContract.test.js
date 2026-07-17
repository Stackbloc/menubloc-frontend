/**
 * Preference ingredient advisory (Foods I Avoid — not allergens).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const advisory = fs.readFileSync(
  path.join(ROOT, "src/components/menu/PreferenceIngredientAdvisory.jsx"),
  "utf8",
);
const detail = fs.readFileSync(path.join(ROOT, "src/pages/MenuItemDetailPage.jsx"), "utf8");
const card = fs.readFileSync(
  path.join(ROOT, "src/components/menu-templates/PublicMenuItemCard.jsx"),
  "utf8",
);

assert.match(advisory, /This item may contain/);
assert.match(advisory, /matchAvoidedIngredients/);
assert.match(advisory, /useConsumer/);
assert.doesNotMatch(advisory, /allergenFilter/);

assert.match(detail, /PreferenceIngredientAdvisory/);
assert.match(detail, /showStickyVerdict/);
assert.match(detail, /VerdictBlock/);

assert.match(card, /PreferenceIngredientAdvisory/);

console.log("preferenceIngredientAdvisoryContract: ok");
