/**
 * Contract: Food Discussions MVP mounts + API client (no network).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const api = read("src/lib/foodCommentsApi.js");
assert.match(api, /\/public\/comments/);
assert.match(api, /\/api\/consumer\/comments/);
assert.match(api, /API_BASE/);
assert.doesNotMatch(api, /menuply\.com\/public\/comments/);

const component = read("src/components/comments/FoodComments.jsx");
assert.match(component, /What diners are saying|title/);
assert.match(component, /listPublicFoodComments/);
assert.match(component, /createFoodComment/);
assert.match(component, /Sign in/);
assert.match(component, /Posting as/);
assert.match(component, /food-comment-topic/);
assert.match(component, /This restaurant/);
assert.match(component, /food-comments-menu-items/);
assert.match(component, /Menu item:/);
assert.match(component, /updateConsumerProfile/);
assert.match(component, /display_name_required/);
assert.match(component, /menuItemPath/);

const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
assert.match(shell, /FoodComments/);
assert.match(shell, /What diners are saying/);
assert.match(shell, /restaurantSlug=/);
assert.match(shell, /menuPreviewItems=/);

const detail = read("src/pages/MenuItemDetailPage.jsx");
assert.match(detail, /FoodComments/);
assert.match(detail, /menuItemId=\{Number\(item\.menu_item_id\)\}/);
// Sticky verdict / Similar must remain present
assert.match(detail, /VerdictBlock/);
assert.match(detail, /ExploreSimilarDishes/);

const owner = read("src/pages/owner/OwnerProfileManager.jsx");
assert.match(owner, /Community comments/);
assert.match(owner, /getOwnerRestaurantComments/);
assert.match(owner, /featureOwnerRestaurantComment/);

console.log("foodDiscussionsContract.test.js: ok");
