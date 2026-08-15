/**
 * Contract: restaurant What Diners Are Saying derives from food_activity.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("What Diners Are Saying (restaurant)", () => {
  it("public API client uses api.js Railway path", () => {
    const api = fs.readFileSync(path.join(root, "src/lib/foodActivityApi.js"), "utf8");
    expect(api).toMatch(/from ["'].*api\.js["']/);
    expect(api).toMatch(/\/public\/food-activity\/restaurants\//);
    expect(api).not.toMatch(/menuply\.com\/public\/food-activity/);
    expect(api).not.toMatch(/window\.location\.origin/);
  });

  it("section shows activity + links menu items; not star ratings", () => {
    const section = fs.readFileSync(
      path.join(root, "src/components/restaurant/WhatDinersAreSaying.jsx"),
      "utf8"
    );
    expect(section).toMatch(/What Diners Are Saying/);
    expect(section).toMatch(/listPublicRestaurantFoodActivity/);
    expect(section).toMatch(/\/menu-items\//);
    expect(section).toMatch(/User-reported food activity/);
    expect(section).toMatch(/FoodComments/);
    expect(section).not.toMatch(/five.?star|★|ratingValue/i);
    expect(section).not.toMatch(/order_count|verified_order/i);
  });

  it("public profile shell mounts WhatDinersAreSaying", () => {
    const shell = fs.readFileSync(
      path.join(root, "src/components/restaurant/publicProfile/PublicProfileShell.jsx"),
      "utf8"
    );
    expect(shell).toMatch(/WhatDinersAreSaying/);
    expect(shell).toMatch(/restaurantId=\{restaurantId\}/);
  });
});
