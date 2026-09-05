/**
 * Phase 5 — Social food information from connects (not matching).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Social food info section mounts on eating hub before Wanna Eat", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const social = read("src/pages/consumer/myMenuply/SocialFoodInfoSection.jsx");
  const api = read("src/lib/consumerApi.js");

  assert.match(section, /SocialFoodInfoSection/);
  assert.match(social, /data-testid="social-food-info"/);
  assert.match(social, /From your connects/);
  assert.match(social, /not matching/i);
  assert.match(social, /listSocialFoodInfo/);
  assert.doesNotMatch(social, /match found|eligibility|qualifying/i);

  const nearby = section.indexOf("<NearbyEatingSection");
  const socialMount = section.indexOf("<SocialFoodInfoSection");
  const want = section.indexOf('data-testid="want-to-eat"');
  assert.ok(nearby >= 0 && socialMount >= 0 && want >= 0);
  assert.ok(nearby < socialMount, "Nearby before Social Food Info");
  assert.ok(socialMount < want, "Social Food Info before Wanna Eat");

  assert.match(api, /listSocialFoodInfo/);
  assert.match(api, /connections\/social-food-info/);
});

test("Discovery panels keep Your connect informational copy", () => {
  const panel = read("src/pages/consumer/myMenuply/WantDiscoveryPanel.jsx");
  assert.match(panel, /From your connects/);
  assert.doesNotMatch(panel, /\bmatch found\b|\bauction\b/i);
});
