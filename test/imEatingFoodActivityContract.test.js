/**
 * I'm Eating / food activity contract (Phase 5).
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("I'm Eating food activity", () => {
  it("exposes consumer food-activity API helpers", () => {
    const api = fs.readFileSync(path.join(root, "src/lib/consumerApi.js"), "utf8");
    expect(api).toMatch(/listMyFoodActivity/);
    expect(api).toMatch(/createImEating/);
    expect(api).toMatch(/deleteMyFoodActivity/);
    expect(api).toMatch(/\/api\/consumer\/food-activity/);
    const publicApi = fs.readFileSync(path.join(root, "src/lib/foodActivityApi.js"), "utf8");
    expect(publicApi).toMatch(/createPublicFoodActivity/);
    expect(publicApi).toMatch(/searchReportPlaces/);
    expect(publicApi).toMatch(/resolveEatingPrefill/);
    expect(publicApi).toMatch(/dishLabel/);
  });

  it("composer picks restaurant + menu item via entity search", () => {
    const composer = fs.readFileSync(
      path.join(root, "src/components/foodActivity/ImEatingComposer.jsx"),
      "utf8"
    );
    expect(composer).toMatch(/searchReportPlaces/);
    expect(composer).toMatch(/menu_item/);
    expect(composer).toMatch(/im-eating-selected-dish/);
    expect(composer).toMatch(/Dish/);
    expect(composer).toMatch(/Visibility/);
    expect(composer).not.toMatch(/Friend/);
  });

  it("account page mounts I'm Eating route and truthfully labels activity", () => {
    const page = fs.readFileSync(
      path.join(root, "src/pages/consumer/ImEatingPage.jsx"),
      "utf8"
    );
    expect(page).toMatch(/ImEatingAtPanel/);
    expect(page).toMatch(/resolveEatingPrefill/);
    expect(page).toMatch(/menu_item_id/);
    expect(page).toMatch(/user-reported food activity/);
    expect(page).toMatch(/not a verified order/i);
    expect(page).toMatch(/Join Me/);
    expect(page).not.toMatch(/Friend list/);
    expect(page).not.toMatch(/InviteToEatModal/);
    expect(page).not.toMatch(/account\/login\?next=.*im-eating/);

    const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
    expect(app).toMatch(/\/account\/im-eating/);
    expect(app).toMatch(/ImEatingPage/);

    const profile = fs.readFileSync(
      path.join(root, "src/pages/consumer/accountDashboard/WalletActivityTab.jsx"),
      "utf8"
    );
    expect(profile).toMatch(/\/account\/im-eating/);
  });
});
