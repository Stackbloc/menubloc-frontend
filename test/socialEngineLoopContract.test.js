/**
 * Phase 9 — Social Engine FE loop wiring (routes + public surfaces).
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("Social Engine loop wiring (Phases 1–8)", () => {
  it("account routes for edu, connections, crews, I'm Eating", () => {
    const app = read("src/App.jsx");
    expect(app).toMatch(/\/account\/edu-verify|ConsumerEduVerify/);
    expect(app).toMatch(/\/account\/connections/);
    expect(app).toMatch(/\/account\/connections\/:peerId/);
    expect(app).toMatch(/\/account\/dining-crews/);
    expect(app).toMatch(/\/account\/im-eating/);
    expect(app).toMatch(/\/waiter/);
  });

  it("restaurant + cluster public surfaces mount activity sections", () => {
    const shell = read("src/components/restaurant/publicProfile/PublicProfileShell.jsx");
    expect(shell).toMatch(/WhatDinersAreSaying/);

    const cluster = read("src/pages/ClusterPage.jsx");
    expect(cluster).toMatch(/ClusterPublicFeed/);
    expect(cluster).toMatch(/ClusterNearbyEvents/);

    const people = read("src/components/cluster/WhatPeopleAreEating.jsx");
    expect(people).toMatch(/listPublicClusterFoodActivity/);
    expect(people).not.toMatch(/is_paid_subscriber|paywall|requireConsumer/i);
  });

  it("Waiter briefing passes cluster context for people-eating", () => {
    const waiterPage = read("src/pages/FoodInterestsPage.jsx");
    expect(waiterPage).toMatch(/clusterSlug/);
    expect(waiterPage).toMatch(/fetchWaiterBriefing/);
    expect(waiterPage).toMatch(/groupByType/);

    const api = read("src/lib/waiterApi.js");
    expect(api).toMatch(/fetchWaiterPeopleEating|cluster_slug/);
  });

  it("API clients hit Railway helpers, not same-origin HTML", () => {
    const foodActivity = read("src/lib/foodActivityApi.js");
    expect(foodActivity).toMatch(/from ["'].*api\.js["']/);
    expect(foodActivity).toMatch(/\/public\/food-activity\//);
    expect(foodActivity).not.toMatch(/menuply\.com\/public\/food-activity/);
  });
});
