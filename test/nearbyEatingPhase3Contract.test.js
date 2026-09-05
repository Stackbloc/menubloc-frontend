/**
 * Phase 3 — See What Others Nearby Are Eating precedes What I Wanna Eat.
 * Reuses Feed (listSeeWhosEating) + optional want discovery; food icons for scan.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Nearby eating section mounts before Wanna Eat on eating hub", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  const api = read("src/lib/consumerApi.js");
  const icons = read("src/lib/foodInterestIcons.js");

  assert.match(section, /NearbyEatingSection/);
  assert.match(section, /What I Wanna Eat/);
  assert.match(nearby, /data-testid="see-others-nearby-eating"/);
  assert.match(nearby, /See What Others Nearby Are Eating/);
  assert.match(nearby, /listSeeWhosEating/);
  assert.match(nearby, /fetchWantDiscovery/);
  assert.match(nearby, /iconForFoodText/);
  assert.match(nearby, /Open Feed/);

  const ate = section.indexOf('data-testid="what-im-eating"');
  const nearbyMount = section.indexOf("<NearbyEatingSection");
  const want = section.indexOf('data-testid="want-to-eat"');
  assert.ok(ate >= 0 && nearbyMount >= 0 && want >= 0);
  assert.ok(ate < nearbyMount, "What I'm Eating before Nearby");
  assert.ok(nearbyMount < want, "Nearby before What I Wanna Eat");

  assert.match(api, /fetchWantDiscovery/);
  assert.match(api, /want-to-eat\/discovery/);
  assert.match(icons, /export function iconForFoodText/);
});

test("Nearby section is owner-hub discovery (hidden when readOnly)", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(section, /hidden=\{readOnly\}/);
});
