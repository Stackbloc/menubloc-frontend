/**
 * Phase 5 — Social food info API remains; hub no longer mounts "From your connects"
 * (connects appear in Who's Eating + Connects tab).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Eating hub does not mount From your connects section", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const social = read("src/pages/consumer/myMenuply/SocialFoodInfoSection.jsx");
  const api = read("src/lib/consumerApi.js");

  assert.doesNotMatch(section, /SocialFoodInfoSection/);
  assert.match(social, /From your connects/);
  assert.match(social, /listSocialFoodInfo/);
  assert.match(api, /listSocialFoodInfo/);
  assert.match(api, /connections\/social-food-info/);
});

test("Discovery panels keep Your connect informational copy", () => {
  const panel = read("src/pages/consumer/myMenuply/WantDiscoveryPanel.jsx");
  assert.match(panel, /From your connects/);
  assert.doesNotMatch(panel, /\bmatch found\b|\bauction\b/i);
});
