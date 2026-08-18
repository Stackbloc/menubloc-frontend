/**
 * Diner primary nav: Home | Search | X | Activity | My Menuply.
 * Home discovery unchanged. Waiter files untouched. X is the brand mark, not a plus.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("BottomNav is Home Search X Activity My Menuply", () => {
  const nav = read("src/components/BottomNav.jsx");
  assert.match(nav, /to: "\/"/);
  assert.match(nav, /to: "\/search"/);
  assert.match(nav, /to: "\/activity"/);
  assert.match(nav, /to: "\/my-menuply"/);
  assert.match(nav, /MenuplyXMark/);
  assert.match(nav, /MenuplyActionSheet/);
  assert.match(nav, /menuply-x-launcher/);
  assert.doesNotMatch(nav, /to: "\/waiter"/);
  assert.doesNotMatch(nav, /to: "\/checkout"/);
  assert.doesNotMatch(nav, /browseMenusHref/);
  assert.doesNotMatch(nav, /icon:\s*["']\+["']/);
  assert.doesNotMatch(nav, /label:\s*["']\+["']/);
});

test("X action sheet is compact eat-together actions and guest-open I'm Eating At", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /I'm Eating At/);
  assert.match(sheet, /\/account\/im-eating/);
  assert.match(sheet, /guestOk: true/);
  assert.match(sheet, /Invite to Eat/);
  assert.match(sheet, /Create Eating Plan/);
  assert.match(sheet, /Add to Want to Eat/);
  assert.match(sheet, /Share Food/);
  assert.match(sheet, /Find events/);
  assert.doesNotMatch(sheet, /Create Event/);
  assert.doesNotMatch(sheet, /plus/i);
});

test("X mark uses established logo crop, not a plus icon", () => {
  const mark = read("src/components/MenuplyXMark.jsx");
  assert.match(mark, /MENUPLY_LOGO_SRC/);
  assert.match(mark, /X_MARK_RATIO/);
  assert.doesNotMatch(mark, /\+/);
});

test("StickyPageHeader person goes to My Menuply; cart stays in header", () => {
  const header = read("src/components/StickyPageHeader.jsx");
  assert.match(header, /to="\/my-menuply"/);
  assert.match(header, /to="\/checkout"/);
  assert.match(header, /useOrderCart/);
});

test("Hamburger keeps Waiter and Settings without burying primary destinations", () => {
  const drawer = read("src/components/grubbid/DiscoveryDrawer.jsx");
  assert.match(drawer, /to="\/waiter"/);
  assert.match(drawer, /to="\/account"/);
  assert.match(drawer, /to="\/my-menuply"/);
  assert.match(drawer, /to="\/activity"/);
});

test("App routes My Menuply and Activity without replacing Home", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/my-menuply"/);
  assert.match(app, /path="\/activity"/);
  assert.match(app, /<HomeNext \/>/);
  assert.match(app, /path="\/account"/);
  assert.doesNotMatch(app, /FoodInterestsPage\.jsx[\s\S]{0,40}MyMenuply/);
});
