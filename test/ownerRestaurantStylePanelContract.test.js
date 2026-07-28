/**
 * Owner dashboard Restaurant Style panel contract.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("owner restaurant style panel", () => {
  it("OwnerDashboard mounts OwnerRestaurantStylePanel", () => {
    const page = readFileSync(join(root, "src/pages/owner/OwnerDashboard.jsx"), "utf8");
    assert.match(page, /OwnerRestaurantStylePanel/);
  });

  it("panel reuses RestaurantStyleSelector and owner style APIs", () => {
    const panel = readFileSync(
      join(root, "src/pages/owner/OwnerRestaurantStylePanel.jsx"),
      "utf8"
    );
    const api = readFileSync(join(root, "src/lib/ownerApi.js"), "utf8");
    assert.match(panel, /RestaurantStyleSelector/);
    assert.match(panel, /Restaurant Style/);
    assert.match(panel, /getOwnerRestaurantProfileStyle/);
    assert.match(panel, /updateOwnerRestaurantProfileStyle/);
    assert.match(api, /profile-style/);
  });
});
