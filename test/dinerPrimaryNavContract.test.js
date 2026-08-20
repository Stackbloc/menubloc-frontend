/**
 * Diner primary nav: Home | Waiter | Menu Browser | X (Post) | Basket | My Menuply.
 * Activity lives on Waiter. Search is not a bottom-nav tab.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("BottomNav is Home Waiter Menu Browser X Basket My Menuply", () => {
  const nav = read("src/components/BottomNav.jsx");
  assert.match(nav, /to: "\/"/);
  assert.match(nav, /to: "\/waiter"/);
  assert.match(nav, /WaiterFaceIcon/);
  assert.match(nav, /BrowseMenusIcon/);
  assert.match(nav, /resolveBrowseMenusHref/);
  assert.match(nav, /MenuplyXMark/);
  assert.match(nav, /MenuplyActionSheet/);
  assert.match(nav, /title=\{POST_LABEL\}/);
  assert.match(nav, /const POST_LABEL = "Post"/);
  assert.match(nav, /iconWrapStyle/);
  assert.match(nav, /visibility: "hidden"/);
  assert.match(nav, /to: "\/checkout"/);
  assert.match(nav, /to: "\/my-menuply"/);
  assert.match(nav, /<span>Menu<\/span>/);
  assert.match(nav, /<span>Browser<\/span>/);
  assert.match(nav, /MenuplyXMark size=\{24\}/);
  assert.match(nav, /translateY\(6px\)/);
  assert.doesNotMatch(nav, /to: "\/search"/);
  assert.doesNotMatch(nav, /to: "\/activity"/);
});

test("X sheet is Post about and carries restaurant or dish context", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /Post about/);
  assert.doesNotMatch(sheet, /Do something/);
  assert.match(sheet, /menu_item_id/);
  assert.match(sheet, /restaurant_id/);
  assert.match(sheet, /What I Ate/);
  assert.match(sheet, /Want to Eat/);
  assert.match(sheet, /Plan to Eat/);
  assert.match(sheet, /My Connects/);
  assert.match(sheet, /compose=ate/);
  assert.match(sheet, /compose=want/);
  assert.match(sheet, /compose=plan/);
  assert.match(sheet, /focus=connects/);
  assert.match(sheet, /homemade/);
  assert.match(sheet, /Invite to Eat/);
  assert.match(sheet, /I'm Eating At/);
  assert.match(sheet, /Find events/);
  assert.match(sheet, /My Diner QR/);
  assert.match(sheet, /\/account\/diner-qr/);
  assert.ok(
    sheet.indexOf('id: "diner-qr"') < sheet.indexOf('id: "im-eating"'),
    "My Diner QR is first under Post about"
  );
  assert.doesNotMatch(sheet, /Create Eating Plan/);
  assert.doesNotMatch(sheet, /Share Food/);
  assert.doesNotMatch(sheet, /What I'm Eating/);
  assert.doesNotMatch(sheet, /friends/i);
});

test("StickyPageHeader person goes to My Menuply (Settings when already on hub); basket lives in BottomNav", () => {
  const header = read("src/components/StickyPageHeader.jsx");
  assert.match(header, /accountHref/);
  assert.match(header, /\/my-menuply/);
  assert.match(header, /to=\{accountHref\}/);
  assert.match(header, /sticky-header-my-menuply|sticky-header-account-settings/);
  assert.match(header, /backTo/);
  assert.match(header, /sticky-page-header-back/);
  assert.doesNotMatch(header, /to="\/checkout"/);
  assert.doesNotMatch(header, /useOrderCart/);
});

test("Hamburger keeps Settings, Activity, and My Menuply", () => {
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

test("Waiter incorporates public Activity; /activity redirects there", () => {
  const waiter = read("src/pages/FoodInterestsPage.jsx");
  const activity = read("src/pages/ActivityPage.jsx");
  const panel = read("src/components/WaiterPublicActivity.jsx");
  assert.match(waiter, /WaiterPublicActivity/);
  assert.match(waiter, /groupByType/);
  assert.match(waiter, /briefing\?\.recommendations/);
  assert.doesNotMatch(waiter, /import\s+.*MarketFallback|<[Mm]arketFallback|CommunityGrowthCard\s*[({]/);
  assert.match(activity, /Navigate to="\/waiter#activity"/);
  assert.match(panel, /not what your connections are eating/i);
  assert.match(panel, /What People Are Eating/);
  assert.doesNotMatch(panel, /What My Connections Are Eating/);
});
