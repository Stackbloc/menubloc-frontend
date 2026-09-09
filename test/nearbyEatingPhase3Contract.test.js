/**
 * Who's Eating — activity-first scan rows (max 8 + Show more).
 * Avatar + Name, Age, Affiliation · emoji activity · ▶ when video.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatDinerDiscoverySummary,
  formatDinerIdentityBits,
  formatDinerScanIdentity,
  formatDinerActivityLine,
  resolveDinerAffiliation,
} from "../src/lib/dinerDiscoverySummary.js";

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
  assert.match(nearby, /DinerActivityScanRow/);
  assert.match(nearby, /INITIAL_VISIBLE = 8/);
  assert.match(nearby, /whos-eating-show-more/);
  assert.doesNotMatch(nearby, /Open Feed/);
  assert.doesNotMatch(nearby, /nearby-feed-items/);
  assert.doesNotMatch(nearby, /🎥/);

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
  assert.match(section, /hidden=\{readOnly \|\| !canEdit\}/);
});

test("formatDinerDiscoverySummary: SusyQ, F, 25, USC wants Burgers (prose)", () => {
  const line = formatDinerDiscoverySummary({
    display_name: "SusyQ",
    diner_sex_short: "F",
    age_years: 25,
    school_affiliation: "USC",
    kind: "want",
    food_interest_key: "burger",
  });
  assert.match(line, /SusyQ, F, 25, USC wants Burger/);
  assert.doesNotMatch(line, /🍔/);
  assert.equal(
    formatDinerIdentityBits({
      display_name: "SusyQ",
      diner_sex: "female",
      age_years: 25,
      school_affiliation: "USC",
    }),
    "SusyQ · F · 25 · USC"
  );
});

test("scan identity is Name, Age, Affiliation without sex or location pin", () => {
  assert.equal(
    formatDinerScanIdentity({
      display_name: "BrandyS",
      age_years: 22,
      school_affiliation: "USC",
      diner_sex_short: "F",
    }),
    "BrandyS · 22 · USC"
  );
  assert.equal(resolveDinerAffiliation({ school_affiliation: "UCLA" }), "UCLA");
  assert.equal(
    formatDinerActivityLine({
      kind: "want",
      food_name: "Burgers",
      food_interest_key: "burger",
    }),
    "wants Burgers"
  );
  assert.equal(
    formatDinerActivityLine({
      kind: "ate",
      food_name: "Korean BBQ",
    }),
    "is eating Korean BBQ"
  );
});
