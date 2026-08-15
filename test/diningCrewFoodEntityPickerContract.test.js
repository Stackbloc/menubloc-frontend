/**
 * Dining Crew food entity picker contract (Phase 4).
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("dining crew food-aware conversation objects", () => {
  it("exposes entity-search client helper", () => {
    const api = fs.readFileSync(path.join(root, "src/lib/consumerApi.js"), "utf8");
    expect(api).toMatch(/searchDiningCrewEntities/);
    expect(api).toMatch(/entity-search/);
  });

  it("picker component shares restaurant/menu/menu_item types", () => {
    const picker = fs.readFileSync(
      path.join(root, "src/components/diningCrews/DiningCrewFoodEntityPicker.jsx"),
      "utf8"
    );
    expect(picker).toMatch(/restaurant/);
    expect(picker).toMatch(/menu_item/);
    expect(picker).toMatch(/searchDiningCrewEntities/);
    expect(picker).not.toMatch(/Friend/);
  });

  it("crew conversation UI mounts the food entity picker", () => {
    const page = fs.readFileSync(
      path.join(root, "src/pages/consumer/DiningCrewsPage.jsx"),
      "utf8"
    );
    expect(page).toMatch(/DiningCrewFoodEntityPicker/);
    expect(page).toMatch(/Open on Menuply|Open dish/);
    expect(page).not.toMatch(/placeholder=\"restaurant_id\"/);
  });
});
