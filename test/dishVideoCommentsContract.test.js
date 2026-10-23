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

test("video comment icon is last on every dish action row", () => {
  const card = read("src/components/menu-templates/PublicMenuItemCard.jsx");
  assert.equal((card.match(/<DishVideoCommentButton/g) || []).length, 3);
  for (const f of ["src/components/menu/MenuItemDetailActionRail.jsx", "src/components/cluster/ClusterDishActions.jsx"]) {
    const src = read(f);
    assert.match(src, /<DishVideoCommentButton/, f);
    assert.ok(src.lastIndexOf("<DishVideoCommentButton") > src.lastIndexOf("<ShareButton"), f);
  }
  // Protected card actions still present.
  for (const el of ["<WishListMenuItemButton", "<LikeMenuItemButton", "<InviteToEatButton", "<ShareButton"]) {
    assert.ok(card.includes(el), el);
  }
});

test("Record uses the shared camera sheet capped at 25 s; file picker kept", () => {
  const sheet = read("src/components/comments/DishVideoCommentSheet.jsx");
  assert.match(sheet, /<ConsumerCameraSheet/);
  assert.match(sheet, /maxRecordSeconds=\{DISH_VIDEO_COMMENT_MAX_SECONDS\}/);
  assert.match(sheet, /Choose a video file/);
  const cam = read("src/components/consumer/ConsumerCameraSheet.jsx");
  assert.match(cam, /maxRecordSeconds = MAX_RECORD_SECONDS/);
});

test("C2: dish page lists video comments and refreshes after a post", () => {
  const page = read("src/pages/MenuItemDetailPage.jsx");
  assert.match(page, /<DishVideoComments\s+menuItemId=/);
  const list = read("src/components/comments/DishVideoComments.jsx");
  assert.match(list, /listDishVideoComments\(menuItemId/);
  assert.match(list, /if \(!comments\.length\) return null;/);
  assert.match(list, /playsInline/);
  assert.match(read("src/components/comments/DishVideoCommentSheet.jsx"), /DISH_VIDEO_COMMENT_POSTED_EVENT/);
});

test("dish rows: Wish List · Like · Invite visible, Share + video comment behind \"…\" (Andre 2026-10-23)", () => {
  const card = read("src/components/menu-templates/PublicMenuItemCard.jsx");
  assert.equal((card.match(/<DishMoreActions/g) || []).length, 3);
  for (const f of ["src/components/menu/MenuItemDetailActionRail.jsx", "src/components/cluster/ClusterDishActions.jsx"]) {
    const src = read(f);
    const more = src.indexOf("<DishMoreActions");
    assert.ok(more > 0, f);
    assert.ok(src.indexOf("<InviteToEatButton") < more, f);
    assert.ok(src.indexOf("<ShareButton") > more && src.indexOf("<DishVideoCommentButton") > more, f);
  }
  const more = read("src/components/menu/DishMoreActions.jsx");
  assert.match(more, /onClickCapture=\{\(\) => setMode\("hidden"\)\}/);
});
