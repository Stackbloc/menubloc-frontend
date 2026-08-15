/**
 * Campus Dining contract — university-only section, reuse food_activity, no menu analysis.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const beRoot = path.join(root, "..", "menubloc-backend-main");

function read(rel, base = root) {
  return fs.readFileSync(path.join(base, rel), "utf8");
}

test("Campus Dining mounts only via CampusDiningSection on ClusterPage", () => {
  const page = read("src/pages/ClusterPage.jsx");
  assert.match(page, /CampusDiningSection/);
  assert.match(page, /WhatPeopleAreEating/);
});

test("CampusDiningSection is university-gated and hidden when empty", () => {
  const src = read("src/components/cluster/CampusDiningSection.jsx");
  assert.match(src, /university/);
  assert.match(src, /locations\.length === 0\) return null/);
  assert.match(src, /WhatDinersAreSaying/);
  assert.match(src, /fetchClusterCampusDining/);
  assert.match(src, /Dining Hall/);
  assert.match(src, /entity_label|entity_type|campus-dining-entity-type/);
  assert.doesNotMatch(src, /paywall|NONSUBSCRIBER|requireSubscription/i);
});

test("cluster API exposes campus-dining fetch", () => {
  const api = read("src/lib/clusterApi.js");
  assert.match(api, /campus-dining/);
  assert.match(api, /fetchClusterCampusDining/);
});

test("I'm Eating allows place-only share with note", () => {
  const page = read("src/pages/consumer/ImEatingPage.jsx");
  assert.match(page, /without a menu item/);
  assert.match(page, /menu_item_id: menuItem\?\.menu_item_id \|\| null/);
  const composer = read("src/components/foodActivity/ImEatingComposer.jsx");
  assert.match(composer, /No structured menu needed/);
  assert.match(composer, /required without a menu item/);
});

test("What Diners Are Saying handles place-only activity", () => {
  const src = read("src/components/restaurant/WhatDinersAreSaying.jsx");
  assert.match(src, /this place/);
  assert.match(src, /data-share-kind/);
});

test("backend campus dining migration + route + place-only food activity", () => {
  const migration = read(
    "sql/migrations/20260814_0248_cluster_campus_dining.sql",
    beRoot
  );
  assert.match(migration, /is_campus_dining/);

  const routes = read("src/routes/publicClusters.js", beRoot);
  assert.match(routes, /campus-dining/);
  assert.match(routes, /listCampusDiningLocations/);

  const service = read("src/services/clusters/clusterService.js", beRoot);
  assert.match(service, /listCampusDiningLocations/);
  assert.match(service, /is_campus_dining = TRUE/);
  assert.match(service, /university/);

  const food = read("src/services/foodActivity/foodActivityService.js", beRoot);
  assert.match(food, /comment_required_for_place_share/);
  assert.match(food, /share_kind/);
  assert.match(food, /place AS/);
  assert.doesNotMatch(food, /campus_dining_activity/);
});
