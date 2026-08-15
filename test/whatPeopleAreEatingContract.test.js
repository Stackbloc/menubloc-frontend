/**
 * Contract: cluster What People Are Eating is public / non-subscriber.
 */

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("What People Are Eating (cluster)", () => {
  it("uses public food-activity cluster API via api.js", () => {
    const api = fs.readFileSync(path.join(root, "src/lib/foodActivityApi.js"), "utf8");
    expect(api).toMatch(/listPublicClusterFoodActivity/);
    expect(api).toMatch(/\/public\/food-activity\/clusters\//);
    expect(api).toMatch(/from ["'].*api\.js["']/);
  });

  it("section is area activity with people-shared wording; no paywall/auth gate", () => {
    const section = fs.readFileSync(
      path.join(root, "src/components/cluster/WhatPeopleAreEating.jsx"),
      "utf8"
    );
    expect(section).toMatch(/What People Are Eating/);
    expect(section).toMatch(/listPublicClusterFoodActivity/);
    expect(section).toMatch(/people_shared_label|people shared this/);
    expect(section).toMatch(/\/menu-items\//);
    expect(section).toMatch(/\/restaurants\//);
    expect(section).not.toMatch(/requireConsumer|isAuthenticated|is_paid_subscriber|paywall/i);
    expect(section).not.toMatch(/order_count|verified_order/);
    expect(section).not.toMatch(/Friend/);
  });

  it("ClusterPage mounts section for all visitors (no subscriber gate)", () => {
    const page = fs.readFileSync(path.join(root, "src/pages/ClusterPage.jsx"), "utf8");
    expect(page).toMatch(/WhatPeopleAreEating/);
    expect(page).toMatch(/clusterId=\{cluster\.id\}/);
    expect(page).toMatch(/available without sign-in/);
    const mountIdx = page.indexOf("<WhatPeopleAreEating");
    expect(mountIdx).toBeGreaterThan(-1);
    // Not gated on consumer session near the mount site.
    const before = page.slice(Math.max(0, mountIdx - 120), mountIdx);
    expect(before).not.toMatch(/isAuthenticated|useConsumer|requireAuth/);
  });
});
