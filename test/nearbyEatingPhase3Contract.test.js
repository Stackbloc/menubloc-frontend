/**
 * Who's Eating — registered-diner text links (max 5) before What I Wanna Eat.
 * Not a video list; videos play on that diner's profile or Feed.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Who's Eating mounts before Wanna Eat on eating hub", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  const api = read("src/lib/consumerApi.js");

  assert.match(section, /NearbyEatingSection/);
  assert.match(section, /What I Wanna Eat/);
  assert.match(nearby, /data-testid="see-others-nearby-eating"/);
  assert.match(nearby, /Who's Eating/);
  assert.match(nearby, /listSeeWhosEating/);
  assert.match(nearby, /fetchWantDiscovery/);
  assert.match(nearby, /whos-eating-links/);
  assert.match(nearby, /is eating/);
  assert.match(nearby, /MAX_LINES = 5|out\.length >= MAX_LINES/);
  assert.doesNotMatch(nearby, /Open Feed/);
  assert.doesNotMatch(nearby, /nearby-feed-items/);
  assert.doesNotMatch(nearby, /videoBadge|🎥/);

  const ate = section.indexOf('data-testid="what-im-eating"');
  const nearbyMount = section.indexOf("<NearbyEatingSection");
  const want = section.indexOf('data-testid="want-to-eat"');
  assert.ok(ate >= 0 && nearbyMount >= 0 && want >= 0);
  assert.ok(ate < nearbyMount, "What I'm Eating before Who's Eating");
  assert.ok(nearbyMount < want, "Who's Eating before What I Wanna Eat");

  assert.match(api, /fetchWantDiscovery/);
  assert.match(api, /want-to-eat\/discovery/);
});

test("Who's Eating is owner-hub discovery (hidden when readOnly)", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  assert.match(section, /hidden=\{readOnly\}/);
});
