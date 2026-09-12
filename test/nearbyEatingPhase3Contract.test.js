/**
 * Who's Eating — continuous scan rows (max 8 + Show more).
 * [avatar] ScreenName, Sex, Age is eating [meal] at [restaurant|@home], [food]
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
  formatWhosEatingDiscoveryLine,
  formatWhosEatingScanIdentity,
  resolveDinerAffiliation,
} from "../src/lib/dinerDiscoverySummary.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Who's Eating mounts before Wanna Eat on eating hub", () => {
  const section = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const nearby = read("src/pages/consumer/myMenuply/NearbyEatingSection.jsx");
  const api = read("src/lib/consumerApi.js");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");

  assert.match(section, /NearbyEatingSection/);
  assert.match(section, /PROFILE_SECTION_HEADERS\.wannaEat|What I wanna eat|want-to-eat/);
  assert.match(nearby, /data-testid="see-others-nearby-eating"/);
  assert.match(nearby, /Who's Eating/);
  assert.match(nearby, /listSeeWhosEating/);
  assert.match(nearby, /fetchWantDiscovery/);
  assert.match(nearby, /whos-eating-links/);
  assert.match(nearby, /DinerActivityScanRow/);
  assert.match(nearby, /nameInProse/);
  assert.match(nearby, /placeAsText/);
  assert.match(nearby, /viewerUserId/);
  assert.match(nearby, /INITIAL_VISIBLE = 8/);
  assert.match(nearby, /whos-eating-show-more/);
  assert.doesNotMatch(nearby, /Open Feed/);
  assert.doesNotMatch(nearby, /nearby-feed-items/);
  assert.doesNotMatch(nearby, /🎥/);
  // Liberal: no favorite-food narrow on Who's Eating
  assert.doesNotMatch(nearby, /favoriteFoods/);

  const ate = section.indexOf('data-testid="what-im-eating"');
  const nearbyMount = section.indexOf("<NearbyEatingSection");
  const want = section.indexOf('data-testid="want-to-eat"');
  assert.ok(ate >= 0 && nearbyMount >= 0 && want >= 0);
  assert.ok(ate < nearbyMount, "What I'm Eating before Who's Eating");
  assert.ok(nearbyMount < want, "Who's Eating before What I Wanna Eat");
  assert.match(section, /viewerUserId=\{viewerUserId\}/);
  assert.match(page, /viewerUserId=\{consumer\?\.id/);

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

test("Who's Eating continuous: ScreenName is eating meal at restaurant, dish", () => {
  assert.equal(
    formatWhosEatingScanIdentity({
      display_name: "AndreB",
      diner_sex_short: "M",
      age_years: 34,
      school_affiliation: "USC",
      diner_occupation: "Software developer",
    }),
    "AndreB, M, 34, USC"
  );
  assert.equal(
    formatWhosEatingScanIdentity({
      display_name: "JordanK",
      diner_sex_short: "F",
      age_years: 28,
      diner_occupation: "Software developer",
    }),
    "JordanK, F, 28, Software developer"
  );
  assert.equal(
    formatWhosEatingDiscoveryLine({
      display_name: "AndreB",
      diner_sex_short: "M",
      age_years: 34,
      school_affiliation: "USC",
      item_name: "2 Protein Bowl",
      food_name: "Yoshinoya",
      restaurant_name: "Yoshinoya",
      meal_period: "lunch",
    }),
    "AndreB, M, 34, USC is eating lunch at Yoshinoya, 2 Protein Bowl."
  );
  assert.equal(
    formatWhosEatingDiscoveryLine({
      display_name: "BillS",
      food_name: "Chicken Sandwich",
      restaurant_name: "ABC Restaurant",
      meal_period: "lunch",
    }),
    "BillS is eating lunch at ABC Restaurant, Chicken Sandwich."
  );
  assert.equal(
    formatWhosEatingDiscoveryLine({
      display_name: "BillS",
      food_name: "Chicken Sandwich · ham · iced tea",
      restaurant_name: "ABC Restaurant",
      meal_period: "lunch",
    }),
    "BillS is eating lunch at ABC Restaurant, Chicken Sandwich."
  );
  assert.equal(
    formatWhosEatingDiscoveryLine({
      display_name: "AndreB",
      food_name: "Yoshinoya",
      restaurant_name: "Yoshinoya",
    }),
    "AndreB is eating at Yoshinoya."
  );
  assert.equal(
    formatWhosEatingDiscoveryLine({
      display_name: "AndreB",
      food_name: "burgers",
      homemade: true,
      meal_period: "dinner",
    }),
    "AndreB is eating dinner at @home, burgers."
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
