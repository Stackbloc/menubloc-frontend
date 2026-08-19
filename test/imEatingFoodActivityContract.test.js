/**
 * I'm Eating / food activity contract (Phase 5).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("exposes consumer food-activity API helpers", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /listMyFoodActivity/);
  assert.match(api, /createImEating/);
  assert.match(api, /deleteMyFoodActivity/);
  assert.match(api, /\/api\/consumer\/food-activity/);
  const publicApi = read("src/lib/foodActivityApi.js");
  assert.match(publicApi, /createPublicFoodActivity/);
  assert.match(publicApi, /searchReportPlaces/);
  assert.match(publicApi, /resolveEatingPrefill/);
  assert.match(publicApi, /dishLabel/);
});

test("composer picks restaurant + menu item via entity search", () => {
  const composer = read("src/components/foodActivity/ImEatingComposer.jsx");
  assert.match(composer, /searchReportPlaces/);
  assert.match(composer, /menu_item/);
  assert.match(composer, /im-eating-selected-dish/);
  assert.match(composer, /Dish/);
  assert.match(composer, /Visibility/);
  assert.doesNotMatch(composer, /Friend/);
});

test("panel supports photo upload and diary mirror on publish", () => {
  const panel = read("src/components/foodActivity/ImEatingAtPanel.jsx");
  assert.match(panel, /EatingMediaAttach/);
  assert.match(panel, /uploadFoodActivityPhoto/);
  assert.match(panel, /uploadPublicFoodActivityPhoto/);
  assert.match(panel, /createWhatIAteToday/);
  assert.match(panel, /im-eating-food-name/);

  const api = read("src/lib/consumerApi.js");
  assert.match(api, /uploadFoodActivityPhoto/);
  assert.match(api, /\/api\/consumer\/food-activity\/photo/);

  const publicApi = read("src/lib/foodActivityApi.js");
  assert.match(publicApi, /uploadPublicFoodActivityPhoto/);
  assert.match(publicApi, /\/public\/food-activity\/photo/);

  const attach = read("src/components/foodActivity/EatingMediaAttach.jsx");
  assert.match(attach, /ConsumerCameraPickButton/);
});

test("account page mounts I'm Eating route and truthfully labels activity", () => {
  const page = read("src/pages/consumer/ImEatingPage.jsx");
  assert.match(page, /ImEatingAtPanel/);
  assert.match(page, /resolveEatingPrefill/);
  assert.match(page, /menu_item_id/);
  assert.match(page, /user-reported food activity/);
  assert.match(page, /not a verified order/i);
  assert.match(page, /Join Me/);
  assert.doesNotMatch(page, /Friend list/);
  assert.doesNotMatch(page, /InviteToEatModal/);
  assert.doesNotMatch(page, /account\/login\?next=.*im-eating/);

  const app = read("src/App.jsx");
  assert.match(app, /\/account\/im-eating/);
  assert.match(app, /ImEatingPage/);

  const profile = read("src/pages/consumer/accountDashboard/WalletActivityTab.jsx");
  assert.match(profile, /\/account\/im-eating/);
});
