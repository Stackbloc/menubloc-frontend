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
  it("left nav has Restaurant Manager with one search-first Restaurants entry (2026-10-20)", () => {
    const layout = readFileSync(join(root, "src/pages/owner/OwnerLayout.jsx"), "utf8");
    assert.match(layout, /id:\s*"restaurant-manager"/);
    assert.match(layout, /label:\s*"Restaurant Manager"/);
    const section = layout.match(/id:\s*"restaurant-manager"[\s\S]*?id:\s*"bots"/)?.[0] || "";
    assert.match(section, /to:\s*"\/owner\/restaurant-manager"/);
    assert.doesNotMatch(section, /"\/owner\/profile-manager"|"\/owner\/menu-manager"/);
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
    assert.match(page, /handleStyleChange/);
    assert.match(page, /applyMode="live"/);
    assert.match(page, /getMenuConsoleRestaurant/);
    assert.match(page, /updateMenuConsoleRestaurant/);
    assert.match(api, /profile-style/);
    // Profile Manager is the Public profile section of Restaurant Manager; old URL redirects.
    assert.match(app, /path="\/owner\/profile-manager" element=\{<RestaurantManagerRedirect section="profile" \/>\}/);
    const ws = readFileSync(join(root, "src/pages/owner/OwnerMenuCreateWorkspace.jsx"), "utf8");
    assert.match(ws, /<OwnerProfileManager key=\{rid\} embedded restaurantId=\{rid\} \/>/);
  });

  it("Profile Manager mounts Menu Appearance with live owner APIs", () => {
    const page = readFileSync(join(root, "src/pages/owner/OwnerProfileManager.jsx"), "utf8");
    const api = readFileSync(join(root, "src/lib/ownerApi.js"), "utf8");
    assert.match(page, /MenuAppearanceSelector/);
    assert.match(page, /Menu Appearance/);
    assert.match(page, /owner-profile-manager-menu-appearance/);
    assert.match(page, /getOwnerRestaurantMenuAppearance/);
    assert.match(page, /updateOwnerRestaurantMenuAppearance/);
    assert.match(page, /handleAppearanceChange/);
    assert.match(api, /menu-appearance/);
  });
});
