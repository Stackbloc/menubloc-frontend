/**
 * Dish video comments (Andre, 2026-10-22): Comment on every dish action row, 25 s max,
 * dish auto-tagged, existing diner upload path reused, signed-out → sign in.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("25 seconds, and the API paths match the backend contract", () => {
  const api = read("src/lib/dishVideoCommentsApi.js");
  assert.match(api, /DISH_VIDEO_COMMENT_MAX_SECONDS = 25;/);
  assert.match(api, /\/public\/menu-items\/\$\{encodeURIComponent\(menuItemId\)\}\/video-comments/);
  assert.match(api, /\/api\/consumer\/menu-items\/\$\{encodeURIComponent\(menuItemId\)\}\/video-comments/);
});

test("sheet refuses clips over 25 s and reuses the existing upload", () => {
  const sheet = read("src/components/comments/DishVideoCommentSheet.jsx");
  assert.match(sheet, /probeNativeVideoFile\(picked\)/);
  assert.match(sheet, /length > DISH_VIDEO_COMMENT_MAX_SECONDS \+ 0\.5/);
  assert.match(sheet, /uploadWhatIAteTodayPhoto\(file/);
  assert.match(sheet, /createDishVideoComment\(menuItemId/);
});

test("button sends signed-out diners to sign in and back", () => {
  const btn = read("src/components/comments/DishVideoCommentButton.jsx");
  assert.match(btn, /if \(!isAuthenticated\)/);
  assert.match(btn, /\/account\/login\?next=/);
});

test("Comment sits after Like on every dish action row", () => {
  const card = read("src/components/menu-templates/PublicMenuItemCard.jsx");
  assert.equal((card.match(/<DishVideoCommentButton/g) || []).length, 3);
  for (const f of ["src/components/menu/MenuItemDetailActionRail.jsx", "src/components/cluster/ClusterDishActions.jsx"]) {
    assert.match(read(f), /<DishVideoCommentButton/, f);
  }
  // Protected card actions still present.
  for (const el of ["<WishListMenuItemButton", "<LikeMenuItemButton", "<InviteToEatButton", "<ShareButton"]) {
    assert.ok(card.includes(el), el);
  }
});
