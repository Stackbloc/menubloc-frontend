/**
 * MLE kitchens on diner pages (2026-10-20): cluster card links to the in-cluster kitchen;
 * restaurant page asks for the nearest kitchen and lists the others.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("cluster card carries the in-cluster kitchen (?location=)", () => {
  const card = read("src/components/cluster/ClusterRestaurantDirectoryCard.jsx");
  assert.match(card, /withClusterLocation\(menuReady && menuHref \? menuHref : profileHref, restaurant\?\.location_id\)/);
});

test("restaurant page sends ?location= and the diner's saved position, rounded", () => {
  const page = read("src/pages/RestaurantPublicPage.jsx");
  assert.match(page, /params\.set\("location", requestedLocation\)/);
  assert.match(page, /readDetectedLocation\(window\.localStorage\)/);
  assert.match(page, /diner\.lat\.toFixed\(2\)/);
  assert.match(page, /<MleLocationsSection/);
  const section = read("src/components/restaurant/MleLocationsSection.jsx");
  assert.match(section, /data-testid="mle-locations-section"/);
  assert.match(section, /if \(list\.length < 2\) return null;/);
});
