/**
 * Owner Restaurant Manager + Profile Manager contract.
 * Style editing lives under Profile Manager — not on the dashboard.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("owner restaurant manager nav + profile manager", () => {
  it("left nav has Restaurant Manager with Profile Manager and Menu Manager", () => {
    const layout = readFileSync(join(root, "src/pages/owner/OwnerLayout.jsx"), "utf8");
    assert.match(layout, /id:\s*"restaurant-manager"/);
    assert.match(layout, /label:\s*"Restaurant Manager"/);
    assert.match(layout, /to:\s*"\/owner\/profile-manager"/);
    assert.match(layout, /label:\s*"Profile Manager"/);
    assert.match(layout, /to:\s*"\/owner\/menu-manager"/);
    assert.match(layout, /label:\s*"Menu Manager"/);
    assert.doesNotMatch(
      layout.match(/id:\s*"growth"[\s\S]*?id:\s*"support"/)?.[0] || "",
      /menu-manager/
    );
  });

  it("OwnerDashboard does not mount the removed Restaurant Style panel", () => {
    const page = readFileSync(join(root, "src/pages/owner/OwnerDashboard.jsx"), "utf8");
    assert.doesNotMatch(page, /OwnerRestaurantStylePanel/);
  });

  it("Profile Manager reuses RestaurantStyleSelector and owner style APIs", () => {
    const page = readFileSync(join(root, "src/pages/owner/OwnerProfileManager.jsx"), "utf8");
    const api = readFileSync(join(root, "src/lib/ownerApi.js"), "utf8");
    const app = readFileSync(join(root, "src/App.jsx"), "utf8");
    assert.match(page, /RestaurantStyleSelector/);
    assert.match(page, /Restaurant Style/);
    assert.match(page, /getOwnerRestaurantProfileStyle/);
    assert.match(page, /updateOwnerRestaurantProfileStyle/);
    assert.match(page, /getMenuConsoleRestaurant/);
    assert.match(page, /updateMenuConsoleRestaurant/);
    assert.match(api, /profile-style/);
    assert.match(app, /path="\/owner\/profile-manager"/);
    assert.match(app, /OwnerProfileManager/);
  });
});
