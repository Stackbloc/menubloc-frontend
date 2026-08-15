/**
 * Waiter Phase 8: What People Are Eating from food_activity.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("Waiter What People Are Eating", () => {
  it("API client passes cluster context and people-eating helper", () => {
    const api = fs.readFileSync(path.join(root, "src/lib/waiterApi.js"), "utf8");
    expect(api).toMatch(/fetchWaiterPeopleEating/);
    expect(api).toMatch(/cluster_id/);
    expect(api).toMatch(/cluster_slug/);
    expect(api).toMatch(/\/api\/waiter\/people-eating/);
  });

  it("FoodInterestsPage prioritizes current cluster for briefing", () => {
    const page = fs.readFileSync(path.join(root, "src/pages/FoodInterestsPage.jsx"), "utf8");
    expect(page).toMatch(/readMenuBrowserVenueSession/);
    expect(page).toMatch(/clusterSlug/);
    expect(page).toMatch(/fetchWaiterBriefing\(/);
    expect(page).toMatch(/clusterId:/);
    expect(page).toMatch(/groupByType/);
    expect(page).toMatch(/briefing\?\.recommendations/);
    expect(page).not.toMatch(/<MarketFallback|<CommunityGrowthCard/);
  });
});
