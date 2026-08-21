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

test("X sheet creates My Menuply content; Diner QR first; no I'm Eating At / My Connects", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /menuply-action-sheet/);
  assert.match(sheet, /id: "diner-qr"/);
  assert.match(sheet, /title: "My Diner QR"/);
  assert.match(sheet, /\/account\/diner-qr/);
  assert.ok(
    sheet.indexOf('id: "diner-qr"') < sheet.indexOf('id: "ate"'),
    "My Diner QR is the first action"
  );
  assert.match(sheet, /title: "What I'm Eating"/);
  assert.match(sheet, /title: "What I Want to Eat"/);
  assert.match(sheet, /title: "My Eating Plans"/);
  assert.match(sheet, /title: "My Crews"/);
  assert.match(sheet, /title: "My Events"/);
  assert.match(sheet, /compose=ate/);
  assert.match(sheet, /compose=want/);
  assert.match(sheet, /compose=plan/);
  assert.match(sheet, /Invite to Eat/);
  assert.match(sheet, /Find venue events/);
  assert.match(sheet, /id: "profile-gallery"/);
  assert.match(sheet, /title: "Profile gallery"/);
  assert.match(sheet, /compose=profile-gallery/);
  assert.match(sheet, /id: "my-account"/);
  assert.match(sheet, /title: "My Account"/);
  assert.match(sheet, /to: "\/account"/);
  assert.ok(
    sheet.indexOf('id: "my-account"') > sheet.indexOf('id: "profile-gallery"'),
    "My Account is after Profile gallery"
  );
  assert.ok(
    sheet.lastIndexOf('id: "my-account"') === sheet.indexOf('id: "my-account"') &&
      sheet.indexOf('id: "my-account"') ===
        Math.max(
          ...["diner-qr", "ate", "want", "plan", "crew", "event", "events-browse", "invite", "upload-media", "profile-gallery", "my-account"].map(
            (id) => sheet.indexOf(`id: "${id}"`)
          )
        ),
    "My Account is the last action"
  );
  assert.doesNotMatch(sheet, /id: "im-eating"/);
  assert.doesNotMatch(sheet, /I'm Eating At/);
  assert.doesNotMatch(sheet, /id: "connects"/);
  assert.doesNotMatch(sheet, /My Connects/);
  assert.doesNotMatch(sheet, /focus=connects/);
  assert.doesNotMatch(sheet, /Create Eating Plan/);
  assert.doesNotMatch(sheet, /Share Food/);
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
