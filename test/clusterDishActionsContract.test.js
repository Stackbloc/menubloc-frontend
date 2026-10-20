import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const actions = read("src/components/cluster/ClusterDishActions.jsx");
const explorer = read("src/components/cluster/ClusterMenuExplorer.jsx");

test("cluster dish actions reuse the restaurant menu row components", () => {
  for (const name of ["WishListMenuItemButton", "LikeMenuItemButton", "InviteToEatButton", "ShareButton"]) {
    assert.match(actions, new RegExp(`import ${name} from`), `${name} imported`);
  }
  assert.match(actions, /buildDishShareData/);
});

test("same four actions as the Feed rail, same order, all inline (Andre, 2026-10-20)", () => {
  const order = ["<WishListMenuItemButton", "<LikeMenuItemButton", "<InviteToEatButton", "<ShareButton"].map((tag) =>
    actions.indexOf(tag)
  );
  assert.ok(order.every((idx) => idx > 0), "all four present");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "Wish List · Like · Invite · Share");
  assert.doesNotMatch(actions, /cluster-dish-more|moreOpen/, "no dots menu");
  assert.doesNotMatch(actions, /Order this|See menu/, "Order / See menu is Feed-only");
});

test("Wish List and Like write to the CK dish record (franchise rows use ck_menu_item_id)", () => {
  assert.match(actions, /is_franchise_cluster_item \? item\?\.ck_menu_item_id : item\?\.menu_item_id/);
  assert.match(actions, /<LikeMenuItemButton\s+menuItemId=\{ckId\}/);
  assert.match(actions, /<WishListMenuItemButton\s+menuItemId=\{ckId\}/);
});

test("counts show only above 0", () => {
  assert.match(actions, /if \(!\(value > 0\)\) return null;/);
  assert.match(actions, /cluster-dish-like-count/);
});

test("action taps never open the dish; the row (minus icons) does", () => {
  assert.match(actions, /onClick=\{stop\}/);
  assert.match(explorer, /closest\("a, button"\)/);
  assert.match(explorer, /linkRef\.current\.click\(\)/);
});

test("trailing arrow is gone and price stays on the name line", () => {
  assert.doesNotMatch(explorer, />\s*→\s*</);
  assert.match(explorer, /data-testid="cluster-dish-price"/);
  assert.match(explorer, /flexShrink: 0/);
  assert.match(actions, /whiteSpace: "nowrap"/);
});

test("counts load in one batched call per list", () => {
  assert.match(explorer, /useClusterDishSocialCounts\(items\)/);
  assert.match(read("src/lib/foodCommentsApi.js"), /\/public\/menu-item-social-counts/);
});

test("row opens the restaurant's ordering menu with the dish pinned (not the dish page)", () => {
  const ctx = read("src/components/cluster/video/ClusterVideoContext.jsx");
  const sheet = read("src/components/cluster/video/ClusterVideoMenuSheet.jsx");
  assert.match(ctx, /setMenu\(\{ video: null, item, pinnedLabel: "Your pick" \}\)/);
  assert.match(sheet, /CatalogMenuRenderer/);
  assert.match(sheet, /pinnedItemLabel=\{highlightName \? pinnedLabel \|\| "From the clip" : null\}/);
  assert.match(explorer, /onClick=\{openMenuInstead\}/);
  assert.match(explorer, /if \(openDishMenu\(item\)\) event\.preventDefault\(\);/);
  // New-tab clicks and crawlers keep the dish link.
  assert.match(explorer, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(explorer, /to=\{href\}/);
});
