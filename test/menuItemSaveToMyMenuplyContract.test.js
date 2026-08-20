/**
 * Menu item → My Menuply save (+ icon + choice screen).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("detail action rail renders + last and only when signed in", () => {
  const rail = read("src/components/menu/MenuItemDetailActionRail.jsx");
  const icon = read("src/components/consumer/MenuItemSaveToMyMenuplyIcon.jsx");
  assert.match(rail, /MenuItemSaveToMyMenuplyIcon/);
  assert.match(rail, /showSaveToMyMenuply\s*=\s*false/);
  assert.match(rail, /saveReturnTo\s*=\s*""/);
  assert.match(icon, /if \(!isAuthenticated\) return null/);
  assert.match(icon, /Save to My Menuply/);
  const commentIdx = rail.indexOf("FoodCommentNavButton");
  const saveIdx = rail.indexOf("MenuItemSaveToMyMenuplyIcon");
  assert.ok(commentIdx >= 0 && saveIdx > commentIdx, "+ save icon must be last in the rail");
});

test("save choice screen offers ate vs want paths", () => {
  const page = read("src/pages/consumer/MenuItemSaveChoicePage.jsx");
  const app = read("src/App.jsx");
  const detail = read("src/pages/MenuItemDetailPage.jsx");
  assert.match(page, /What I ate/);
  assert.match(page, /What I want to eat/);
  assert.match(page, /createWhatIAteToday/);
  assert.match(page, /createWantToEat/);
  assert.match(page, /menu-item-save-choice/);
  assert.match(app, /MenuItemSaveChoicePage/);
  assert.match(app, /\/account\/menu-item\/save/);
  assert.match(detail, /showSaveToMyMenuply/);
  assert.doesNotMatch(detail, /Add to What I Ate Today/);
});
