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
  });

  it("composer picks restaurant + menu item via entity search", () => {
    const composer = fs.readFileSync(
      path.join(root, "src/components/foodActivity/ImEatingComposer.jsx"),
      "utf8"
    );
    expect(composer).toMatch(/searchDiningCrewEntities/);
    expect(composer).toMatch(/menu_item/);
    expect(composer).toMatch(/Visibility/);
    expect(composer).not.toMatch(/Friend/);
  });

  it("account page mounts I'm Eating route and truthfully labels activity", () => {
    const page = fs.readFileSync(
      path.join(root, "src/pages/consumer/ImEatingPage.jsx"),
      "utf8"
    );
    expect(page).toMatch(/ImEatingComposer/);
    expect(page).toMatch(/user-reported food activity/);
    expect(page).toMatch(/not a verified order/i);
    expect(page).not.toMatch(/Friend list/);

    const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
    expect(app).toMatch(/\/account\/im-eating/);
    expect(app).toMatch(/ImEatingPage/);

    const profile = fs.readFileSync(
      path.join(root, "src/pages/consumer/ConsumerProfile.jsx"),
      "utf8"
    );
    expect(profile).toMatch(/\/account\/im-eating/);
  });
});
