// 2026-11-19 — A cluster search gets Dishes · Social · Events radios, same as the Search page and
// the app (Andre 2026-11-19: "I see no signs of social search results on the cluster screen").
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (rel) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");

test("cluster search asks /search/social after the dishes, with the cluster's city and places", () => {
  const src = read("src/pages/ClusterPage.jsx");
  assert.match(src, /fetchSearchSocial\(\s*API_BASE,\s*submittedSearch\.trim\(\),\s*cluster\?\.city/);
  assert.match(src, /\(data\.menu_items \|\| \[\]\)\.map\(\(row\) => row\?\.restaurant_id\)/);
  // Extra: a failure never touches the dishes.
  assert.match(src, /setSearchSocialGroups\(g\);\s*\}\)\s*\.catch\(\(\) => undefined\)/);
});

test("Dishes · Social · Events radios; Social = people, Events = plans + events", () => {
  const src = read("src/pages/ClusterPage.jsx");
  assert.match(src, /function ClusterSearchViewRadios/);
  assert.match(src, /`Social · \$\{socialCount\}`/);
  assert.match(src, /`Events · \$\{eventsCount\}`/);
  assert.match(src, /searchSocialGroups\.people\.length/);
  assert.match(src, /searchSocialGroups\.plans\.length \+ searchSocialGroups\.events\.length/);
  assert.match(src, /data-testid="cluster-social-view"[\s\S]{0,120}<SearchPeopleSection/);
  assert.match(src, /data-testid="cluster-events-view"[\s\S]{0,160}<SearchPlansSection[\s\S]{0,120}<SearchEventsSection/);
});
