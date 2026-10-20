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
  for (const name of ["LikeMenuItemButton", "InviteToEatButton", "ShareButton", "FoodCommentNavButton"]) {
    assert.match(actions, new RegExp(`import ${name} from`), `${name} imported`);
  }
  assert.match(actions, /buildDishShareData/);
});

test("Like + Invite inline; Share + Comment only after the dots expand", () => {
  assert.match(actions, /data-testid="cluster-dish-more"/);
  assert.match(actions, /aria-expanded=\{moreOpen\}/);
  assert.match(actions, /\{moreOpen && shareData \? \(\s*<ShareButton/);
  assert.match(actions, /\{moreOpen && ckId \? \(\s*<span[^>]*>\s*<FoodCommentNavButton/);
  assert.doesNotMatch(actions, /moreOpen && ckId \? \(\s*<span[^>]*>\s*<LikeMenuItemButton/);
});

test("likes/comments write to the CK dish record (franchise rows use ck_menu_item_id)", () => {
  assert.match(actions, /is_franchise_cluster_item \? item\?\.ck_menu_item_id : item\?\.menu_item_id/);
  assert.match(actions, /<LikeMenuItemButton\s+menuItemId=\{ckId\}/);
  assert.match(actions, /<FoodCommentNavButton\s+target="menu_item"\s+menuItemId=\{ckId\}/);
});

test("counts show only above 0", () => {
  assert.match(actions, /if \(!\(value > 0\)\) return null;/);
  assert.match(actions, /cluster-dish-like-count/);
  assert.match(actions, /cluster-dish-comment-count/);
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
